import { test, expect, type APIRequestContext } from '@playwright/test';
import { readFixtures } from './support/fixtures';

const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

async function getBudgetMonths(
  request: APIRequestContext
): Promise<Array<{ year: number; month: number }>> {
  const response = await request.get('/api/v1/budgets/months');
  expect(response.ok(), `months -> ${response.status()} ${await response.text()}`).toBe(true);
  return (await response.json()) as Array<{ year: number; month: number }>;
}

function hasMonth(
  months: Array<{ year: number; month: number }>,
  target: { year: number; month: number }
): boolean {
  return months.some((entry) => entry.year === target.year && entry.month === target.month);
}

test.describe('presupuestos', () => {
  test('copia el presupuesto del mes anterior y lo guarda en el mes actual', async ({
    page,
    request,
  }) => {
    const fixtures = readFixtures();
    const previousLabel = `${MONTH_NAMES[fixtures.previousMonth.month - 1]} ${fixtures.previousMonth.year}`;

    await page.goto('/budgets');
    await expect(page.getByRole('heading', { name: 'Presupuestos', exact: true })).toBeVisible();
    await expect(page.getByText('Sin presupuesto', { exact: true })).toBeVisible();

    const copyButton = page.getByRole('button', { name: `Copiar de ${previousLabel}` });
    await expect(copyButton).toBeVisible();
    await copyButton.click();

    // Copiar solo prerrellena el formulario: el mes sigue sin presupuesto guardado.
    await expect(page.getByText('Editando', { exact: true })).toBeVisible();
    await expect(page.getByLabel('Definir el presupuesto total')).toHaveValue('2000');
    await expect(page.getByLabel('Importe de Supermercado E2E')).toHaveValue('1000');
    await expect(
      page.getByText(`Presupuesto de ${previousLabel} copiado`, { exact: true })
    ).toBeVisible();

    const monthsBeforeSave = await getBudgetMonths(request);
    expect(hasMonth(monthsBeforeSave, fixtures.currentMonth)).toBe(false);
    expect(hasMonth(monthsBeforeSave, fixtures.previousMonth)).toBe(true);

    await page.getByRole('button', { name: 'Guardar presupuesto' }).click();

    await expect(page.getByText('Presupuesto guardado', { exact: true })).toBeVisible();
    await expect(page.getByText('En uso', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Copiar de/ })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Editar' })).toBeVisible();

    const monthsAfterSave = await getBudgetMonths(request);
    expect(hasMonth(monthsAfterSave, fixtures.currentMonth)).toBe(true);
    expect(hasMonth(monthsAfterSave, fixtures.previousMonth)).toBe(true);

    // El mes anterior sigue siendo de solo lectura y conserva sus importes.
    await page.getByRole('button', { name: 'Mes anterior con presupuesto' }).click();
    await expect(page.getByText('Presupuesto total')).toBeVisible();
    await expect(page.getByText(/2\.000,00/)).toBeVisible();
    await expect(page.getByText('Definir el presupuesto total')).toHaveCount(0);
    await expect(page.getByRole('button', { name: /^Copiar de/ })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Editar' })).toHaveCount(0);
  });
});
