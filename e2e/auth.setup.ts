import { test as setup, expect, type APIRequestContext } from '@playwright/test';
import { AUTH_STATE_PATH, writeFixtures, type SeededEntity } from './support/fixtures';

const PASSWORD = 'E2ePassword123';
const SEEDED_EXPENSES = 25;
const PREVIOUS_MONTH_INCOME = 2000;

function isoDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

async function post<T>(request: APIRequestContext, url: string, data: unknown): Promise<T> {
  const response = await request.post(url, { data });
  expect(response.ok(), `${url} -> ${response.status()} ${await response.text()}`).toBe(true);
  return (await response.json()) as T;
}

setup('crea un usuario aislado y siembra datos base', async ({ request }) => {
  const runId = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const email = `e2e-${runId}@example.com`;
  const searchTag = `E2E-Seed-${runId}`;

  const register = await request.post('/api/v1/auth/register', {
    data: { email, password: PASSWORD },
  });
  expect(register.status(), await register.text()).toBe(201);

  const checking = await post<SeededEntity>(request, '/api/v1/accounts', {
    name: 'Cuenta E2E',
    type: 'checking',
  });
  const savingsAccount = await post<SeededEntity>(request, '/api/v1/accounts', {
    name: 'Ahorro E2E',
    type: 'savings',
  });

  const groceries = await post<SeededEntity>(request, '/api/v1/categories', {
    name: 'Supermercado E2E',
    type: 'needs',
  });
  const leisure = await post<SeededEntity>(request, '/api/v1/categories', {
    name: 'Ocio E2E',
    type: 'leisure',
  });
  const savings = await post<SeededEntity>(request, '/api/v1/categories', {
    name: 'Ahorro E2E',
    type: 'savings',
  });
  const other = await post<SeededEntity>(request, '/api/v1/categories', {
    name: 'Varios E2E',
    type: 'other',
  });

  const today = new Date();
  const currentMonth = { year: today.getFullYear(), month: today.getMonth() + 1 };
  const previous = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const previousMonth = { year: previous.getFullYear(), month: previous.getMonth() + 1 };

  for (let index = 0; index < SEEDED_EXPENSES; index += 1) {
    const isLeisure = index % 5 === 4;
    await post(request, '/api/v1/transactions', {
      date: isoDate(currentMonth.year, currentMonth.month, (index % 27) + 1),
      amount: 10 + index,
      description: `${searchTag} #${String(index + 1).padStart(2, '0')}`,
      type: 'expense',
      accountId: checking.id,
      categoryId: isLeisure ? leisure.id : groceries.id,
    });
  }

  await post(request, '/api/v1/transactions', {
    date: isoDate(currentMonth.year, currentMonth.month, 1),
    amount: PREVIOUS_MONTH_INCOME,
    description: `Ingreso ${searchTag}`,
    type: 'income',
    accountId: checking.id,
    categoryId: other.id,
  });

  const budget = await request.put(
    `/api/v1/budgets/monthly?month=${previousMonth.month}&year=${previousMonth.year}`,
    {
      data: {
        totalIncome: PREVIOUS_MONTH_INCOME,
        typeAllocations: [
          { type: 'needs', percentage: 50 },
          { type: 'leisure', percentage: 20 },
          { type: 'savings', percentage: 20 },
          { type: 'other', percentage: 10 },
        ],
        categoryAllocations: [
          { categoryId: groceries.id, amount: 1000 },
          { categoryId: leisure.id, amount: 400 },
          { categoryId: savings.id, amount: 400 },
          { categoryId: other.id, amount: 200 },
        ],
      },
    }
  );
  expect(budget.ok(), `budget -> ${budget.status()} ${await budget.text()}`).toBe(true);

  await request.storageState({ path: AUTH_STATE_PATH });

  writeFixtures({
    email,
    password: PASSWORD,
    runId,
    searchTag,
    accounts: { checking, savings: savingsAccount },
    categories: { groceries, leisure, savings, other },
    seededTransactions: SEEDED_EXPENSES + 1,
    currentMonth,
    previousMonth,
  });
});
