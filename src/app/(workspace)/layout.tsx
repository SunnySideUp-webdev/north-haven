import { redirect } from "next/navigation";

import { requireAuthenticatedContext } from "@/server/auth/session";
import { AppShell } from "@/shared/ui/app-shell";

export default async function WorkspaceLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { profile } = await requireAuthenticatedContext();

  if (!profile?.setup_completed_at) {
    redirect("/setup");
  }

  return <AppShell displayName={profile.display_name}>{children}</AppShell>;
}
