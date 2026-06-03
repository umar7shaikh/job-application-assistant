"use client";

import { useActionState } from "react";
import { signup, type AuthState } from "@/app/actions/auth";
import { TextField } from "@/components/ui/text-field";
import { SubmitButton } from "@/components/ui/submit-button";

export function SignupForm() {
  const [state, action] = useActionState<AuthState, FormData>(
    signup,
    undefined
  );

  return (
    <form action={action} className="space-y-5">
      {state?.error ? (
        <p className="rounded-md border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger">
          {state.error}
        </p>
      ) : null}
      <TextField
        label="Name"
        name="name"
        autoComplete="name"
        placeholder="Ada Lovelace"
        errors={state?.fieldErrors?.name}
      />
      <TextField
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        errors={state?.fieldErrors?.email}
      />
      <TextField
        label="Password"
        name="password"
        type="password"
        autoComplete="new-password"
        placeholder="At least 8 characters"
        errors={state?.fieldErrors?.password}
      />
      <SubmitButton className="w-full" pendingLabel="Creating account…">
        Create account
      </SubmitButton>
    </form>
  );
}
