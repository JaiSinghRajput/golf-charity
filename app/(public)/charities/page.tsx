import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";

export default async function CharitiesPage() {
  const charities = await prisma.charity.findMany({
    orderBy: [{ featured: "desc" }, { name: "asc" }]
  });

  return (
    <section className="container-shell py-10">
      <div className="mb-8">
        <p className="eyebrow">Charity Directory</p>
        <h1 className="mt-2 text-3xl font-semibold md:text-4xl">Choose where your membership gives back</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {charities.map((charity) => (
          <article key={charity.id} className="card overflow-hidden">
            <Image
              src={charity.imageUrl}
              alt={charity.name}
              width={1200}
              height={600}
              className="h-48 w-full object-cover"
            />
            <div className="space-y-4 p-5">
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-xl font-semibold">{charity.name}</h2>
                {charity.featured && (
                  <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-700">
                    Featured
                  </span>
                )}
              </div>
              <p className="text-sm text-neutral-700">{charity.description}</p>
              <Link href={`/charities/${charity.slug}`} className="btn-secondary inline-block text-sm font-medium">
                View Charity
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
