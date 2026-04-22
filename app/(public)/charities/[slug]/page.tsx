import { notFound } from "next/navigation";
import Image from "next/image";
import { prisma } from "@/lib/prisma";

type CharityEvent = {
  name?: string;
  date?: string;
  location?: string;
};

export default async function CharityDetailPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const charity = await prisma.charity.findUnique({ where: { slug } });

  if (!charity) {
    notFound();
  }

  const events = Array.isArray(charity.events) ? (charity.events as CharityEvent[]) : [];

  return (
    <section className="container-shell py-10">
      <article className="card overflow-hidden">
        <Image
          src={charity.imageUrl}
          alt={charity.name}
          width={1600}
          height={800}
          className="h-80 w-full object-cover"
        />
        <div className="grid gap-8 p-8 lg:grid-cols-[1.5fr_1fr]">
          <div>
            <h1 className="text-3xl font-semibold">{charity.name}</h1>
            <p className="mt-4 leading-7 text-neutral-700">{charity.description}</p>
          </div>
          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5">
            <h2 className="text-lg font-semibold">Upcoming events</h2>
            <ul className="mt-4 space-y-3 text-sm text-neutral-700">
              {events.length === 0 && <li>No upcoming events published yet.</li>}
              {events.map((event) => {
                const item = event;
                return (
                  <li key={`${item.name}-${item.date}`} className="rounded-lg bg-white p-3">
                    <p className="font-medium text-neutral-900">{item.name}</p>
                    <p>{item.date}</p>
                    <p>{item.location}</p>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </article>
    </section>
  );
}
