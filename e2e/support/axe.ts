import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];
const BLOCKING_IMPACTS = ['serious', 'critical'];

function describeViolation(violation: {
  id: string;
  impact?: string | null;
  help: string;
  nodes: { target: unknown[]; failureSummary?: string }[];
}): string {
  const nodes = violation.nodes
    .map((node) => {
      const target = node.target.join(' ');
      return node.failureSummary ? `${target} :: ${node.failureSummary}` : target;
    })
    .join(' | ');
  return `[${violation.impact ?? 'unknown'}] ${violation.id}: ${violation.help} (${nodes})`;
}

/** Audita la página y falla solo ante violaciones graves o críticas de WCAG. */
export async function expectAccessible(page: Page, label: string): Promise<void> {
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();

  const nonBlocking = results.violations.filter(
    (violation) => !BLOCKING_IMPACTS.includes(violation.impact ?? '')
  );
  if (nonBlocking.length > 0) {
    test.info().annotations.push({
      type: 'axe',
      description: `${label}: ${nonBlocking.map(describeViolation).join(' | ')}`,
    });
  }

  const blocking = results.violations.filter((violation) =>
    BLOCKING_IMPACTS.includes(violation.impact ?? '')
  );
  expect(
    blocking.map(describeViolation),
    `${label}: violaciones de accesibilidad`
  ).toEqual([]);
}
