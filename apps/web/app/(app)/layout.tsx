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

  const navLinks = [
    ["Dashboard", "/dashboard"],
    ["Resumes", "/resumes"],
    ["Jobs", "/jobs"],
    ["Applications", "/applications"],
    ["Settings", "/settings"],
  ] as const;

  return (
    <div className="halftone-bg flex min-h-screen flex-col bg-paper">
      <header className="border-b-[3px] border-ink bg-paper">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-8">
            <Wordmark href="/dashboard" />
            <nav className="hidden items-center gap-5 text-sm font-bold uppercase tracking-wide text-ink/55 sm:flex">
              {navLinks.map(([label, href]) => (
                <Link
                  key={href}
                  href={href}
                  className="transition-colors hover:text-ink"
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden text-sm font-medium text-ink/55 sm:block">
              {user.email}
            </span>
            <form action={logout}>
              <button className="ink-edge-sm rounded-lg bg-white px-3 py-1.5 text-xs font-extrabold uppercase tracking-wide text-ink transition-transform hover:-translate-y-0.5">
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
