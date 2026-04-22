import { DrawLogic, DrawStatus, PayoutStatus, VerificationStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { monthlyPoolBreakdown } from "@/lib/subscription";

type DrawNumberSet = [number, number, number, number, number];

const randomInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const generateRandomNumbers = (): DrawNumberSet => {
  const set = new Set<number>();
  while (set.size < 5) {
    set.add(randomInt(1, 45));
  }
  return Array.from(set).sort((a, b) => a - b) as DrawNumberSet;
};

const generateWeightedNumbers = async (): Promise<DrawNumberSet> => {
  const scoreEntries = await prisma.scoreEntry.findMany({
    select: { score: true }
  });

  if (!scoreEntries.length) {
    return generateRandomNumbers();
  }

  const frequency = new Map<number, number>();
  for (const entry of scoreEntries) {
    frequency.set(entry.score, (frequency.get(entry.score) ?? 0) + 1);
  }

  const picks = new Set<number>();
  const weighted = Array.from(frequency.entries()).flatMap(([score, count]) =>
    Array.from({ length: count }, () => score)
  );

  while (picks.size < 5 && weighted.length) {
    picks.add(weighted[randomInt(0, weighted.length - 1)]);
  }

  while (picks.size < 5) {
    picks.add(randomInt(1, 45));
  }

  return Array.from(picks).sort((a, b) => a - b) as DrawNumberSet;
};

export const createOrSimulateDraw = async (
  month: number,
  year: number,
  logic: DrawLogic
) => {
  const simulationNumbers =
    logic === DrawLogic.WEIGHTED ? await generateWeightedNumbers() : generateRandomNumbers();

  return prisma.draw.upsert({
    where: { month_year: { month, year } },
    update: {
      logic,
      simulationNumbers,
      status: DrawStatus.SIMULATED
    },
    create: {
      month,
      year,
      logic,
      simulationNumbers,
      numbers: [],
      status: DrawStatus.SIMULATED
    }
  });
};

const countMatches = (a: number[], b: number[]) => {
  const set = new Set(a);
  return b.reduce((acc, num) => (set.has(num) ? acc + 1 : acc), 0);
};

export const publishDraw = async (drawId: string) => {
  const draw = await prisma.draw.findUnique({
    where: { id: drawId }
  });

  if (!draw || !draw.simulationNumbers.length) {
    throw new Error("Draw is missing simulation numbers");
  }

  const numbers = draw.simulationNumbers;

  const activeUsers = await prisma.user.findMany({
    where: {
      subscriptions: {
        some: {
          status: "ACTIVE"
        }
      }
    },
    include: {
      scores: {
        orderBy: { date: "desc" },
        take: 5
      }
    }
  });

  await prisma.drawTicket.deleteMany({ where: { drawId } });
  if (activeUsers.length) {
    await prisma.drawTicket.createMany({
      data: activeUsers.map((user) => ({
        drawId,
        userId: user.id,
        numbers: user.scores.map((score) => score.score).sort((x, y) => x - y)
      }))
    });
  }

  const rolloverFromLast =
    (await prisma.monthlyPool.findFirst({
      where: { year: draw.year, month: draw.month - 1 },
      orderBy: { createdAt: "desc" }
    }))?.rolloverCents ?? 0;

  const pool = monthlyPoolBreakdown(activeUsers.length, rolloverFromLast);

  await prisma.monthlyPool.upsert({
    where: { month_year: { month: draw.month, year: draw.year } },
    update: {
      activeSubscribers: activeUsers.length,
      totalPoolCents: pool.totalPoolCents,
      fiveMatchPoolCents: pool.fiveMatchPoolCents,
      fourMatchPoolCents: pool.fourMatchPoolCents,
      threeMatchPoolCents: pool.threeMatchPoolCents,
      rolloverCents: 0
    },
    create: {
      month: draw.month,
      year: draw.year,
      activeSubscribers: activeUsers.length,
      totalPoolCents: pool.totalPoolCents,
      fiveMatchPoolCents: pool.fiveMatchPoolCents,
      fourMatchPoolCents: pool.fourMatchPoolCents,
      threeMatchPoolCents: pool.threeMatchPoolCents,
      rolloverCents: 0
    }
  });

  await prisma.drawWinner.deleteMany({ where: { drawId } });

  const tickets = await prisma.drawTicket.findMany({ where: { drawId } });

  const tiers = new Map<number, string[]>();
  for (const ticket of tickets) {
    const matches = countMatches(ticket.numbers, numbers);
    if (matches >= 3) {
      const list = tiers.get(matches) ?? [];
      list.push(ticket.userId);
      tiers.set(matches, list);
    }
  }

  const winners: Array<{ userId: string; matchCount: number; amountCents: number }> = [];

  for (const [matchCount, users] of tiers.entries()) {
    const tierPool =
      matchCount === 5
        ? pool.fiveMatchPoolCents
        : matchCount === 4
        ? pool.fourMatchPoolCents
        : pool.threeMatchPoolCents;

    if (users.length > 0) {
      const splitAmount = Math.floor(tierPool / users.length);
      for (const userId of users) {
        winners.push({ userId, matchCount, amountCents: splitAmount });
      }
    }
  }

  if (winners.length > 0) {
    await prisma.drawWinner.createMany({
      data: winners.map((winner) => ({
        drawId,
        userId: winner.userId,
        matchCount: winner.matchCount,
        amountCents: winner.amountCents,
        payoutStatus: PayoutStatus.PENDING,
        verificationStatus: VerificationStatus.PENDING
      }))
    });
  } else {
    await prisma.monthlyPool.update({
      where: { month_year: { month: draw.month, year: draw.year } },
      data: {
        rolloverCents: pool.fiveMatchPoolCents
      }
    });
  }

  return prisma.draw.update({
    where: { id: drawId },
    data: {
      status: DrawStatus.PUBLISHED,
      numbers,
      publishedAt: new Date()
    }
  });
};
