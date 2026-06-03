import Link from "next/link";
import { requireUser } from "@/lib/dal";
import { logout } from "@/app/actions/auth";
import { Wordmark } from "@/components/brand";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-8">
            <Wordmark href="/dashboard" />
            <nav className="hidden items-center gap-6 text-sm text-ink-soft sm:flex">
              <Link href="/dashboard" className="transition-colors hover:text-ink">
                Dashboard
              </Link>
              <Link href="/resumes" className="transition-colors hover:text-ink">
                Resumes
              </Link>
              <Link href="/jobs" className="transition-colors hover:text-ink">
                Jobs
              </Link>
              <Link
                href="/applications"
                className="transition-colors hover:text-ink"
              >
                Applications
              </Link>
              <Link href="/settings" className="transition-colors hover:text-ink">
                Settings
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-ink-soft sm:block">
              {user.email}
            </span>
            <form action={logout}>
              <button className="text-sm text-ink-soft transition-colors hover:text-ink">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
        {children}
      </main>
    </div>
  );
}
