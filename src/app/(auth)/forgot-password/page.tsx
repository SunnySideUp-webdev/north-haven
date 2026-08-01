import type { Metadata } from "next";
import Link from "next/link";

import { AuthFrame } from "@/features/auth/components/auth-frame";
import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form";

export const metadata: Metadata = { title: "Reset password" };

export default function ForgotPasswordPage() {
  return (
    <AuthFrame
      title="Reset your password"
      description="Enter your email and we'll send a secure reset link."
      footer={
        <Link
          href="/sign-in"
          className="text-lavender-700 hover:text-lavender-500 font-bold"
        >
          Return to sign in
        </Link>
      }
    >
      <ForgotPasswordForm />
    </AuthFrame>
  );
}
