import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["html", { open: "never" }]],
  use: {
    baseURL: "http://localhost:3001",
    // 失敗時のデバッグ用にスクショ・trace を test-results/ に残す
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    actionTimeout: 15000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  globalSetup: "./e2e/global-setup.ts",
  webServer: {
    command: "npx next dev --port 3001",
    url: "http://localhost:3001",
    reuseExistingServer: false,
    timeout: 120 * 1000,
    env: {
      DB_FILE: "data/test.db",
    },
  },
});
