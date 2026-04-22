import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { currency, dateLabel } from "@/lib/utils";

export default async function AdminPage() {
  const user = await currentUser();
  if (!user || user.role !== UserRole.ADMIN) {
    redirect("/");
  }

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const [users, activeSubscribers, charities, draws, winners, pools, donations] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        selectedCharity: true,
        subscriptions: {
          orderBy: { createdAt: "desc" },
          take: 1
        }
      }
    }),
    prisma.subscription.count({ where: { status: "ACTIVE" } }),
    prisma.charity.findMany({ orderBy: { name: "asc" } }),
    prisma.draw.findMany({ orderBy: [{ year: "desc" }, { month: "desc" }] }),
    prisma.drawWinner.findMany({
      orderBy: { createdAt: "desc" },
      take: 30,
      include: { user: true, draw: true }
    }),
    prisma.monthlyPool.findMany({
      orderBy: [{ year: "desc" }, { month: "desc" }],
      take: 12
    }),
    prisma.donation.aggregate({
      _sum: {
        amountCents: true
      }
    })
  ]);

  const typedUsers: Awaited<ReturnType<typeof prisma.user.findMany>> = users;
  const typedCharities: Awaited<ReturnType<typeof prisma.charity.findMany>> = charities;
  const typedDraws: Awaited<ReturnType<typeof prisma.draw.findMany>> = draws;
  const typedWinners: Awaited<ReturnType<typeof prisma.drawWinner.findMany>> = winners;
  const typedPools: Awaited<ReturnType<typeof prisma.monthlyPool.findMany>> = pools;

  const totalPool = typedPools.reduce((sum, item) => sum + item.totalPoolCents, 0);

  return (
    <section className="container-shell space-y-8 py-10">
      <h1 className="text-3xl font-semibold">Admin Operations</h1>

      <div className="grid gap-4 md:grid-cols-4">
        <article className="card p-4">
          <p className="text-sm text-neutral-500">Total users</p>
          <p className="mt-2 text-2xl font-semibold">{users.length}</p>
        </article>
        <article className="card p-4">
          <p className="text-sm text-neutral-500">Active subscribers</p>
          <p className="mt-2 text-2xl font-semibold">{activeSubscribers}</p>
        </article>
        <article className="card p-4">
          <p className="text-sm text-neutral-500">Prize pools tracked</p>
          <p className="mt-2 text-2xl font-semibold">{currency(totalPool)}</p>
        </article>
        <article className="card p-4">
          <p className="text-sm text-neutral-500">Charity contributions</p>
          <p className="mt-2 text-2xl font-semibold">{currency(donations._sum.amountCents ?? 0)}</p>
        </article>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <article className="card p-6">
          <h2 className="text-xl font-semibold">Draw management</h2>
          <form action="/api/admin/draws/run" method="post" className="mt-4 grid gap-3 md:grid-cols-4">
            <input type="number" name="month" defaultValue={month} min={1} max={12} className="field" required />
            <input type="number" name="year" defaultValue={year} min={2024} className="field" required />
            <select name="logic" className="field">
              <option value="RANDOM">Random</option>
              <option value="WEIGHTED">Weighted</option>
            </select>
            <button className="btn-primary">Simulate</button>
          </form>

          <div className="mt-5 space-y-3">
            {typedDraws.map((draw) => (
              <div key={draw.id} className="rounded-xl border border-neutral-200 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium">
                    {draw.month}/{draw.year} - {draw.status}
                  </p>
                  {draw.status !== "PUBLISHED" && (
                    <form action="/api/admin/draws/publish" method="post">
                      <input type="hidden" name="drawId" value={draw.id} />
                      <button className="rounded-full border border-neutral-300 px-3 py-1 text-sm hover:border-neutral-500">
                        Publish
                      </button>
                    </form>
                  )}
                </div>
                <p className="mt-2 text-sm text-neutral-600">
                  Simulation: {draw.simulationNumbers.join(", ") || "Not generated"} | Published: {draw.numbers.join(", ") || "-"}
                </p>
              </div>
            ))}
          </div>
        </article>

        <article className="card p-6">
          <h2 className="text-xl font-semibold">Charity management</h2>
          <form action="/api/admin/charities" method="post" className="mt-4 space-y-3">
            <input name="name" placeholder="Name" className="field" required />
            <textarea name="description" placeholder="Description" className="field min-h-24" required />
            <input name="imageUrl" type="url" placeholder="Image URL" className="field" required />
            <textarea
              name="eventsJson"
              placeholder='Events JSON, e.g. [{"name":"Open","date":"2026-10-01","location":"London"}]'
              className="field min-h-24"
            />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="featured" /> Featured
            </label>
            <button className="btn-primary">Save charity</button>
          </form>

          <ul className="mt-5 space-y-2 text-sm text-neutral-700">
            {typedCharities.map((charity) => (
              <li key={charity.id} className="rounded-lg bg-neutral-50 px-3 py-2">
                {charity.name}
              </li>
            ))}
          </ul>
        </article>
      </div>

      <article className="card p-6">
        <h2 className="text-xl font-semibold">Winners verification and payouts</h2>
        <div className="mt-4 space-y-3">
          {typedWinners.length === 0 && <p className="text-sm text-neutral-600">No winners found.</p>}
          {typedWinners.map((winner) => (
            <div key={winner.id} className="rounded-xl border border-neutral-200 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium">
                  {winner.user.email} - {winner.matchCount} Match - {currency(winner.amountCents)}
                </p>
                <p className="text-sm text-neutral-600">
                  Draw {winner.draw.month}/{winner.draw.year}
                </p>
              </div>
              <p className="mt-1 text-sm text-neutral-600">
                Verification: {winner.verificationStatus} | Payout: {winner.payoutStatus}
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                <form action={`/api/admin/winners/${winner.id}/verify`} method="post" className="flex items-center gap-2">
                  <select name="verificationStatus" className="field text-sm">
                    <option value="APPROVED">Approve</option>
                    <option value="REJECTED">Reject</option>
                  </select>
                  <input name="proofUrl" className="field text-sm" placeholder="Proof URL" />
                  <button className="rounded-full border border-neutral-300 px-3 py-1 text-sm hover:border-neutral-500">
                    Update
                  </button>
                </form>
                <form action={`/api/admin/winners/${winner.id}/pay`} method="post">
                  <button className="btn-secondary text-sm">Mark paid</button>
                </form>
              </div>
            </div>
          ))}
        </div>
      </article>

      <article className="card p-6">
        <h2 className="text-xl font-semibold">User and subscription overview</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-neutral-500">
              <tr>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Charity</th>
                <th className="px-3 py-2">Subscription</th>
                <th className="px-3 py-2">Created</th>
              </tr>
            </thead>
            <tbody>
              {typedUsers.map((account) => (
                <tr key={account.id} className="border-t border-neutral-200">
                  <td className="px-3 py-2">{account.name}</td>
                  <td className="px-3 py-2">{account.email}</td>
                  <td className="px-3 py-2">{account.selectedCharity?.name ?? "-"}</td>
                  <td className="px-3 py-2">{account.subscriptions[0]?.status ?? "NONE"}</td>
                  <td className="px-3 py-2">{dateLabel(account.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}
