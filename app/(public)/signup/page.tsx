import { prisma } from "@/lib/prisma";

export default async function SignupPage() {
  const charities = await prisma.charity.findMany({
    orderBy: { name: "asc" }
  });

  return (
    <section className="container-shell py-16">
      <div className="mx-auto max-w-2xl card p-8">
        <p className="eyebrow">Start Membership</p>
        <h1 className="mt-2 text-2xl font-semibold">Create your account and pick a charity</h1>

        <form action="/api/auth/signup" method="post" className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium">Full name</label>
            <input type="text" name="name" className="field" required />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Email</label>
            <input type="email" name="email" className="field" required />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Password</label>
            <input type="password" name="password" className="field" minLength={8} required />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Charity</label>
            <select name="charityId" className="field" required>
              {charities.map((charity) => (
                <option key={charity.id} value={charity.id}>
                  {charity.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Contribution %</label>
            <input type="number" name="contributionPercent" className="field" min={10} max={90} defaultValue={10} required />
          </div>
          <button className="btn-primary mt-2 md:col-span-2 font-medium">Create account</button>
        </form>
      </div>
    </section>
  );
}
