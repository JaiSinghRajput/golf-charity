import Link from "next/link";
import { currentUser } from "@/lib/auth";

export async function SiteHeader() {
  const user = await currentUser();

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200/70 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 md:px-8">
        <Link href="/" className="text-lg font-semibold tracking-tight text-neutral-950">
          GolfPro Impact
        </Link>

        <nav className="flex items-center gap-4 text-sm font-medium text-neutral-700">
          <Link href="/charities" className="hover:text-neutral-950">
            Charities
          </Link>
          {user && (
            <Link href="/dashboard" className="hover:text-neutral-950">
              Dashboard
            </Link>
          )}
          {user?.role === "ADMIN" && (
            <Link href="/admin" className="hover:text-neutral-950">
              Admin
            </Link>
          )}
          {!user ? (
            <>
              <Link href="/login" className="hover:text-neutral-950">
                Login
              </Link>
              <Link
                href="/signup"
                className="rounded-full bg-neutral-950 px-4 py-2 text-white transition hover:bg-neutral-800"
              >
                Subscribe
              </Link>
            </>
          ) : (
            <form action="/api/auth/logout" method="post">
              <button className="rounded-full border border-neutral-300 px-4 py-2 hover:border-neutral-500">
                Logout
              </button>
            </form>
          )}
        </nav>
      </div>
    </header>
  );
}
