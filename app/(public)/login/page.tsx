export default function LoginPage() {
  return (
    <section className="container-shell py-16">
      <div className="mx-auto max-w-md card p-8">
        <p className="eyebrow">Member Access</p>
        <h1 className="mt-2 text-2xl font-semibold">Login to your account</h1>

        <form action="/api/auth/login" method="post" className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Email</label>
            <input type="email" name="email" className="field" required />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Password</label>
            <input type="password" name="password" className="field" required />
          </div>
          <button className="btn-primary w-full font-medium">Login</button>
        </form>
      </div>
    </section>
  );
}
