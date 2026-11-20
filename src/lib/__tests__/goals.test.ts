import { describe, it, expect } from 'vitest';
import {
  clampProgress,
  describeReminder,
  formatGoalDate,
  getGoalStatus,
  todayInputValue,
} from '@/lib/goals';
import type { ReminderSettings } from '@/types/goals';

describe('goals helpers', () => {
  it('clamps progress between 0 and 100', () => {
    expect(clampProgress(-10)).toBe(0);
    expect(clampProgress(42.5)).toBe(42.5);
    expect(clampProgress(150)).toBe(100);
    expect(clampProgress(Number.NaN)).toBe(0);
  });

  it('formats goal dates in Spanish without timezone shifts', () => {
    expect(formatGoalDate('2027-06-01T00:00:00.000Z')).toBe('1 jun 2027');
    expect(formatGoalDate(null)).toBeNull();
    expect(formatGoalDate('nope')).toBeNull();
  });

  it('derives the goal status', () => {
    expect(getGoalStatus({ progress: 25, isArchived: false })).toBe('active');
    expect(getGoalStatus({ progress: 100, isArchived: false })).toBe('done');
    expect(getGoalStatus({ progress: 100, isArchived: true })).toBe('archived');
  });

  it('builds a local date input value', () => {
    expect(todayInputValue(new Date(2026, 4, 9))).toBe('2026-05-09');
  });
});

const baseReminder: ReminderSettings = {
  reminderEnabled: true,
  reminderFrequency: 'MONTHLY',
  reminderChannel: 'APP_AND_EMAIL',
  reminderWeekday: null,
  reminderDay: 15,
  reminderLastDay: false,
  reminderInterval: null,
  reminderIntervalUnit: null,
  reminderStartDate: null,
};

describe('describeReminder · resumen de una línea de Figma', () => {
  it('CA-9 el aviso apagado tiene un resumen propio', () => {
    expect(describeReminder({ ...baseReminder, reminderEnabled: false })).toBe(
      'Avisos desactivados'
    );
  });

  it('CA-11 semanal usa el día de la semana', () => {
    expect(
      describeReminder({
        ...baseReminder,
        reminderFrequency: 'WEEKLY',
        reminderWeekday: 5,
        reminderDay: null,
      })
    ).toBe('Te avisaremos cada viernes, en la app y por email.');
  });

  it('CA-11 mensual con día coincide con Figma', () => {
    expect(describeReminder(baseReminder)).toBe(
      'Te avisaremos el día 15 de cada mes, en la app y por email.'
    );
  });

  it('CA-11 mensual de último día y canal solo app', () => {
    expect(
      describeReminder({
        ...baseReminder,
        reminderDay: null,
        reminderLastDay: true,
        reminderChannel: 'APP_ONLY',
      })
    ).toBe('Te avisaremos el último día de cada mes, solo en la app.');
  });

  it.each([
    ['DAYS', '2 días'],
    ['WEEKS', '2 semanas'],
    ['MONTHS', '3 meses'],
  ] as const)('CA-11 personalizada en %s', (unit, label) => {
    expect(
      describeReminder({
        ...baseReminder,
        reminderFrequency: 'CUSTOM',
        reminderDay: null,
        reminderInterval: unit === 'MONTHS' ? 3 : 2,
        reminderIntervalUnit: unit,
        reminderStartDate: '2026-12-05T00:00:00.000Z',
      })
    ).toBe(`Te avisaremos cada ${label} desde el 05/12/2026, en la app y por email.`);
  });
});
