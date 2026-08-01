import type { Metadata } from "next";
import Link from "next/link";

import { AuthFrame } from "@/features/auth/components/auth-frame";
import { CreateAccountForm } from "@/features/auth/components/create-account-form";
import { redirectAuthenticatedUser } from "@/server/auth/session";

export const metadata: Metadata = { title: "Create account" };

export default async function CreateAccountPage() {
  await redirectAuthenticatedUser();

  return (
    <AuthFrame
      title="Create your workspace"
      description="Set up a private place for tomorrow's plan and today's focus."
      footer={
        <p>
          Already have an account?{" "}
          <Link
            href="/sign-in"
            className="text-lavender-700 hover:text-lavender-500 font-bold"
          >
            Sign in
          </Link>
        </p>
      }
    >
      <CreateAccountForm />
    </AuthFrame>
  );
}
