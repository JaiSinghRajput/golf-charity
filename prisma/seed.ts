import { hashSync } from "bcryptjs";
import { prisma } from "../lib/prisma";

const charities = [
  {
    name: "First Tee Futures",
    slug: "first-tee-futures",
    description:
      "Expands youth access to golf and life-skills coaching in underserved communities.",
    imageUrl:
      "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?auto=format&fit=crop&w=1200&q=80",
    events: [
      { name: "Junior Golf Day", date: "2026-05-18", location: "Manchester" },
      { name: "Mentor Pairing Weekend", date: "2026-06-05", location: "Birmingham" }
    ],
    featured: true
  },
  {
    name: "Greens for Good",
    slug: "greens-for-good",
    description:
      "Funds community wellness and green-space restoration through local sports initiatives.",
    imageUrl:
      "https://images.unsplash.com/photo-1470004914212-05527e49370b?auto=format&fit=crop&w=1200&q=80",
    events: [
      { name: "City Charity Open", date: "2026-07-09", location: "Leeds" }
    ],
    featured: false
  },
  {
    name: "Birdies & Hope",
    slug: "birdies-and-hope",
    description:
      "Supports hospital family funds and patient recovery activity programmes.",
    imageUrl:
      "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1200&q=80",
    events: [
      { name: "Hospital Benefit Cup", date: "2026-08-11", location: "Bristol" }
    ],
    featured: false
  }
];

async function main() {
  for (const charity of charities) {
    await prisma.charity.upsert({
      where: { slug: charity.slug },
      update: charity,
      create: charity
    });
  }

  const adminPassword = "Admin123!";
  await prisma.user.upsert({
    where: { email: "admin@golfpro.app" },
    update: {
      name: "Platform Admin",
      role: "ADMIN",
      passwordHash: hashSync(adminPassword, 12)
    },
    create: {
      name: "Platform Admin",
      email: "admin@golfpro.app",
      role: "ADMIN",
      passwordHash: hashSync(adminPassword, 12),
      contributionPercent: 10
    }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    throw error;
  });
