"use client";

import { useActionState } from "react";

import { createAccountAction } from "@/features/auth/actions";
import {
  fieldClassName,
  FormMessage,
  SubmitButton,
} from "@/features/auth/components/form-controls";
import { initialAuthFormState } from "@/features/auth/types";

export function CreateAccountForm() {
  const [state, action] = useActionState(
    createAccountAction,
    initialAuthFormState,
  );

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
          autoComplete="new-password"
          required
          minLength={12}
          className={`${fieldClassName} mt-2`}
        />
        <span className="text-quiet mt-2 block text-xs font-normal">
          Use at least 12 characters.
        </span>
      </label>
      <label className="text-ink block text-sm font-bold">
        Confirm password
        <input
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={12}
          className={`${fieldClassName} mt-2`}
        />
      </label>
      <SubmitButton pendingLabel="Creating account…">
        Create account
      </SubmitButton>
    </form>
  );
}
