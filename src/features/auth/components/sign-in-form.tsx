"use client";

import Link from "next/link";
import { useActionState } from "react";

import { signInAction } from "@/features/auth/actions";
import {
  fieldClassName,
  FormMessage,
  SubmitButton,
} from "@/features/auth/components/form-controls";
import { initialAuthFormState } from "@/features/auth/types";

export function SignInForm() {
  const [state, action] = useActionState(signInAction, initialAuthFormState);

  return (
    <form action={action} className="space-y-5">
      <FormMessage message={state.message} status={state.status} />
      <label className="text-ink block text-sm font-bold">
        Email
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          className={`${fieldClassName} mt-2`}
        />
      </label>
      <label className="text-ink block text-sm font-bold">
        Password
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          minLength={12}
          className={`${fieldClassName} mt-2`}
        />
      </label>
      <div className="flex justify-end">
        <Link
          href="/forgot-password"
          className="text-lavender-700 hover:text-lavender-500 text-sm font-bold"
        >
          Forgot password?
        </Link>
      </div>
      <SubmitButton pendingLabel="Signing in…">Sign in</SubmitButton>
    </form>
  );
}
