import { test, expect } from '@playwright/test';
import { readFixtures } from './support/fixtures';

test.describe('transacciones', () => {
  test('crea, edita y elimina una transacción', async ({ page }) => {
    const fixtures = readFixtures();
    const original = `E2E crear ${fixtures.runId}`;
    const edited = `${original} editada`;

    await page.goto('/transactions');
    await expect(page.getByRole('heading', { name: 'Transacciones' })).toBeVisible();

    // Alta
    await page.getByRole('button', { name: 'Añadir', exact: true }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText('Nueva Transaccion')).toBeVisible();
    await dialog.getByLabel('Importe').fill('42.50');
    await dialog.getByLabel('Descripcion').fill(original);
    await dialog.getByRole('button', { name: 'Crear', exact: true }).click();

    await expect(page.getByRole('dialog')).toBeHidden();
    const originalCell = page.getByRole('cell', { name: original, exact: true });
    const row = page.getByRole('row').filter({ has: originalCell });
    await expect(row).toContainText('42,50');

    // Edición mediante el diálogo
    await row.getByRole('button', { name: 'Editar transacción' }).click();
    const editDialog = page.getByRole('dialog');
    await expect(editDialog.getByText('Editar Transaccion')).toBeVisible();
    await editDialog.getByLabel('Descripcion').fill(edited);
    await editDialog.getByRole('button', { name: 'Guardar cambios' }).click();

    await expect(page.getByRole('dialog')).toBeHidden();
    const editedCell = page.getByRole('cell', { name: edited, exact: true });
    await expect(editedCell).toHaveCount(1);
    await expect(originalCell).toHaveCount(0);

    // Borrado con confirmación
    const editedRow = page.getByRole('row').filter({ has: editedCell });
    await editedRow.getByRole('button', { name: 'Eliminar transacción' }).click();
    await expect(page.getByText('Eliminar transaccion', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Eliminar', exact: true }).click();

    await expect(page.getByText('Transacción eliminada', { exact: true })).toBeVisible();
    await expect(editedCell).toHaveCount(0);
  });

  test('busca y pagina los resultados', async ({ page }) => {
    const fixtures = readFixtures();
    const total = fixtures.seededTransactions;
    const firstPageEnd = Math.min(20, total);

    await page.goto('/transactions');
    await expect(page.getByRole('heading', { name: 'Transacciones' })).toBeVisible();

    const filteredResponse = page.waitForResponse(
      (response) =>
        response.url().includes('/api/v1/transactions') &&
        response.url().includes('search=') &&
        response.ok()
    );
    await page.getByPlaceholder('Buscar por descripción...').fill(fixtures.searchTag);
    // El buscador aplica debounce: esperamos a la petición ya filtrada antes de
    // paginar para no competir con el reset a la página 1.
    await filteredResponse;
    await expect(page).toHaveURL(new RegExp(`search=${fixtures.searchTag}`));

    await expect(
      page.getByText(`Mostrando 1-${firstPageEnd} de ${total} transacciones`)
    ).toBeVisible();
    const dataRows = page.locator('tbody tr');
    await expect(dataRows).toHaveCount(firstPageEnd);

    const secondPageResponse = page.waitForResponse(
      (response) =>
        response.url().includes('/api/v1/transactions') &&
        response.url().includes('page=2') &&
        response.ok()
    );
    await page.getByRole('button', { name: 'Siguiente' }).click();
    await secondPageResponse;
    await expect(page).toHaveURL(/page=2/);

    await expect(
      page.getByText(`Mostrando ${firstPageEnd + 1}-${total} de ${total} transacciones`)
    ).toBeVisible();
    await expect(dataRows).toHaveCount(total - firstPageEnd);

    await page.getByRole('button', { name: 'Limpiar filtro de búsqueda' }).click();
    await expect(page.getByPlaceholder('Buscar por descripción...')).toHaveValue('');
    await expect(page).not.toHaveURL(/search=/);
  });
});
