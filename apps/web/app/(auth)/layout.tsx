import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/dal";
import { Wordmark } from "@/components/brand";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Already signed in? Skip the auth screens.
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <div className="flex min-h-screen flex-col">
      <header className="px-6 py-6">
        <Wordmark />
      </header>
      <main className="flex flex-1 items-center justify-center px-6 pb-28">
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </div>
  );
}
