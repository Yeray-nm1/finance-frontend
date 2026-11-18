import { createHash, createHmac } from 'node:crypto';
import { expect, test, type APIRequestContext } from '@playwright/test';
import pg from 'pg';

// Estas pruebas crean su propio usuario: no deben tocar el usuario compartido
// de la suite ni depender de un correo real para obtener el token.
test.use({ storageState: { cookies: [], origins: [] } });

const JWT_SECRET = 'e2e-jwt-secret-not-used-in-production';
const OLD_PASSWORD = 'OldPassword123';
const NEW_PASSWORD = 'NewPassword123';

interface RegisteredUser {
  user: { id: string; email: string };
}

function base64url(value: string): string {
  return Buffer.from(value).toString('base64url');
}

function passwordFingerprint(passwordHash: string): string {
  return createHash('sha256').update(passwordHash).digest('hex').slice(0, 16);
}

/** Firma un JWT HS256 igual que el backend, sin añadir dependencias al browser. */
function signResetToken(userId: string, passwordHash: string): string {
  const issuedAt = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = base64url(
    JSON.stringify({
      sub: userId,
      scope: 'password_reset',
      pwd: passwordFingerprint(passwordHash),
      jti: `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      iat: issuedAt,
      exp: issuedAt + 30 * 60,
    })
  );
  const signature = createHmac('sha256', JWT_SECRET).update(`${header}.${payload}`).digest('base64url');
  return `${header}.${payload}.${signature}`;
}

async function readPasswordHash(userId: string): Promise<string> {
  const databaseUrl = process.env.E2E_DATABASE_URL;
  if (!databaseUrl) throw new Error('E2E_DATABASE_URL is required');

  const client = new pg.Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    const result = await client.query<{ password: string }>('SELECT password FROM "User" WHERE id = $1', [userId]);
    if (result.rows.length !== 1) throw new Error(`No se encontró el usuario ${userId} en la BD de test`);
    return result.rows[0].password;
  } finally {
    await client.end();
  }
}

async function registerIsolatedUser(request: APIRequestContext): Promise<RegisteredUser['user']> {
  const runId = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const response = await request.post('/api/v1/auth/register', {
    data: { email: `e2e-reset-${runId}@example.com`, password: OLD_PASSWORD },
  });
  expect(response.status(), await response.text()).toBe(201);
  return (await response.json() as RegisteredUser).user;
}

test('solicitar el enlace no revela si el email existe', async ({ page }) => {
  await page.goto('/forgot-password');

  await page.getByLabel('Email').fill('no-registrado@example.com');
  await page.getByRole('button', { name: 'Enviar enlace' }).click();

  await expect(
    page.getByText(/Si el email está registrado, te hemos enviado un enlace/i)
  ).toBeVisible();
});

test('cambia la contraseña con un enlace válido y puede iniciar sesión', async ({ page, request }) => {
  const user = await registerIsolatedUser(request);
  const token = signResetToken(user.id, await readPasswordHash(user.id));

  await page.goto(`/reset-password?token=${encodeURIComponent(token)}`);
  await page.getByLabel('Nueva contraseña').fill(NEW_PASSWORD);
  await page.getByLabel('Repetir contraseña').fill(NEW_PASSWORD);
  await page.getByRole('button', { name: 'Guardar contraseña' }).click();

  await expect(page).toHaveURL(/\/login\?reset=1$/);
  await expect(page.getByText('Contraseña actualizada. Ya puedes iniciar sesión.')).toBeVisible();

  const oldLogin = await request.post('/api/v1/auth/login', {
    data: { email: user.email, password: OLD_PASSWORD },
  });
  expect(oldLogin.status()).toBe(400);

  const newLogin = await request.post('/api/v1/auth/login', {
    data: { email: user.email, password: NEW_PASSWORD },
  });
  expect(newLogin.status()).toBe(200);
});

test('rechaza un enlace cuya huella no coincide con la contraseña actual', async ({ page, request }) => {
  const user = await registerIsolatedUser(request);
  // Huella calculada sobre otro hash: el usuario existe, pero el enlace ya no es válido.
  const token = signResetToken(user.id, 'hash-que-ya-no-está-guardado');

  await page.goto(`/reset-password?token=${encodeURIComponent(token)}`);
  await page.getByLabel('Nueva contraseña').fill(NEW_PASSWORD);
  await page.getByLabel('Repetir contraseña').fill(NEW_PASSWORD);
  await page.getByRole('button', { name: 'Guardar contraseña' }).click();

  await expect(page.getByText('Enlace de restablecimiento no válido o caducado')).toBeVisible();
  await expect(page).toHaveURL(/\/reset-password/);
});
