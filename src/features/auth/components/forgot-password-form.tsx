"use client";

import { useActionState } from "react";

import { forgotPasswordAction } from "@/features/auth/actions";
import {
  fieldClassName,
  FormMessage,
  SubmitButton,
} from "@/features/auth/components/form-controls";
import { initialAuthFormState } from "@/features/auth/types";

export function ForgotPasswordForm() {
  const [state, action] = useActionState(
    forgotPasswordAction,
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
      <SubmitButton pendingLabel="Sending instructions…">
        Send reset instructions
      </SubmitButton>
    </form>
  );
}
