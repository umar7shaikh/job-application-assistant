import type { Metadata } from "next";
import Link from "next/link";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = { title: "Create account · Lever" };

export default function SignupPage() {
  return (
    <div>
      <h1 className="font-comic text-4xl tracking-wide text-ink">
        Create your account
      </h1>
      <p className="mt-2 text-sm font-medium text-ink/70">
        Start tailoring applications in minutes.
      </p>
      <div className="mt-8">
        <SignupForm />
      </div>
      <p className="mt-6 text-sm text-ink-soft">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-accent hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
