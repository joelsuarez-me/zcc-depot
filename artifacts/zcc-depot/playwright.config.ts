import { defineConfig } from "@playwright/test";
import path from "node:path";

// Point at an already-running app; never start a competing Vite/API server.
const baseURL = process.env.SECTION_NAV_BASE_URL;
if (!baseURL) throw new Error("Set SECTION_NAV_BASE_URL to the running ZCC Depot preview URL (including its base path).");

export default defineConfig({
  testDir: "./scripts/browser",
  testMatch: "**/*.spec.ts",
  outputDir: "../../generated-artifacts/section-navigation/results",
  reporter: [
    ["list"],
    ["html", { outputFolder: "../../generated-artifacts/section-navigation/report", open: "never" }],
  ],
  fullyParallel: true,
  workers: 2,
  retries: 0,
  timeout: 45_000,
  expect: { timeout: 8_000 },
  use: {
    baseURL: `${baseURL.replace(/\/+$/, "")}/`,
    browserName: "chromium",
    reducedMotion: "reduce",
    serviceWorkers: "block",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
      ? { executablePath: path.resolve(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH) }
      : {},
  },
  projects: [320, 390, 1440].map(width => ({
    name: `chromium-${width}`,
    use: { viewport: { width, height: 844 } },
  })),
});
