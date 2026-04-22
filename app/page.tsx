import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { currency } from "@/lib/utils";

export default async function Home() {
  const featured = await prisma.charity.findFirst({
    where: { featured: true }
  });

  const activeSubscribers = await prisma.subscription.count({
    where: { status: "ACTIVE" }
  });

  const projectedMonthlyPool = Math.floor(activeSubscribers * 1500 * 0.5);

  return (
    <div className="container-shell py-10 md:py-14">
      <section className="grid items-stretch gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="card p-8 md:p-10">
          <p className="eyebrow">Golf + Impact + Rewards</p>
          <h1 className="mt-3 max-w-2xl text-4xl font-semibold leading-tight md:text-5xl">
            Enter your latest five Stableford scores and compete for monthly cash draws.
          </h1>
          <p className="mt-4 max-w-xl text-neutral-700">
            Every active membership contributes to prize pools and your selected charity. Track scores,
            review draw entries, and manage winnings from one dashboard.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/signup" className="btn-primary font-medium">
              Subscribe now
            </Link>
            <Link href="/charities" className="btn-secondary font-medium">
              Explore charities
            </Link>
          </div>
        </div>

        <div className="card flex flex-col gap-5 p-6">
          <h2 className="text-lg font-semibold">Current impact snapshot</h2>
          <div className="rounded-xl bg-neutral-50 p-4">
            <p className="text-sm text-neutral-600">Projected monthly prize pool</p>
            <p className="mt-1 text-3xl font-semibold">{currency(projectedMonthlyPool)}</p>
          </div>
          <div className="rounded-xl bg-teal-50 p-4">
            <p className="text-sm text-teal-800">Active subscribers</p>
            <p className="mt-1 text-3xl font-semibold text-teal-900">{activeSubscribers}</p>
          </div>
          {featured && (
            <article className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
              <Image
                src={featured.imageUrl}
                alt={featured.name}
                width={1200}
                height={500}
                className="h-40 w-full object-cover"
              />
              <div className="p-4">
                <p className="eyebrow">Featured Charity</p>
                <h3 className="mt-2 text-xl font-semibold">{featured.name}</h3>
                <p className="mt-1 text-sm text-neutral-700">{featured.description}</p>
              </div>
            </article>
          )}
        </div>
      </section>
    </div>
  );
}
