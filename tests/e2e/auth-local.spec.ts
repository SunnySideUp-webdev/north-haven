import { expect, test } from "@playwright/test";

test.skip(
  !process.env.RUN_SUPABASE_E2E,
  "Requires the Docker-backed local Supabase stack.",
);

test("creates a private workspace, completes setup, and restores the session", async ({
  page,
}) => {
  const email = `north-haven-${Date.now()}@example.com`;
  const password = "north-haven-test-password";

  await page.goto("/create-account");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel(/^Password/).fill(password);
  await page.getByLabel("Confirm password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page).toHaveURL(/\/setup$/);
  await page.getByLabel("Display name").fill("North Haven Test");
  await page.getByRole("button", { name: "Finish setup" }).click();

  await expect(page).toHaveURL(/\/today$/);
  await expect(
    page.getByRole("heading", { level: 1, name: "Today" }),
  ).toBeVisible();
  await expect(
    page.getByText("North Haven Test", { exact: true }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/sign-in$/);

  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page).toHaveURL(/\/today$/);
});
