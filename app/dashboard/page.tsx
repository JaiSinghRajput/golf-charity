import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { currency, dateLabel } from "@/lib/utils";

type ScoresResult = Awaited<ReturnType<typeof prisma.scoreEntry.findMany>>;
type SubscriptionResult = Awaited<ReturnType<typeof prisma.subscription.findFirst>>;
type DrawResult = Awaited<ReturnType<typeof prisma.draw.findFirst>>;
type NotificationsResult = Awaited<ReturnType<typeof prisma.notification.findMany>>;
type CharitiesResult = Awaited<ReturnType<typeof prisma.charity.findMany>>;
type WinningsItem = {
  id: string;
  matchCount: number;
  amountCents: number;
  verificationStatus: string;
  payoutStatus: string;
  proofUrl: string | null;
  draw: { month: number; year: number };
};

const getWinnings = (userId: string) =>
  prisma.drawWinner.findMany({
    where: { userId },
    include: { draw: true },
    orderBy: { createdAt: "desc" }
  });

type WinningsResult = Awaited<ReturnType<typeof getWinnings>>;

export default async function DashboardPage() {
  const user = await currentUser();
  if (!user) {
    redirect("/login");
  }

  const [scores, latestSubscription, upcomingDraw, winnings, notifications, charities]: [
    ScoresResult,
    SubscriptionResult,
    DrawResult,
    WinningsResult,
    NotificationsResult,
    CharitiesResult
  ] = await Promise.all([
    prisma.scoreEntry.findMany({
      where: { userId: user.id },
      orderBy: { date: "desc" }
    }),
    prisma.subscription.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" }
    }),
    prisma.draw.findFirst({
      where: { status: { in: ["SIMULATED", "DRAFT"] } },
      orderBy: [{ year: "asc" }, { month: "asc" }]
    }),
    getWinnings(user.id),
    prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 5
    }),
    prisma.charity.findMany({
      orderBy: { name: "asc" }
    })
  ]);

  const totalWon = winnings.reduce(
    (sum: number, item: { amountCents: number }) => sum + item.amountCents,
    0
  );
  const winningsWithDraw = winnings as WinningsItem[];

  return (
    <section className="container-shell space-y-8 py-10">
      <div className="grid gap-4 md:grid-cols-3">
        <article className="card p-5">
          <p className="text-sm text-neutral-500">Subscription</p>
          <p className="mt-2 text-2xl font-semibold">{latestSubscription?.status ?? "INACTIVE"}</p>
          <p className="mt-1 text-sm text-neutral-600">
            {latestSubscription?.currentPeriodEnd
              ? `Renews ${dateLabel(latestSubscription.currentPeriodEnd)}`
              : "No active renewal date"}
          </p>
        </article>

        <article className="card p-5">
          <p className="text-sm text-neutral-500">Total winnings</p>
          <p className="mt-2 text-2xl font-semibold">{currency(totalWon)}</p>
          <p className="mt-1 text-sm text-neutral-600">Across all published draws</p>
        </article>

        <article className="card p-5">
          <p className="text-sm text-neutral-500">Selected charity</p>
          <p className="mt-2 text-2xl font-semibold">{user.selectedCharity?.name ?? "Not selected"}</p>
          <p className="mt-1 text-sm text-neutral-600">Contribution {user.contributionPercent}%</p>
        </article>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <article className="card p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold">Your latest 5 Stableford scores</h2>
            <span className="text-sm text-neutral-500">Newest first</span>
          </div>

          <form action="/api/scores" method="post" className="mt-5 grid gap-3 md:grid-cols-3">
            <input type="number" name="score" className="field" min={1} max={45} placeholder="Score" required />
            <input type="date" name="date" className="field" required />
            <button className="btn-primary font-medium">Save score</button>
          </form>

          <div className="mt-6 space-y-3">
            {scores.length === 0 && <p className="text-sm text-neutral-600">No scores added yet.</p>}
            {scores.map((entry: { id: string; score: number; date: Date }) => (
              <div key={entry.id} className="flex items-center justify-between rounded-xl border border-neutral-200 p-3">
                <div>
                  <p className="font-semibold">{entry.score} points</p>
                  <p className="text-sm text-neutral-600">{dateLabel(entry.date)}</p>
                </div>
                <form action="/api/scores" method="post">
                  <input type="hidden" name="action" value="delete" />
                  <input type="hidden" name="id" value={entry.id} />
                  <button className="rounded-full border border-neutral-300 px-3 py-1 text-sm hover:border-neutral-500">
                    Delete
                  </button>
                </form>
              </div>
            ))}
          </div>
        </article>

        <div className="space-y-6">
          <article className="card p-6">
            <h2 className="text-xl font-semibold">Activate subscription</h2>
            <p className="mt-2 text-sm text-neutral-600">
              Monthly: {currency(1500)} or Yearly: {currency(15000)}
            </p>
            <form action="/api/subscriptions/checkout" method="post" className="mt-4 space-y-3">
              <select name="plan" className="field" defaultValue="MONTHLY">
                <option value="MONTHLY">Monthly</option>
                <option value="YEARLY">Yearly</option>
              </select>
              <button className="btn-primary w-full font-medium">Continue</button>
            </form>
          </article>

          <article className="card p-6">
            <h2 className="text-xl font-semibold">Draw participation</h2>
            {upcomingDraw ? (
              <p className="mt-2 text-sm text-neutral-700">
                Upcoming draw: {upcomingDraw.month}/{upcomingDraw.year} ({upcomingDraw.status})
              </p>
            ) : (
              <p className="mt-2 text-sm text-neutral-700">No upcoming draw configured yet.</p>
            )}
          </article>

          <article className="card p-6">
            <h2 className="text-xl font-semibold">Notifications</h2>
            <ul className="mt-3 space-y-3">
              {notifications.length === 0 && (
                <li className="text-sm text-neutral-600">No notifications yet.</li>
              )}
              {notifications.map((item: { id: string; title: string; message: string }) => (
                <li key={item.id} className="rounded-lg bg-neutral-50 p-3">
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="text-sm text-neutral-600">{item.message}</p>
                </li>
              ))}
            </ul>
          </article>

          <article className="card p-6">
            <h2 className="text-xl font-semibold">Direct donation</h2>
            <form action="/api/donations" method="post" className="mt-4 space-y-3">
              <select name="charityId" className="field" defaultValue={user.selectedCharityId ?? ""}>
                {charities.map((charity: { id: string; name: string }) => (
                  <option key={charity.id} value={charity.id}>
                    {charity.name}
                  </option>
                ))}
              </select>
              <input type="number" name="amount" step="0.01" min="1" className="field" placeholder="Amount in GBP" required />
              <button className="btn-secondary w-full text-sm font-medium">Donate now</button>
            </form>
          </article>
        </div>
      </div>

      <article className="card p-6">
        <h2 className="text-xl font-semibold">Winnings and verification</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-neutral-500">
              <tr>
                <th className="px-3 py-2">Draw</th>
                <th className="px-3 py-2">Match Tier</th>
                <th className="px-3 py-2">Amount</th>
                <th className="px-3 py-2">Verification</th>
                <th className="px-3 py-2">Payout</th>
                <th className="px-3 py-2">Proof</th>
              </tr>
            </thead>
            <tbody>
              {winnings.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-4 text-neutral-600">
                    No winnings recorded yet.
                  </td>
                </tr>
              )}
              {winningsWithDraw.map((win) => (
                <tr key={win.id} className="border-t border-neutral-200">
                  <td className="px-3 py-2">
                    {win.draw.month}/{win.draw.year}
                  </td>
                  <td className="px-3 py-2">{win.matchCount} Match</td>
                  <td className="px-3 py-2">{currency(win.amountCents)}</td>
                  <td className="px-3 py-2">{win.verificationStatus}</td>
                  <td className="px-3 py-2">{win.payoutStatus}</td>
                  <td className="px-3 py-2">
                    <form action="/api/winners/proof" method="post" className="flex items-center gap-2">
                      <input type="hidden" name="winnerId" value={win.id} />
                      <input
                        type="url"
                        name="proofUrl"
                        placeholder="Proof URL"
                        defaultValue={win.proofUrl ?? ""}
                        className="field min-w-48 text-xs"
                      />
                      <button className="rounded-full border border-neutral-300 px-3 py-1 text-xs hover:border-neutral-500">
                        Submit
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}
