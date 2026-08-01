import { z } from "zod";

const publicSupabaseEnvironmentSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
});

const serverSupabaseEnvironmentSchema = publicSupabaseEnvironmentSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
});

const googleCalendarEnvironmentSchema = z.object({
  GOOGLE_CALENDAR_CLIENT_ID: z.string().min(10),
  GOOGLE_CALENDAR_CLIENT_SECRET: z.string().min(10),
  GOOGLE_CALENDAR_TOKEN_ENCRYPTION_KEY: z.string().min(40),
});

export function getPublicSupabaseEnvironment() {
  const result = publicSupabaseEnvironmentSchema.safeParse({
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });

  if (!result.success) {
    throw new Error("Supabase public environment is not configured.");
  }

  return result.data;
}

export function getServerSupabaseEnvironment() {
  const result = serverSupabaseEnvironmentSchema.safeParse({
    ...getPublicSupabaseEnvironment(),
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  });

  if (!result.success) {
    throw new Error("Supabase server environment is not configured.");
  }

  return result.data;
}

export function getGoogleCalendarEnvironment() {
  const result = googleCalendarEnvironmentSchema.safeParse({
    GOOGLE_CALENDAR_CLIENT_ID: process.env.GOOGLE_CALENDAR_CLIENT_ID,
    GOOGLE_CALENDAR_CLIENT_SECRET: process.env.GOOGLE_CALENDAR_CLIENT_SECRET,
    GOOGLE_CALENDAR_TOKEN_ENCRYPTION_KEY:
      process.env.GOOGLE_CALENDAR_TOKEN_ENCRYPTION_KEY,
  });

  if (
    !result.success ||
    result.data.GOOGLE_CALENDAR_CLIENT_ID.startsWith("replace-") ||
    result.data.GOOGLE_CALENDAR_CLIENT_SECRET.startsWith("replace-") ||
    result.data.GOOGLE_CALENDAR_TOKEN_ENCRYPTION_KEY.startsWith("replace-")
  ) {
    return null;
  }

  return result.data;
}
