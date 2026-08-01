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

  await page.keyboard.press("Control+K");
  await expect(
    page.getByRole("heading", { level: 2, name: "Quick add" }),
  ).toBeVisible();
  await page.getByRole("link", { name: /New task/ }).click();
  await page.getByLabel("Task title").fill("Prepare weekly summary");
  await page
    .getByLabel("Notes")
    .fill("Summarize the work completed for leadership.");
  await page.getByRole("button", { name: "Create task" }).click();

  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Prepare weekly summary",
    }),
  ).toBeVisible();
  await page.getByLabel("Reason").fill("Waiting for leadership confirmation");
  await page.getByLabel("Waiting on").fill("Team lead");
  await page.getByRole("button", { name: "Save follow-up" }).click();
  await page.getByRole("button", { name: "Mark completed" }).click();
  await expect(
    page.getByRole("heading", { level: 2, name: "Follow-up history" }),
  ).toBeVisible();
  await expect(page.getByText("Completed ·", { exact: false })).toBeVisible();

  await page.getByRole("link", { name: "Edit" }).click();
  await page.getByLabel("Tracking").selectOption("closed");
  await page.getByRole("button", { name: "Save task" }).click();

  await expect(page.getByText("Task · Closed", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Work" }).click();
  await page.getByRole("button", { name: /^Closed/ }).click();
  await expect(
    page.getByRole("link", { name: "Prepare weekly summary" }),
  ).toBeVisible();

  await page.getByRole("link", { name: "Settings" }).click();
  await page.getByLabel("New ticket type").fill("Redirect");
  await page.getByRole("button", { name: "Add type" }).click();
  await expect(page.locator('input[name="name"]').last()).toHaveValue(
    "Redirect",
  );

  await page.keyboard.press("Control+K");
  await page.getByRole("link", { name: /New task/ }).click();
  await page.getByLabel("Task title").fill("Review tomorrow's requests");
  await page.getByRole("button", { name: "Create task" }).click();
  await page.getByRole("link", { name: "Plan" }).click();
  await page
    .getByRole("button", { name: "Add Review tomorrow's requests" })
    .click();
  await page.getByRole("button", { name: "Mark ready" }).click();
  await expect(page.getByText("ready", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Today" }).click();
  await expect(page.getByText("Review tomorrow's requests")).toBeVisible();
  await page
    .getByRole("button", { name: "Mark Review tomorrow's requests done" })
    .click();
  await expect(page.getByText("1 of 1", { exact: true })).toBeVisible();

  await page.getByRole("link", { name: "Start End of Day" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByLabel("Day note").fill("The daily plan is complete.");
  await page.getByRole("button", { name: "Save note" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(
    page.getByText("No follow-ups need a decision today."),
  ).toBeVisible();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("link", { name: /Review next workday plan/ }).click();
  await page
    .getByRole("button", { name: "Add Review tomorrow's requests" })
    .click();
  await page.getByRole("button", { name: "Mark ready" }).click();
  await page.goBack();
  await page.getByRole("button", { name: "Finish End of Day" }).click();
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Your next workday is ready.",
    }),
  ).toBeVisible();

  await page.getByRole("link", { name: "Insights" }).click();
  await expect(
    page.getByRole("heading", { level: 1, name: "Insights" }),
  ).toBeVisible();
  await expect(page.getByLabel("Insights period")).toHaveValue("month");
  await expect(
    page.getByRole("heading", { level: 2, name: "Work completed" }),
  ).toBeVisible();
});
