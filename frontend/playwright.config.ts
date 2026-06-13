import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config — senior standard for Next.js 16 + i18n (next-intl).
 * Base URL auto-detects from env: CI uses build, local uses dev server.
 *
 * @see https://playwright.dev/docs/test-configuration
 */
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';
const IS_CI = !!process.env.CI;

export default defineConfig({
  // ─── Test discovery ─────────────────────────────────────────────────
  testDir: './e2e/tests',
  testMatch: '**/*.spec.ts',

  // ─── Parallelism ────────────────────────────────────────────────────
  fullyParallel: true,
  workers: IS_CI ? 2 : undefined, // CI: limit workers to avoid flaky tests

  // ─── Retry ──────────────────────────────────────────────────────────
  retries: IS_CI ? 2 : 0, // retry only on CI

  // ─── Reporter ───────────────────────────────────────────────────────
  reporter: IS_CI
    ? [['github'], ['html', { outputFolder: 'e2e-report', open: 'never' }]]
    : [['list'], ['html', { outputFolder: 'e2e-report', open: 'on-failure' }]],

  // ─── Global timeout ─────────────────────────────────────────────────
  timeout: 30_000,
  expect: { timeout: 5_000 },

  // ─── Shared options for all tests ───────────────────────────────────
  use: {
    baseURL: BASE_URL,
    locale: 'vi-VN',

    // ── Artifacts on failure ──────────────────────────────────────────
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',

    // ── Navigation ──────────────────────────────────────────────────
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
  },

  // ─── Projects (browsers) ────────────────────────────────────────────
  projects: [
    // Desktop Chromium (primary)
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    // Desktop Firefox — enabled on CI
    ...(IS_CI
      ? [
          {
            name: 'firefox',
            use: { ...devices['Desktop Firefox'] },
          },
        ]
      : []),

    // Mobile viewport — smoke test
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],

  // ─── Web server ─────────────────────────────────────────────────────
  // Auto-start Next.js if not running.
  // CI: use `pnpm build && pnpm start` to test production build.
  // Mocks are enabled (MSW) so guest flows like password reset are
  // deterministic without a live backend. Locally, make sure any reused dev
  // server on :3000 was also started with NEXT_PUBLIC_USE_MOCK=true.
  webServer: {
    command: IS_CI ? 'pnpm build && pnpm start' : 'pnpm dev',
    url: BASE_URL,
    reuseExistingServer: !IS_CI, // local: reuse if exists; CI: always fresh
    timeout: 120_000,
    stdout: 'pipe',
    stderr: 'pipe',
    env: { NEXT_PUBLIC_USE_MOCK: 'true' },
  },

  // ─── Output ─────────────────────────────────────────────────────────
  outputDir: 'e2e-results',
});
