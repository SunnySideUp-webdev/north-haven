"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import type { AuthFormState } from "@/features/auth/types";
import {
  createAccountSchema,
  emailSchema,
  setupSchema,
  signInSchema,
  updatePasswordSchema,
} from "@/features/auth/validation";
import { requireAuthenticatedContext } from "@/server/auth/session";
import { createClient } from "@/server/database/supabase/server";

function invalidForm(message: string): AuthFormState {
  return { message, status: "error" };
}

export async function signInAction(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const result = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!result.success) {
    return invalidForm("Enter a valid email and password.");
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(result.data);

  if (error || !data.user) {
    return invalidForm(
      "We couldn't sign you in. Check your details and try again.",
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("setup_completed_at")
    .eq("id", data.user.id)
    .maybeSingle();

  redirect(profile?.setup_completed_at ? "/today" : "/setup");
}

export async function createAccountAction(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const result = createAccountSchema.safeParse({
    confirmPassword: formData.get("confirmPassword"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!result.success) {
    return invalidForm(
      "Use a valid email, matching passwords, and at least 12 characters.",
    );
  }

  const requestHeaders = await headers();
  const origin =
    requestHeaders.get("origin") ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://127.0.0.1:3000";
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: result.data.email,
    options: {
      data: { display_name: result.data.email.split("@")[0] },
      emailRedirectTo: `${origin}/auth/callback?next=/setup`,
    },
    password: result.data.password,
  });

  if (error) {
    return invalidForm(
      "We couldn't create the account. Review the details and try again.",
    );
  }

  if (!data.session) {
    return {
      message: "Check your email to finish creating your account.",
      status: "success",
    };
  }

  redirect("/setup");
}

export async function forgotPasswordAction(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const result = emailSchema.safeParse({ email: formData.get("email") });

  if (!result.success) {
    return invalidForm("Enter a valid email address.");
  }

  const requestHeaders = await headers();
  const origin =
    requestHeaders.get("origin") ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://127.0.0.1:3000";
  const supabase = await createClient();

  await supabase.auth.resetPasswordForEmail(result.data.email, {
    redirectTo: `${origin}/auth/callback?next=/update-password`,
  });

  return {
    message:
      "If an account matches that email, password reset instructions are on the way.",
    status: "success",
  };
}

export async function updatePasswordAction(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const result = updatePasswordSchema.safeParse({
    confirmPassword: formData.get("confirmPassword"),
    password: formData.get("password"),
  });

  if (!result.success) {
    return invalidForm("Use matching passwords with at least 12 characters.");
  }

  const { supabase } = await requireAuthenticatedContext();
  const { error } = await supabase.auth.updateUser({
    password: result.data.password,
  });

  if (error) {
    return invalidForm("We couldn't update your password. Try again.");
  }

  redirect("/today");
}

export async function completeSetupAction(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const result = setupSchema.safeParse({
    displayName: formData.get("displayName"),
    endsAtLocal: formData.get("endsAtLocal"),
    startsAtLocal: formData.get("startsAtLocal"),
    timeZone: formData.get("timeZone"),
    workingWeekdays: formData.getAll("workingWeekdays"),
  });

  if (!result.success) {
    return invalidForm(
      "Review your name, time zone, workdays, and working hours.",
    );
  }

  const { supabase } = await requireAuthenticatedContext();
  const { error } = await supabase.rpc("complete_initial_setup", {
    chosen_display_name: result.data.displayName,
    chosen_ends_at_local: result.data.endsAtLocal,
    chosen_starts_at_local: result.data.startsAtLocal,
    chosen_time_zone: result.data.timeZone,
    chosen_working_weekdays: result.data.workingWeekdays,
  });

  if (error) {
    return invalidForm("We couldn't save your setup. Try again.");
  }

  revalidatePath("/", "layout");
  redirect("/today");
}
