import { beforeEach, describe, expect, it, vi } from 'vitest';
import { goalContributions } from '../goal-contributions';

const fetchMock = vi.fn();

vi.stubGlobal('fetch', fetchMock);

function jsonResponse(body: unknown) {
  return {
    ok: true,
    status: 200,
    json: async () => body,
  };
}

describe('cliente API de aportaciones programadas', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(jsonResponse({}));
  });

  it('CA-5.1 consulta el pendiente con el token en la query', async () => {
    await goalContributions.getPending('token con espacios');

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/goal-contributions/pending?token=token%20con%20espacios',
      expect.objectContaining({ credentials: 'include' })
    );
  });

  it('CA-5.1 acepta con POST autenticado y el token en el body', async () => {
    await goalContributions.accept('token-valido', 'checking', 50, true);

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/goal-contributions/accept',
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify({
          token: 'token-valido',
          accountId: 'checking',
          amount: 50,
          updateSuggestion: true,
        }),
      })
    );
  });
});
