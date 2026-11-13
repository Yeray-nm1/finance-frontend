import { afterEach, describe, expect, it, vi } from 'vitest';
import { animateRowToTab } from '../animate-to-tab';

function rect(left: number, top: number, width: number, height: number): DOMRect {
  return {
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height,
    x: left,
    y: top,
    toJSON: () => ({}),
  } as DOMRect;
}

function makeSource() {
  const source = document.createElement('section');
  source.setAttribute('data-goal-card', 'goal-1');
  source.textContent = 'Viaje a Japón';
  source.getBoundingClientRect = () => rect(10, 10, 200, 100);
  return source;
}

function makeTarget() {
  const target = document.createElement('button');
  target.setAttribute('data-goal-tab', 'archived');
  target.textContent = 'Archivadas (1)';
  target.getBoundingClientRect = () => rect(400, 20, 60, 30);
  return target;
}

describe('animateRowToTab', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    document.body.innerHTML = '';
  });

  it('flies a clone of the source and removes its data attributes', () => {
    vi.useFakeTimers();

    const source = makeSource();
    const target = makeTarget();
    document.body.append(source, target);

    animateRowToTab(source, target);

    const clone = document.querySelector('.finance-flying-row');
    expect(clone).toBeInTheDocument();
    expect(clone).toHaveAttribute('aria-hidden', 'true');
    expect(clone).not.toHaveAttribute('data-goal-card');
    expect((clone as HTMLElement).style.position).toBe('fixed');
    expect((clone as HTMLElement).style.width).toBe('200px');

    vi.advanceTimersByTime(500);
    expect(document.querySelector('.finance-flying-row')).not.toBeInTheDocument();
  });

  it('does nothing when reduced motion is enabled', () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockReturnValue({ matches: true } as MediaQueryList)
    );

    const source = makeSource();
    const target = makeTarget();
    document.body.append(source, target);

    animateRowToTab(source, target);

    expect(document.querySelector('.finance-flying-row')).not.toBeInTheDocument();
  });

  it('does nothing when there is no source or target', () => {
    expect(() => animateRowToTab(null, makeTarget())).not.toThrow();
    expect(() => animateRowToTab(makeSource(), null)).not.toThrow();
    expect(document.querySelector('.finance-flying-row')).not.toBeInTheDocument();
  });
});
