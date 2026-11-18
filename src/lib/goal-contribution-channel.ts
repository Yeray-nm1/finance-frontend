/**
 * Puente entre pestañas para la aceptación de aportaciones.
 *
 * Al abrir el enlace del correo en una pestaña nueva, esta publica la ruta de
 * aceptación en un BroadcastChannel. La pestaña que ya tenía la app abierta la
 * recibe y navega allí. Es un aviso: el navegador no garantiza el foco.
 */

export const GOAL_CONTRIBUTION_CHANNEL = "finance-goal-contribution";
export const GOAL_CONTRIBUTION_LINK_OPENED = "GOAL_CONTRIBUTION_LINK_OPENED";

const ACCEPT_PATH = "/goals/aceptar";
// Origen ficticio solo para validar que el mensaje trae una ruta relativa nuestra.
const VALIDATION_ORIGIN = "https://finance.local";

export interface GoalContributionLinkMessage {
  readonly type: typeof GOAL_CONTRIBUTION_LINK_OPENED;
  readonly path: string;
}

export function goalContributionAcceptPath(token: string): string {
  return `${ACCEPT_PATH}?token=${encodeURIComponent(token)}`;
}

/**
 * Valida un mensaje del canal y devuelve su ruta canónica, o null si no es un
 * enlace de aceptación nuestro. Así un mensaje manipulado no puede navegar a un
 * destino externo ni añadir parámetros.
 */
export function goalContributionPathFromMessage(value: unknown): string | null {
  if (typeof value !== "object" || value === null) return null;

  const message = value as Record<string, unknown>;
  if (message.type !== GOAL_CONTRIBUTION_LINK_OPENED) return null;
  if (typeof message.path !== "string" || !message.path.startsWith("/")) return null;

  let url: URL;
  try {
    url = new URL(message.path, VALIDATION_ORIGIN);
  } catch {
    return null;
  }

  if (url.origin !== VALIDATION_ORIGIN) return null;
  if (url.pathname !== ACCEPT_PATH) return null;
  if (url.hash) return null;

  const params = [...url.searchParams.keys()];
  if (params.length !== 1 || params[0] !== "token") return null;

  const token = url.searchParams.get("token");
  if (!token) return null;

  return goalContributionAcceptPath(token);
}

/** Avisa a las demás pestañas del mismo origen de que se abrió el enlace. */
export function announceGoalContributionLink(token: string): void {
  if (!token || typeof BroadcastChannel === "undefined") return;

  const channel = new BroadcastChannel(GOAL_CONTRIBUTION_CHANNEL);
  try {
    channel.postMessage({
      type: GOAL_CONTRIBUTION_LINK_OPENED,
      path: goalContributionAcceptPath(token),
    } satisfies GoalContributionLinkMessage);
  } finally {
    channel.close();
  }
}
