import { createClient } from "@supabase/supabase-js";
import { loadEnv } from "vite";
import { describe, expect, it } from "vitest";

import type { Database } from "@/server/database/supabase/database.types";

const runLocalIntegration = Boolean(process.env.RUN_SUPABASE_INTEGRATION);
const localEnvironment = loadEnv("test", process.cwd(), "");

describe.skipIf(!runLocalIntegration)("local workspace RLS", () => {
  it("keeps two authenticated workspaces isolated", async () => {
    const url =
      process.env.NEXT_PUBLIC_SUPABASE_URL ??
      localEnvironment.NEXT_PUBLIC_SUPABASE_URL;
    const key =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      localEnvironment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    expect(url).toBeTruthy();
    expect(key).toBeTruthy();

    const clientA = createClient<Database>(url!, key!, {
      auth: { persistSession: false },
    });
    const clientB = createClient<Database>(url!, key!, {
      auth: { persistSession: false },
    });
    const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const password = "north-haven-integration-password";

    const { error: signUpErrorA } = await clientA.auth.signUp({
      email: `rls-a-${suffix}@example.com`,
      password,
    });
    const { error: signUpErrorB } = await clientB.auth.signUp({
      email: `rls-b-${suffix}@example.com`,
      password,
    });

    expect(signUpErrorA).toBeNull();
    expect(signUpErrorB).toBeNull();

    const { data: workspacesA, error: workspacesErrorA } = await clientA
      .from("workspaces")
      .select("id, name");
    const { data: workspacesB, error: workspacesErrorB } = await clientB
      .from("workspaces")
      .select("id, name");

    expect(workspacesErrorA).toBeNull();
    expect(workspacesErrorB).toBeNull();
    expect(workspacesA).toHaveLength(1);
    expect(workspacesB).toHaveLength(1);
    expect(workspacesA?.[0].id).not.toBe(workspacesB?.[0].id);

    const { data: attemptedUpdate, error: attemptedUpdateError } = await clientB
      .from("workspaces")
      .update({ name: "Cross-workspace update" })
      .eq("id", workspacesA![0].id)
      .select("id");

    expect(attemptedUpdateError).toBeNull();
    expect(attemptedUpdate).toEqual([]);

    const { data: workspaceAAfter } = await clientA
      .from("workspaces")
      .select("name")
      .eq("id", workspacesA![0].id)
      .single();

    expect(workspaceAAfter?.name).toBe("North Haven");
  });
});
