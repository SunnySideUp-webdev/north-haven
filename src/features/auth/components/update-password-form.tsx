"use client";

import { useActionState } from "react";

import { updatePasswordAction } from "@/features/auth/actions";
import {
  fieldClassName,
  FormMessage,
  SubmitButton,
} from "@/features/auth/components/form-controls";
import { initialAuthFormState } from "@/features/auth/types";

export function UpdatePasswordForm() {
  const [state, action] = useActionState(
    updatePasswordAction,
    initialAuthFormState,
  );

  return (
    <form action={action} className="space-y-5">
      <FormMessage message={state.message} status={state.status} />
      <label className="text-ink block text-sm font-bold">
        New password
        <input
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={12}
          className={`${fieldClassName} mt-2`}
        />
      </label>
      <label className="text-ink block text-sm font-bold">
        Confirm new password
        <input
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={12}
          className={`${fieldClassName} mt-2`}
        />
      </label>
      <SubmitButton pendingLabel="Updating password…">
        Update password
      </SubmitButton>
    </form>
  );
}
