import { describe, it, expect, vi, beforeEach } from 'vitest';
import { api } from '@/lib/api';

describe('api.request() handling of 204 No Content', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('resolves without error when categories.delete returns 204', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(null, { status: 204, statusText: 'No Content' })
    );
    await expect(api.categories.delete('some-id')).resolves.toBeUndefined();
  });

  it('resolves without error when auth.logout returns 204', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(null, { status: 204, statusText: 'No Content' })
    );
    await expect(api.auth.logout()).resolves.toBeUndefined();
  });

  it('still parses JSON for 200 responses with body', async () => {
    const body = { id: '1', name: 'Test', userId: 'u1', type: 'needs' };
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(body), { status: 200 })
    );
    const result = await api.categories.create({ name: 'Test', type: 'needs' });
    expect(result).toEqual(body);
  });
});
