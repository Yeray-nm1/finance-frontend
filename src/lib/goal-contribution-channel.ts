/**
 * Puente entre pestañas para la aceptación de aportaciones.
 *
 * Al abrir el enlace del correo en una pestaña nueva, esta publica la ruta de
 * aceptación en un BroadcastChannel. La pestaña que ya tenía la app abierta la
 * recibe, confirma con un ACK y navega allí. La pestaña del correo, al recibir
 * el ACK, salta a /goals para que no queden dos formularios abiertos.
 *
 * Es un aviso entre pestañas del mismo navegador: no garantiza el foco y no
 * puede cerrar la pestaña nueva (el navegador solo permite cerrar ventanas
 * abiertas por script, y esta la abre el cliente de correo).
 */

export const GOAL_CONTRIBUTION_CHANNEL = "finance-goal-contribution";
export const GOAL_CONTRIBUTION_LINK_OPENED = "GOAL_CONTRIBUTION_LINK_OPENED";
export const GOAL_CONTRIBUTION_LINK_ACK = "GOAL_CONTRIBUTION_LINK_ACK";
export const GOALS_PATH = "/goals";

const ACCEPT_PATH = "/goals/aceptar";
const HANDOFF_TIMEOUT_MS = 1500;
const HANDOFF_KEY = "finance-goal-contribution-handoff";
// Una sola pestaña tiene dos canales (el puente y el emisor): el id evita que se
// confirmen entre sí y se retiren a /goals sin otra pestaña implicada.
const TAB_ID = createTabId();
// Origen ficticio solo para validar que el mensaje trae una ruta relativa nuestra.
const VALIDATION_ORIGIN = "https://finance.local";

export interface GoalContributionLinkMessage {
  readonly type: typeof GOAL_CONTRIBUTION_LINK_OPENED;
  readonly path: string;
  readonly requestId: string;
  readonly sourceId: string;
}

export interface GoalContributionAckMessage {
  readonly type: typeof GOAL_CONTRIBUTION_LINK_ACK;
  readonly requestId: string;
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

export function goalContributionLinkFromMessage(
  value: unknown
): { readonly path: string; readonly requestId: string; readonly sourceId: string } | null {
  if (typeof value !== "object" || value === null) return null;
  const message = value as Record<string, unknown>;
  if (typeof message.requestId !== "string" || message.requestId.length === 0) return null;
  if (typeof message.sourceId !== "string" || message.sourceId.length === 0) return null;

  const path = goalContributionPathFromMessage(value);
  return path ? { path, requestId: message.requestId, sourceId: message.sourceId } : null;
}

/** Identificador de esta pestaña, estable durante toda la sesión de la página. */
function createTabId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function isSameTab(sourceId: string): boolean {
  return sourceId === TAB_ID;
}

export function isGoalContributionAck(value: unknown, requestId: string): boolean {
  if (typeof value !== "object" || value === null) return false;
  const message = value as Record<string, unknown>;
  return (
    message.type === GOAL_CONTRIBUTION_LINK_ACK && message.requestId === requestId
  );
}

/**
 * La pestaña que recibe el aviso navega a la aceptación. Marcamos el token para
 * que esa página no vuelva a emitir el enlace: si lo hiciera, la pestaña del
 * correo (ya retirada a /goals) podría volver al formulario.
 */
export function markHandoff(token: string): void {
  try {
    sessionStorage.setItem(HANDOFF_KEY, token);
  } catch {
    // sessionStorage puede estar bloqueado; en ese caso solo perdemos la marca.
  }
}

export function consumeHandoff(token: string): boolean {
  try {
    if (sessionStorage.getItem(HANDOFF_KEY) !== token) return false;
    sessionStorage.removeItem(HANDOFF_KEY);
    return true;
  } catch {
    return false;
  }
}

function newRequestId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/**
 * Publica el enlace y espera el ACK de otra pestaña. Si llega, llama a
 * `onHandoff` (la página de aceptación salta a /goals). Si no hay otra pestaña
 * interesada, se conforma con el timeout y deja el formulario donde está.
 * Devuelve la función de limpieza para cerrar el canal al desmontar.
 */
export function announceGoalContributionLink(
  token: string,
  onHandoff: () => void
): () => void {
  if (!token || typeof BroadcastChannel === "undefined") return () => {};

  const channel = new BroadcastChannel(GOAL_CONTRIBUTION_CHANNEL);
  const requestId = newRequestId();
  let settled = false;

  function close(): void {
    if (settled) return;
    settled = true;
    clearTimeout(timer);
    channel.onmessage = null;
    channel.close();
  }

  const timer = setTimeout(close, HANDOFF_TIMEOUT_MS);
  channel.onmessage = (event: MessageEvent<unknown>) => {
    if (!isGoalContributionAck(event.data, requestId)) return;
    close();
    onHandoff();
  };

  channel.postMessage({
    type: GOAL_CONTRIBUTION_LINK_OPENED,
    path: goalContributionAcceptPath(token),
    requestId,
    sourceId: TAB_ID,
  } satisfies GoalContributionLinkMessage);

  return close;
}
