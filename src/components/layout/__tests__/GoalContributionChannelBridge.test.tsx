import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { BroadcastChannelStub } from '@/lib/__tests__/broadcast-channel-stub';
import {
  GOAL_CONTRIBUTION_CHANNEL,
  GOAL_CONTRIBUTION_LINK_ACK,
  GOAL_CONTRIBUTION_LINK_OPENED,
  announceGoalContributionLink,
} from '@/lib/goal-contribution-channel';
import { GoalContributionChannelBridge } from '../GoalContributionChannelBridge';

const navigation = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: navigation.push }),
}));

function emitFromOtherTab(
  path: string,
  type = GOAL_CONTRIBUTION_LINK_OPENED,
  requestId = 'r-1',
  sourceId = 'otra-pestana'
): void {
  const otherTab = new BroadcastChannelStub(GOAL_CONTRIBUTION_CHANNEL);
  otherTab.postMessage({ type, path, requestId, sourceId });
}

describe('GoalContributionChannelBridge', () => {
  const originalHref = window.location.href;

  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
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
    expect(sessionStorage.getItem('finance-goal-contribution-handoff')).toBe('abc123');
    expect(BroadcastChannelStub.instances[0].posted).toContainEqual({
      type: GOAL_CONTRIBUTION_LINK_ACK,
      requestId: 'r-1',
    });
  });

  it('ignora el aviso emitido por esta misma pestaña', () => {
    const close = announceGoalContributionLink('abc123', vi.fn());
    const ownSourceId = (
      BroadcastChannelStub.instances[0].posted[0] as { sourceId: string }
    ).sourceId;
    close();

    render(<GoalContributionChannelBridge />);
    emitFromOtherTab(
      '/goals/aceptar?token=abc123',
      GOAL_CONTRIBUTION_LINK_OPENED,
      'r-2',
      ownSourceId
    );

    expect(navigation.push).not.toHaveBeenCalled();
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
    expect(BroadcastChannelStub.instances[0].posted).toContainEqual({
      type: GOAL_CONTRIBUTION_LINK_ACK,
      requestId: 'r-1',
    });
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
