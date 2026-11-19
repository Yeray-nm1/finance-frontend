"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  GOALS_PATH,
  GOAL_CONTRIBUTION_CHANNEL,
  GOAL_CONTRIBUTION_LINK_ACK,
  goalContributionLinkFromMessage,
  isSameTab,
} from "@/lib/goal-contribution-channel";

/**
 * Escucha el enlace del correo abierto en otra pestaña: confirma con un ACK y
 * se retira a /goals para dejar el formulario solo en la pestaña del enlace.
 * Se monta una sola vez en el layout raíz; no dibuja nada.
 */
export function GoalContributionChannelBridge() {
  const router = useRouter();

  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") return;

    const channel = new BroadcastChannel(GOAL_CONTRIBUTION_CHANNEL);
    channel.onmessage = (event: MessageEvent<unknown>) => {
      const link = goalContributionLinkFromMessage(event.data);
      if (!link || isSameTab(link.sourceId)) return;

      // Confirmamos recepción antes de retirarnos: la pestaña del enlace
      // conserva el formulario y cierra su canal al recibir el ACK.
      channel.postMessage({
        type: GOAL_CONTRIBUTION_LINK_ACK,
        requestId: link.requestId,
      });

      if (window.location.pathname === GOALS_PATH) return;
      router.replace(GOALS_PATH);
    };

    return () => channel.close();
  }, [router]);

  return null;
}
