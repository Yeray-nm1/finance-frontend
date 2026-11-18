import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BroadcastChannelStub } from './broadcast-channel-stub';
import {
  GOAL_CONTRIBUTION_CHANNEL,
  GOAL_CONTRIBUTION_LINK_ACK,
  GOAL_CONTRIBUTION_LINK_OPENED,
  announceGoalContributionLink,
  consumeHandoff,
  goalContributionAcceptPath,
  goalContributionLinkFromMessage,
  goalContributionPathFromMessage,
  isGoalContributionAck,
  isSameTab,
  markHandoff,
} from '../goal-contribution-channel';

describe('goalContributionAcceptPath', () => {
  it('construye la ruta de aceptación codificando el token', () => {
    expect(goalContributionAcceptPath('abc123')).toBe('/goals/aceptar?token=abc123');
    expect(goalContributionAcceptPath('a b+c/d')).toBe(
      '/goals/aceptar?token=a%20b%2Bc%2Fd'
    );
  });
});

describe('goalContributionPathFromMessage', () => {
  it('acepta el mensaje del enlace y devuelve la ruta canónica', () => {
    expect(
      goalContributionPathFromMessage({
        type: GOAL_CONTRIBUTION_LINK_OPENED,
        path: '/goals/aceptar?token=abc123',
      })
    ).toBe('/goals/aceptar?token=abc123');
  });

  it.each([
    ['no es un objeto', null],
    ['tipo distinto', { type: 'OTRO', path: '/goals/aceptar?token=abc' }],
    ['sin ruta', { type: GOAL_CONTRIBUTION_LINK_OPENED }],
    ['url absoluta', { type: GOAL_CONTRIBUTION_LINK_OPENED, path: 'https://evil.test/goals/aceptar?token=abc' }],
    ['url protocol-relativa', { type: GOAL_CONTRIBUTION_LINK_OPENED, path: '//evil.test/goals/aceptar?token=abc' }],
    ['otra ruta', { type: GOAL_CONTRIBUTION_LINK_OPENED, path: '/goals?token=abc' }],
    ['sin token', { type: GOAL_CONTRIBUTION_LINK_OPENED, path: '/goals/aceptar' }],
    ['token vacío', { type: GOAL_CONTRIBUTION_LINK_OPENED, path: '/goals/aceptar?token=' }],
    ['parámetros extra', { type: GOAL_CONTRIBUTION_LINK_OPENED, path: '/goals/aceptar?token=abc&next=https://evil.test' }],
    ['fragmento', { type: GOAL_CONTRIBUTION_LINK_OPENED, path: '/goals/aceptar?token=abc#x' }],
  ])('rechaza %s', (_label, value) => {
    expect(goalContributionPathFromMessage(value)).toBeNull();
  });
});

describe('goalContributionLinkFromMessage', () => {
  it('exige un requestId para poder correlacionar el ACK', () => {
    expect(
      goalContributionLinkFromMessage({
        type: GOAL_CONTRIBUTION_LINK_OPENED,
        path: '/goals/aceptar?token=abc',
        requestId: 'r-1',
        sourceId: 'otra-pestana',
      })
    ).toEqual({
      path: '/goals/aceptar?token=abc',
      requestId: 'r-1',
      sourceId: 'otra-pestana',
    });

    expect(
      goalContributionLinkFromMessage({
        type: GOAL_CONTRIBUTION_LINK_OPENED,
        path: '/goals/aceptar?token=abc',
      })
    ).toBeNull();
  });
});

describe('isGoalContributionAck', () => {
  it('solo acepta el ACK de esta petición', () => {
    expect(isGoalContributionAck({ type: GOAL_CONTRIBUTION_LINK_ACK, requestId: 'r-1' }, 'r-1')).toBe(true);
    expect(isGoalContributionAck({ type: GOAL_CONTRIBUTION_LINK_ACK, requestId: 'r-2' }, 'r-1')).toBe(false);
    expect(isGoalContributionAck({ type: GOAL_CONTRIBUTION_LINK_OPENED, requestId: 'r-1' }, 'r-1')).toBe(false);
  });
});

describe('marca de handoff', () => {
  beforeEach(() => sessionStorage.clear());

  it('la pestaña que recibe el aviso no vuelve a emitirlo', () => {
    markHandoff('abc123');

    expect(consumeHandoff('abc123')).toBe(true);
    expect(consumeHandoff('abc123')).toBe(false);
    expect(consumeHandoff('otro')).toBe(false);
  });
});

describe('announceGoalContributionLink', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    BroadcastChannelStub.reset();
    vi.stubGlobal('BroadcastChannel', BroadcastChannelStub);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  function postedMessage(): { requestId: string; sourceId: string; path: string; type: string } {
    const message = BroadcastChannelStub.instances[0]?.posted[0];
    expect(message).toBeDefined();
    return message as { requestId: string; sourceId: string; path: string; type: string };
  }

  function sendAck(requestId: string): void {
    const otherTab = new BroadcastChannelStub(GOAL_CONTRIBUTION_CHANNEL);
    otherTab.postMessage({ type: GOAL_CONTRIBUTION_LINK_ACK, requestId });
  }

  it('publica la ruta con un requestId y cierra su canal', () => {
    const onHandoff = vi.fn();
    announceGoalContributionLink('abc123', onHandoff);

    expect(postedMessage()).toMatchObject({
      type: GOAL_CONTRIBUTION_LINK_OPENED,
      path: '/goals/aceptar?token=abc123',
      requestId: expect.any(String),
      sourceId: expect.any(String),
    });
    expect(isSameTab(postedMessage().sourceId)).toBe(true);
    expect(BroadcastChannelStub.instances[0].closed).toBe(false);

    vi.advanceTimersByTime(1600);
    expect(BroadcastChannelStub.instances[0].closed).toBe(true);
    expect(onHandoff).not.toHaveBeenCalled();
  });

  it('hace el handoff solo cuando otra pestaña confirma este requestId', () => {
    const onHandoff = vi.fn();
    announceGoalContributionLink('abc123', onHandoff);
    const { requestId } = postedMessage();

    sendAck('otro-request');
    expect(onHandoff).not.toHaveBeenCalled();

    sendAck(requestId);
    expect(onHandoff).toHaveBeenCalledTimes(1);
    expect(BroadcastChannelStub.instances[0].closed).toBe(true);
  });

  it('no hace el handoff dos veces si llega un ACK repetido', () => {
    const onHandoff = vi.fn();
    announceGoalContributionLink('abc123', onHandoff);
    const { requestId } = postedMessage();

    sendAck(requestId);
    sendAck(requestId);

    expect(onHandoff).toHaveBeenCalledTimes(1);
  });

  it('la limpieza cierra el canal y cancela el temporizador', () => {
    const onHandoff = vi.fn();
    const close = announceGoalContributionLink('abc123', onHandoff);

    close();
    vi.advanceTimersByTime(3000);

    expect(BroadcastChannelStub.instances[0].closed).toBe(true);
    expect(onHandoff).not.toHaveBeenCalled();
  });

  it('no publica nada sin token', () => {
    const close = announceGoalContributionLink('', vi.fn());
    close();
    expect(BroadcastChannelStub.instances).toHaveLength(0);
  });

  it('no falla en navegadores sin BroadcastChannel', () => {
    vi.stubGlobal('BroadcastChannel', undefined);
    expect(() => announceGoalContributionLink('abc123', vi.fn())).not.toThrow();
  });
});
