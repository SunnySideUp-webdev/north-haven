import { redirect } from "next/navigation";

import { getAuthContext } from "@/server/auth/session";

export default async function HomePage() {
  const { profile, userId } = await getAuthContext();

  if (!userId) {
    redirect("/sign-in");
  }

  redirect(profile?.setup_completed_at ? "/today" : "/setup");
}
