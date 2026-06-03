import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in · Lever" };

export default function LoginPage() {
  return (
    <div>
      <h1 className="font-comic text-4xl tracking-wide text-ink">
        Welcome back
      </h1>
      <p className="mt-2 text-sm font-medium text-ink/70">
        Sign in to continue to your workspace.
      </p>
      <div className="mt-8">
        <LoginForm />
      </div>
      <p className="mt-6 text-sm text-ink-soft">
        No account yet?{" "}
        <Link href="/signup" className="font-medium text-accent hover:underline">
          Create one
        </Link>
      </p>
    </div>
  );
}
