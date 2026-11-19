import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { api } from '@/lib/api';
import { BroadcastChannelStub } from '@/lib/__tests__/broadcast-channel-stub';
import {
  GOAL_CONTRIBUTION_CHANNEL,
  GOAL_CONTRIBUTION_LINK_ACK,
  GOAL_CONTRIBUTION_LINK_OPENED,
} from '@/lib/goal-contribution-channel';
import AcceptContributionPage from '../page';

const navigation = vi.hoisted(() => ({
  token: 'token-valido' as string | null,
}));

vi.mock('next/navigation', () => ({
  useSearchParams: () =>
    new URLSearchParams(navigation.token ? `?token=${navigation.token}` : ''),
}));

vi.mock('@/lib/api', () => ({
  api: {
    goalContributions: {
      getPending: vi.fn(),
      accept: vi.fn(),
    },
  },
}));

const pending = {
  id: 'contribution-1',
  amount: 100,
  period: '2026-11',
  goalName: 'Viaje a Japón',
  status: 'pending',
  goalAccountId: 'savings',
  accounts: [
    { id: 'checking', name: 'Cuenta corriente', type: 'checking' },
    { id: 'other', name: 'Ahorro extra', type: 'savings' },
  ],
};

describe('AcceptContributionPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    BroadcastChannelStub.reset();
    vi.stubGlobal('BroadcastChannel', BroadcastChannelStub);
    navigation.token = 'token-valido';
    vi.mocked(api.goalContributions.getPending).mockResolvedValue(pending as never);
    vi.mocked(api.goalContributions.accept).mockResolvedValue({
      id: 'contribution-1',
      status: 'accepted',
      alreadyAccepted: false,
    } as never);
  });

  afterEach(() => vi.unstubAllGlobals());

  it('CA-5.2 consulta el pendiente sin crear ninguna transferencia al abrir la página', async () => {
    render(<AcceptContributionPage />);

    expect(
      await screen.findByRole('heading', { name: 'Confirma tu aportación' })
    ).toBeVisible();
    expect(screen.getByText('Viaje a Japón')).toBeVisible();
    expect(screen.getByText(/2026-11/)).toBeVisible();
    expect(screen.getByText(/100,00/)).toBeVisible();
    expect(screen.getByRole('combobox', { name: 'Cuenta origen' })).toBeInTheDocument();
    expect(api.goalContributions.getPending).toHaveBeenCalledWith('token-valido');
    expect(api.goalContributions.accept).not.toHaveBeenCalled();
  });

  it('FIX-3 reabrir un enlace ya aceptado muestra la confirmación sin formulario', async () => {
    vi.mocked(api.goalContributions.getPending).mockResolvedValue({
      ...pending,
      status: 'accepted',
    } as never);
    render(<AcceptContributionPage />);

    expect(
      await screen.findByRole('heading', { name: 'Aportación confirmada' })
    ).toBeVisible();
    expect(screen.getByText(/Se ha registrado/)).toBeVisible();
    expect(
      screen.queryByRole('combobox', { name: 'Cuenta origen' })
    ).not.toBeInTheDocument();
    expect(api.goalContributions.accept).not.toHaveBeenCalled();
  });

  it('CA-5.3 exige elegir la cuenta origen antes de aceptar', async () => {
    const user = userEvent.setup();
    render(<AcceptContributionPage />);

    const acceptButton = await screen.findByRole('button', { name: 'Aceptar aportación' });
    expect(acceptButton).toBeDisabled();

    await user.selectOptions(screen.getByRole('combobox', { name: 'Cuenta origen' }), 'checking');
    expect(acceptButton).toBeEnabled();
    expect(api.goalContributions.accept).not.toHaveBeenCalled();
  });

  it('CA-5.4 acepta con el token de la URL y la cuenta elegida', async () => {
    const user = userEvent.setup();
    render(<AcceptContributionPage />);

    await user.selectOptions(
      await screen.findByRole('combobox', { name: 'Cuenta origen' }),
      'checking'
    );
    await user.click(screen.getByRole('button', { name: 'Aceptar aportación' }));

    expect(api.goalContributions.accept).toHaveBeenCalledWith('token-valido', 'checking');
    expect(
      await screen.findByRole('heading', { name: 'Aportación confirmada' })
    ).toBeVisible();
    expect(screen.getByText(/Se ha registrado/)).toBeVisible();
    expect(screen.getByRole('link', { name: 'Volver a metas' })).toHaveAttribute('href', '/goals');
  });

  it('CA-5.5 muestra el error de un enlace caducado o desactivado sin formulario', async () => {
    vi.mocked(api.goalContributions.getPending).mockRejectedValue(
      new Error('El periodo de la aportación ya ha terminado')
    );
    render(<AcceptContributionPage />);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'El periodo de la aportación ya ha terminado'
    );
    expect(screen.queryByRole('combobox', { name: 'Cuenta origen' })).not.toBeInTheDocument();
    expect(api.goalContributions.accept).not.toHaveBeenCalled();
  });

  it('CA-5.5 muestra el error del servidor y conserva el formulario', async () => {
    const user = userEvent.setup();
    vi.mocked(api.goalContributions.accept).mockRejectedValue(
      new Error('La cuenta origen no es válida')
    );
    render(<AcceptContributionPage />);

    await user.selectOptions(
      await screen.findByRole('combobox', { name: 'Cuenta origen' }),
      'checking'
    );
    await user.click(screen.getByRole('button', { name: 'Aceptar aportación' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('La cuenta origen no es válida');
    expect(screen.getByRole('combobox', { name: 'Cuenta origen' })).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Aportación confirmada' })
    ).not.toBeInTheDocument();
  });

  it('CA-5.5 rechaza enlaces sin token', () => {
    navigation.token = null;
    render(<AcceptContributionPage />);

    expect(screen.getByText(/El enlace no es válido/i)).toBeInTheDocument();
    expect(api.goalContributions.getPending).not.toHaveBeenCalled();
  });

  it('CA-5.4 una aceptación repetida también muestra la confirmación', async () => {
    const user = userEvent.setup();
    vi.mocked(api.goalContributions.accept).mockResolvedValue({
      id: 'contribution-1',
      status: 'accepted',
      alreadyAccepted: true,
    } as never);
    render(<AcceptContributionPage />);

    await user.selectOptions(
      await screen.findByRole('combobox', { name: 'Cuenta origen' }),
      'checking'
    );
    await user.click(screen.getByRole('button', { name: 'Aceptar aportación' }));

    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: 'Aportación confirmada' })
      ).toBeVisible()
    );
  });

  it('BC-1 avisa a las demás pestañas al abrir el enlace con token', async () => {
    render(<AcceptContributionPage />);

    await waitFor(() => {
      const channel = BroadcastChannelStub.instances[0];
      expect(channel?.posted).toContainEqual({
        type: GOAL_CONTRIBUTION_LINK_OPENED,
        path: '/goals/aceptar?token=token-valido',
        requestId: expect.any(String),
        sourceId: expect.any(String),
      });
    });
  });

  it('BC-2 mantiene el formulario en esta pestaña cuando la vieja confirma', async () => {
    render(<AcceptContributionPage />);

    await waitFor(() => expect(BroadcastChannelStub.instances[0]?.posted[0]).toBeDefined());
    const { requestId } = BroadcastChannelStub.instances[0].posted[0] as { requestId: string };
    const otherTab = new BroadcastChannelStub(GOAL_CONTRIBUTION_CHANNEL);
    otherTab.postMessage({ type: GOAL_CONTRIBUTION_LINK_ACK, requestId });

    expect(
      await screen.findByRole('heading', { name: 'Confirma tu aportación' })
    ).toBeVisible();
    expect(screen.getByRole('combobox', { name: 'Cuenta origen' })).toBeInTheDocument();
    expect(BroadcastChannelStub.instances[0].closed).toBe(true);
  });

  it('BC-2 ignora un ACK de otra petición', async () => {
    render(<AcceptContributionPage />);

    await waitFor(() => expect(BroadcastChannelStub.instances[0]?.posted[0]).toBeDefined());
    const otherTab = new BroadcastChannelStub(GOAL_CONTRIBUTION_CHANNEL);
    otherTab.postMessage({ type: GOAL_CONTRIBUTION_LINK_ACK, requestId: 'otro' });

    expect(BroadcastChannelStub.instances[0].closed).toBe(false);
  });

  it('BC-1 no publica nada si la página se abre sin token', () => {
    navigation.token = null;
    render(<AcceptContributionPage />);

    expect(BroadcastChannelStub.instances).toHaveLength(0);
  });
});
