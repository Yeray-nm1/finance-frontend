import { test, expect } from '@playwright/test';
import { readFixtures } from './support/fixtures';

// Estas pruebas parten sin sesión: comprueban el flujo real de autenticación.
test.use({ storageState: { cookies: [], origins: [] } });

test('redirige a login si no hay sesión', async ({ page }) => {
  await page.goto('/transactions');

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('heading', { name: 'Bienvenido', exact: true })).toBeVisible();
});

test('muestra un error con credenciales incorrectas', async ({ page }) => {
  await page.goto('/login');

  await page.getByLabel('Email').fill('nadie@example.com');
  await page.getByLabel('Contrasena').fill('PasswordIncorrecta1');
  await page.getByRole('button', { name: 'Iniciar Sesion' }).click();

  await expect(page.getByText('Invalid credentials')).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);
});

test('inicia sesión con el usuario sembrado y cierra sesión', async ({ page }) => {
  const fixtures = readFixtures();

  await page.goto('/login');
  await page.getByLabel('Email').fill(fixtures.email);
  await page.getByLabel('Contrasena').fill(fixtures.password);
  await page.getByRole('button', { name: 'Iniciar Sesion' }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole('heading', { name: 'Dashboard', exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Expandir menu' }).click();
  await page.getByRole('button', { name: 'Cerrar sesion' }).click();

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('button', { name: 'Iniciar Sesion' })).toBeVisible();
});
