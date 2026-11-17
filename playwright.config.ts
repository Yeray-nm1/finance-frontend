import path from 'node:path';
import { defineConfig, devices } from '@playwright/test';

const FRONTEND_PORT = 3101;
const BACKEND_PORT = 3100;

const frontendUrl = `http://localhost:${FRONTEND_PORT}`;
const backendUrl = `http://localhost:${BACKEND_PORT}`;

const backendDir = path.resolve(
  process.cwd(),
  process.env.E2E_BACKEND_DIR ?? '../finance-backend'
);

const databaseUrl = process.env.E2E_DATABASE_URL;

// Los E2E escriben y borran datos. Nunca deben apuntar a la base real: si no
// hay una base desechable explícita, fallamos antes de arrancar nada.
if (!databaseUrl) {
  throw new Error(
    'E2E_DATABASE_URL is required. Point it at a disposable PostgreSQL database (never production).'
  );
}

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  timeout: 30_000,
  expect: { timeout: 10_000 },
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],
  use: {
    baseURL: frontendUrl,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: 'chromium',
      testMatch: /.*\.spec\.ts/,
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/user.json',
      },
    },
  ],
  webServer: [
    {
      // Migrar + compilar + arrancar: así la base de test siempre está al día,
      // sin depender del orden entre globalSetup y webServer.
      command: 'pnpm prisma:migrate:deploy && pnpm build && pnpm start',
      cwd: backendDir,
      url: `${backendUrl}/health`,
      timeout: 180_000,
      reuseExistingServer: false,
      env: {
        ...process.env,
        NODE_ENV: 'test',
        PORT: String(BACKEND_PORT),
        DATABASE_URL: databaseUrl,
        JWT_SECRET: 'e2e-jwt-secret-not-used-in-production',
        FRONTEND_URL: frontendUrl,
      },
    },
    {
      command: 'pnpm start:e2e',
      url: frontendUrl,
      timeout: 120_000,
      reuseExistingServer: false,
    },
  ],
});
