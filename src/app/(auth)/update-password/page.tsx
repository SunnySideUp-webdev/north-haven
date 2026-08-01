import type { Metadata } from "next";

import { AuthFrame } from "@/features/auth/components/auth-frame";
import { UpdatePasswordForm } from "@/features/auth/components/update-password-form";
import { requireAuthenticatedContext } from "@/server/auth/session";

export const metadata: Metadata = { title: "Choose a new password" };

export default async function UpdatePasswordPage() {
  await requireAuthenticatedContext();

  return (
    <AuthFrame
      title="Choose a new password"
      description="Use at least 12 characters that you do not reuse elsewhere."
    >
      <UpdatePasswordForm />
    </AuthFrame>
  );
}
