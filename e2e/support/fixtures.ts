import fs from 'node:fs';
import path from 'node:path';

export interface SeededEntity {
  id: string;
  name: string;
}

export interface E2EFixtures {
  email: string;
  password: string;
  runId: string;
  /** Texto común de las transacciones sembradas, único por ejecución. */
  searchTag: string;
  accounts: {
    checking: SeededEntity;
    savings: SeededEntity;
  };
  categories: {
    groceries: SeededEntity;
    leisure: SeededEntity;
    savings: SeededEntity;
    other: SeededEntity;
  };
  /** Número total de transacciones que contienen `searchTag`. */
  seededTransactions: number;
  currentMonth: { year: number; month: number };
  previousMonth: { year: number; month: number };
}

const AUTH_DIR = path.resolve(process.cwd(), 'e2e/.auth');
export const AUTH_STATE_PATH = path.join(AUTH_DIR, 'user.json');
const FIXTURES_PATH = path.join(AUTH_DIR, 'fixtures.json');

export function writeFixtures(fixtures: E2EFixtures): void {
  fs.mkdirSync(AUTH_DIR, { recursive: true });
  fs.writeFileSync(FIXTURES_PATH, JSON.stringify(fixtures, null, 2));
}

export function readFixtures(): E2EFixtures {
  if (!fs.existsSync(FIXTURES_PATH)) {
    throw new Error(
      `No se encontraron los datos sembrados en ${FIXTURES_PATH}. Ejecuta el proyecto "setup" de Playwright.`
    );
  }
  return JSON.parse(fs.readFileSync(FIXTURES_PATH, 'utf8')) as E2EFixtures;
}
