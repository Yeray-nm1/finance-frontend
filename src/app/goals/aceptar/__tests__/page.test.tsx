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
  goalId: 'goal-1',
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

function amountInput() {
  return screen.getByLabelText('Importe de la aportación (€)');
}

function updateCheckbox() {
  return screen.getByRole('checkbox', {
    name: 'Actualizar el importe para futuras aportaciones',
  });
}

async function fillForm(user: ReturnType<typeof userEvent.setup>, amount = '25') {
  await user.selectOptions(await screen.findByRole('combobox', { name: 'Cuenta origen' }), 'checking');
  await user.clear(amountInput());
  await user.type(amountInput(), amount);
}

describe('AcceptContributionPage · aviso unificado', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    BroadcastChannelStub.reset();
    vi.stubGlobal('BroadcastChannel', BroadcastChannelStub);
    navigation.token = 'token-valido';
    vi.mocked(api.goalContributions.getPending).mockResolvedValue(pending as never);
    vi.mocked(api.goalContributions.accept).mockResolvedValue({
      id: 'contribution-1',
      status: 'accepted',
      amount: 25,
      alreadyAccepted: false,
    } as never);
  });

  afterEach(() => vi.unstubAllGlobals());

  it('CA-WI6.1 consulta el pendiente sin crear transferencias y muestra el subtítulo', async () => {
    render(<AcceptContributionPage />);

    expect(
      await screen.findByRole('heading', { name: 'Confirma tu aportación' })
    ).toBeVisible();
    expect(screen.getByText('Aportación programada · 2026-11')).toBeVisible();
    expect(amountInput()).toHaveValue(100);
    expect(screen.getByRole('combobox', { name: 'Cuenta origen' })).toBeInTheDocument();
    expect(api.goalContributions.getPending).toHaveBeenCalledWith('token-valido');
    expect(api.goalContributions.accept).not.toHaveBeenCalled();
  });

  it('CA-WI6.1 el periodo vive solo en el subtítulo, sin bloque Meta / Periodo en la card', async () => {
    render(<AcceptContributionPage />);

    expect(
      await screen.findByText('Aportación programada · 2026-11')
    ).toBeVisible();
    expect(screen.queryByText('Meta')).not.toBeInTheDocument();
    expect(screen.queryByText('Periodo')).not.toBeInTheDocument();
    expect(screen.queryByText('2026-11')).not.toBeInTheDocument();
  });

  it('CA-WI6.1 con importe no muestra el aviso de «sin importe»', async () => {
    render(<AcceptContributionPage />);

    expect(
      await screen.findByRole('heading', { name: 'Confirma tu aportación' })
    ).toBeVisible();
    expect(screen.queryByText(/El aviso no incluye importe/)).not.toBeInTheDocument();
    expect(
      screen.queryByText(/No se realizará el movimiento hasta que confirmes/)
    ).not.toBeInTheDocument();
  });

  it('CA-WI6.1 sin importe sí muestra el aviso de decisión y de no movimiento', async () => {
    vi.mocked(api.goalContributions.getPending).mockResolvedValue({
      ...pending,
      amount: null,
    } as never);
    render(<AcceptContributionPage />);

    expect(await screen.findByText(/El aviso no incluye importe/)).toBeVisible();
    expect(
      screen.getByText(/No se realizará el movimiento hasta que confirmes/)
    ).toBeVisible();
    expect(screen.queryByText(/No se cobrará/)).not.toBeInTheDocument();
  });

  it('CA-WI6.1 el checkbox nace deshabilitado y desmarcado, se habilita al editar y se desmarca al volver al importe original', async () => {
    const user = userEvent.setup();
    render(<AcceptContributionPage />);
    await screen.findByRole('combobox', { name: 'Cuenta origen' });

    expect(updateCheckbox()).toBeDisabled();
    expect(updateCheckbox()).not.toBeChecked();
    expect(updateCheckbox().closest('label')).toHaveClass('cursor-not-allowed');
    expect(updateCheckbox().closest('label')).toHaveClass('text-text-muted');

    await user.clear(amountInput());
    await user.type(amountInput(), '25');

    expect(updateCheckbox()).toBeEnabled();
    expect(updateCheckbox().closest('label')).toHaveClass('cursor-pointer');
    await user.click(updateCheckbox());
    expect(updateCheckbox()).toBeChecked();

    await user.clear(amountInput());
    await user.type(amountInput(), '100');

    expect(updateCheckbox()).toBeDisabled();
    expect(updateCheckbox()).not.toBeChecked();
  });

  it('CA-WI6.2 el submit envía el importe editado y el checkbox marcado', async () => {
    const user = userEvent.setup();
    vi.mocked(api.goalContributions.accept).mockResolvedValue({
      id: 'contribution-1',
      status: 'accepted',
      amount: 25.5,
      alreadyAccepted: false,
    } as never);
    render(<AcceptContributionPage />);

    await user.selectOptions(
      await screen.findByRole('combobox', { name: 'Cuenta origen' }),
      'checking'
    );
    await user.clear(amountInput());
    await user.type(amountInput(), '25.50');
    await user.click(updateCheckbox());
    await user.click(screen.getByRole('button', { name: 'Aceptar aportación' }));

    await waitFor(() =>
      expect(api.goalContributions.accept).toHaveBeenCalledWith(
        'token-valido',
        'checking',
        25.5,
        true
      )
    );
    expect(
      await screen.findByRole('heading', { name: 'Aportación confirmada' })
    ).toBeVisible();
    expect(screen.getByText(/Se ha registrado 25,50/)).toBeVisible();
    expect(screen.getByText(/«Viaje a Japón»/)).toBeVisible();
  });

  it('CA-WI6.2 sin marcar el checkbox envía updateSuggestion false', async () => {
    const user = userEvent.setup();
    render(<AcceptContributionPage />);

    await fillForm(user);
    await user.click(screen.getByRole('button', { name: 'Aceptar aportación' }));

    await waitFor(() =>
      expect(api.goalContributions.accept).toHaveBeenCalledWith(
        'token-valido',
        'checking',
        25,
        false
      )
    );
  });

  it('CA-WI6.2 sin sugerencia el campo nace vacío y el botón espera un importe válido', async () => {
    const user = userEvent.setup();
    vi.mocked(api.goalContributions.getPending).mockResolvedValue({
      ...pending,
      amount: null,
    } as never);
    render(<AcceptContributionPage />);

    const submit = await screen.findByRole('button', { name: 'Aceptar aportación' });
    expect(amountInput()).toHaveValue(null);
    expect(submit).toBeDisabled();

    await user.selectOptions(screen.getByRole('combobox', { name: 'Cuenta origen' }), 'checking');
    expect(submit).toBeDisabled();
    await user.type(amountInput(), '0');
    expect(submit).toBeDisabled();
    await user.clear(amountInput());
    await user.type(amountInput(), '25');
    expect(submit).toBeEnabled();
  });

  it('CA-WI6.3 un enlace ya aceptado muestra el texto de doble confirmación sin formulario', async () => {
    vi.mocked(api.goalContributions.getPending).mockResolvedValue({
      ...pending,
      status: 'accepted',
    } as never);
    render(<AcceptContributionPage />);

    expect(
      await screen.findByRole('heading', { name: 'Ya confirmaste esta aportación' })
    ).toBeVisible();
    expect(
      screen.getByText(
        'Esta aportación ya se hizo anteriormente para el periodo 2026-11. No se ha vuelto a realizar el movimiento.'
      )
    ).toBeVisible();
    expect(screen.getByText('Aportación programada · 2026-11')).toBeVisible();
    expect(screen.queryByRole('combobox', { name: 'Cuenta origen' })).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Importe de la aportación (€)')).not.toBeInTheDocument();
    expect(api.goalContributions.accept).not.toHaveBeenCalled();
  });

  it('CA-WI6.4 la aceptación reciente muestra comprobante, subtítulo y ambos enlaces', async () => {
    const user = userEvent.setup();
    render(<AcceptContributionPage />);

    await fillForm(user);
    await user.click(screen.getByRole('button', { name: 'Aceptar aportación' }));

    expect(
      await screen.findByRole('heading', { name: 'Aportación confirmada' })
    ).toBeVisible();
    expect(screen.getByText(/Se ha registrado 25,00/)).toBeVisible();
    expect(screen.getByText('Aportación programada · 2026-11')).toBeVisible();
    expect(screen.getByRole('link', { name: 'Ver movimientos' })).toHaveAttribute(
      'href',
      '/transactions?goalId=goal-1&month=2026-11'
    );
    expect(screen.getByRole('link', { name: 'Volver a metas' })).toHaveAttribute(
      'href',
      '/goals'
    );
  });

  it('CA-WI6.3 la doble confirmación tras el POST también lleva ambos enlaces', async () => {
    const user = userEvent.setup();
    vi.mocked(api.goalContributions.accept).mockResolvedValue({
      id: 'contribution-1',
      status: 'accepted',
      alreadyAccepted: true,
    } as never);
    render(<AcceptContributionPage />);

    await fillForm(user);
    await user.click(screen.getByRole('button', { name: 'Aceptar aportación' }));

    expect(
      await screen.findByRole('heading', { name: 'Ya confirmaste esta aportación' })
    ).toBeVisible();
    expect(screen.getByRole('link', { name: 'Ver movimientos' })).toHaveAttribute(
      'href',
      '/transactions?goalId=goal-1&month=2026-11'
    );
    expect(screen.getByRole('link', { name: 'Volver a metas' })).toHaveAttribute(
      'href',
      '/goals'
    );
  });

  it('CA-5.5 muestra el error de un enlace caducado sin formulario', async () => {
    vi.mocked(api.goalContributions.getPending).mockRejectedValue(
      new Error('El periodo de la aportación ya ha terminado')
    );
    render(<AcceptContributionPage />);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'El periodo de la aportación ya ha terminado'
    );
    expect(screen.queryByRole('combobox', { name: 'Cuenta origen' })).not.toBeInTheDocument();
  });

  it('CA-5.5 muestra el error del servidor y conserva el formulario', async () => {
    const user = userEvent.setup();
    vi.mocked(api.goalContributions.accept).mockRejectedValue(
      new Error('La cuenta origen no es válida')
    );
    render(<AcceptContributionPage />);

    await fillForm(user);
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
