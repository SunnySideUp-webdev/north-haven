import type { Metadata } from "next";
import Link from "next/link";

import { AuthFrame } from "@/features/auth/components/auth-frame";
import { SignInForm } from "@/features/auth/components/sign-in-form";
import { redirectAuthenticatedUser } from "@/server/auth/session";

export const metadata: Metadata = { title: "Sign in" };

export default async function SignInPage() {
  await redirectAuthenticatedUser();

  return (
    <AuthFrame
      title="Welcome back"
      description="Your workday is waiting exactly where you left it."
      footer={
        <p>
          New to North Haven?{" "}
          <Link
            href="/create-account"
            className="text-lavender-700 hover:text-lavender-500 font-bold"
          >
            Create your account
          </Link>
        </p>
      }
    >
      <SignInForm />
      <p className="text-quiet mt-7 text-xs leading-5">
        North Haven stores only the work information you choose to enter. Your
        session is protected and your workspace remains private.
      </p>
    </AuthFrame>
  );
}
