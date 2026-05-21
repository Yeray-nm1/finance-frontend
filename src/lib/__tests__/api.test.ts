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

describe('api.transactions.list() with filters', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('sends GET to /transactions with no params when called without args', async () => {
    const mockData = { data: [], total: 0, page: 1, limit: 50 };
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(mockData), { status: 200 })
    );
    const result = await api.transactions.list();
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/v1/transactions',
      expect.objectContaining({ credentials: 'include' })
    );
    expect(result).toEqual(mockData);
  });

  it('builds query string from filters', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ data: [], total: 0, page: 1, limit: 20 }), { status: 200 })
    );
    await api.transactions.list({ page: 2, limit: 20, type: 'expense', sortBy: 'amount', sortOrder: 'asc' });
    const calledUrl = global.fetch.mock.calls[0][0] as unknown as string;
    expect(calledUrl).toContain('page=2');
    expect(calledUrl).toContain('limit=20');
    expect(calledUrl).toContain('type=expense');
    expect(calledUrl).toContain('sortBy=amount');
    expect(calledUrl).toContain('sortOrder=asc');
  });

  it('includes search, categoryId, accountId, date range in query string', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ data: [], total: 0, page: 1, limit: 50 }), { status: 200 })
    );
    await api.transactions.list({
      search: 'mercadona',
      categoryId: 'cat-1',
      accountId: 'acc-1',
      dateFrom: '2026-01-01',
      dateTo: '2026-01-31',
    });
    const calledUrl = global.fetch.mock.calls[0][0] as unknown as string;
    expect(calledUrl).toContain('search=mercadona');
    expect(calledUrl).toContain('categoryId=cat-1');
    expect(calledUrl).toContain('accountId=acc-1');
    expect(calledUrl).toContain('dateFrom=2026-01-01');
    expect(calledUrl).toContain('dateTo=2026-01-31');
  });

  it('returns PaginatedResponse shape', async () => {
    const paginated = { data: [{ id: '1' }], total: 1, page: 1, limit: 50 };
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(paginated), { status: 200 })
    );
    const result = await api.transactions.list({ page: 1, limit: 50 });
    expect(result).toHaveProperty('data');
    expect(result).toHaveProperty('total');
    expect(result).toHaveProperty('page');
    expect(result).toHaveProperty('limit');
  });
});

describe('api.transactions.update()', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('sends PATCH to /transactions/:id with body', async () => {
    const updated = { id: 'tx-1', description: 'new desc' };
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(updated), { status: 200 })
    );
    const result = await api.transactions.update('tx-1', { description: 'new desc' });
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/v1/transactions/tx-1',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ description: 'new desc' }),
      })
    );
    expect(result).toEqual(updated);
  });

  it('sends partial update with type and categoryId', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ id: 'tx-1' }), { status: 200 })
    );
    await api.transactions.update('tx-1', { type: 'expense', categoryId: 'cat-1' });
    const body = JSON.parse(global.fetch.mock.calls[0][1].body as string);
    expect(body).toEqual({ type: 'expense', categoryId: 'cat-1' });
  });
});

describe('api.transactions.delete()', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('sends DELETE to /transactions/:id', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(null, { status: 204 })
    );
    await api.transactions.delete('tx-1');
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/v1/transactions/tx-1',
      expect.objectContaining({ method: 'DELETE' })
    );
  });
});
