import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BroadcastChannelStub } from './broadcast-channel-stub';
import {
  GOAL_CONTRIBUTION_CHANNEL,
  GOAL_CONTRIBUTION_LINK_OPENED,
  announceGoalContributionLink,
  goalContributionAcceptPath,
  goalContributionPathFromMessage,
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

describe('announceGoalContributionLink', () => {
  beforeEach(() => {
    BroadcastChannelStub.reset();
    vi.stubGlobal('BroadcastChannel', BroadcastChannelStub);
  });

  afterEach(() => vi.unstubAllGlobals());

  it('publica la ruta en el canal compartido y cierra su canal', () => {
    announceGoalContributionLink('abc123');

    const [channel] = BroadcastChannelStub.instances;
    expect(channel.name).toBe(GOAL_CONTRIBUTION_CHANNEL);
    expect(channel.posted).toEqual([
      {
        type: GOAL_CONTRIBUTION_LINK_OPENED,
        path: '/goals/aceptar?token=abc123',
      },
    ]);
    expect(channel.closed).toBe(true);
  });

  it('no publica nada sin token', () => {
    announceGoalContributionLink('');
    expect(BroadcastChannelStub.instances).toHaveLength(0);
  });

  it('no falla en navegadores sin BroadcastChannel', () => {
    vi.stubGlobal('BroadcastChannel', undefined);
    expect(() => announceGoalContributionLink('abc123')).not.toThrow();
  });
});
