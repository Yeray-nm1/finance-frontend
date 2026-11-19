import { beforeEach, describe, expect, it, vi } from 'vitest';
import { transactions } from '../transactions';

const fetchMock = vi.fn();

vi.stubGlobal('fetch', fetchMock);

function jsonResponse(body: unknown) {
  return {
    ok: true,
    status: 200,
    json: async () => body,
  };
}

describe('cliente API de transacciones', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(jsonResponse({ data: [], total: 0 }));
  });

  it('3B envía goalId en la query para filtrar los movimientos de una meta', async () => {
    await transactions.list({ goalId: 'goal-1' });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/transactions?goalId=goal-1',
      expect.objectContaining({ credentials: 'include' })
    );
  });
});
