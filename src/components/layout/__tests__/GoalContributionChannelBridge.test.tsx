import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { BroadcastChannelStub } from '@/lib/__tests__/broadcast-channel-stub';
import {
  GOAL_CONTRIBUTION_CHANNEL,
  GOAL_CONTRIBUTION_LINK_OPENED,
} from '@/lib/goal-contribution-channel';
import { GoalContributionChannelBridge } from '../GoalContributionChannelBridge';

const navigation = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: navigation.push }),
}));

function emitFromOtherTab(path: string, type = GOAL_CONTRIBUTION_LINK_OPENED): void {
  const otherTab = new BroadcastChannelStub(GOAL_CONTRIBUTION_CHANNEL);
  otherTab.postMessage({ type, path });
}

describe('GoalContributionChannelBridge', () => {
  const originalHref = window.location.href;

  beforeEach(() => {
    vi.clearAllMocks();
    BroadcastChannelStub.reset();
    vi.stubGlobal('BroadcastChannel', BroadcastChannelStub);
    window.history.replaceState({}, '', originalHref);
  });

  afterEach(() => {
    window.history.replaceState({}, '', originalHref);
    vi.unstubAllGlobals();
  });

  it('navega a la aceptación cuando otra pestaña abre el enlace del correo', () => {
    render(<GoalContributionChannelBridge />);

    emitFromOtherTab('/goals/aceptar?token=abc123');

    expect(navigation.push).toHaveBeenCalledWith('/goals/aceptar?token=abc123');
  });

  it('ignora mensajes de otro tipo o con una ruta que no es la de aceptación', () => {
    render(<GoalContributionChannelBridge />);

    emitFromOtherTab('/goals/aceptar?token=abc', 'OTRO');
    emitFromOtherTab('/goals?token=abc');
    emitFromOtherTab('https://evil.test/goals/aceptar?token=abc');

    expect(navigation.push).not.toHaveBeenCalled();
  });

  it('no navega si la pestaña ya está en esa misma ruta', () => {
    window.history.replaceState({}, '', '/goals/aceptar?token=abc123');
    render(<GoalContributionChannelBridge />);

    emitFromOtherTab('/goals/aceptar?token=abc123');

    expect(navigation.push).not.toHaveBeenCalled();
  });

  it('cierra el canal al desmontarse', () => {
    const { unmount } = render(<GoalContributionChannelBridge />);
    const [channel] = BroadcastChannelStub.instances;

    unmount();

    expect(channel.closed).toBe(true);
  });

  it('no falla en navegadores sin BroadcastChannel', () => {
    vi.stubGlobal('BroadcastChannel', undefined);
    expect(() => render(<GoalContributionChannelBridge />)).not.toThrow();
    expect(navigation.push).not.toHaveBeenCalled();
  });
});
