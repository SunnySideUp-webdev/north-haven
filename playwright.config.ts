import { defineConfig, devices } from "@playwright/test";

const hostedBaseUrl = process.env.PLAYWRIGHT_BASE_URL;
const localBaseUrl = "http://127.0.0.1:3000";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: "html",
  use: {
    baseURL: hostedBaseUrl ?? localBaseUrl,
    screenshot: "only-on-failure",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: hostedBaseUrl
    ? undefined
    : {
        command: "npm run dev:e2e",
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        url: localBaseUrl,
      },
});
