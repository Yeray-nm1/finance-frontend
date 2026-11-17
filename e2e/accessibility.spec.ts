import { test, expect } from '@playwright/test';
import { expectAccessible } from './support/axe';

const PAGES = [
  ['dashboard', '/dashboard'],
  ['transacciones', '/transactions'],
  ['metas', '/goals'],
  ['presupuestos', '/budgets'],
  ['suscripciones', '/subscriptions'],
  ['cuentas', '/accounts'],
  ['categorías', '/categories'],
  ['preferencias', '/preferences'],
] as const;

test.describe('accesibilidad', () => {
  for (const [name, path] of PAGES) {
    test(`sin violaciones graves en ${name}`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole('main')).toBeVisible();
      await page.waitForLoadState('networkidle');
      // Las animaciones de entrada dejan el color a mitad de transición; axe
      // mediría contrastes falsos si analizamos antes de que terminen.
      await page.evaluate(() =>
        Promise.all(
          document
            .getAnimations()
            .filter((animation) => animation.effect?.getComputedTiming().iterations !== Infinity)
            .map((animation) => animation.finished.catch(() => undefined))
        )
      );
      await expectAccessible(page, path);
    });
  }
});
