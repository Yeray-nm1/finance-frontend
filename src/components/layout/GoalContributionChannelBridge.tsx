"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  GOAL_CONTRIBUTION_CHANNEL,
  GOAL_CONTRIBUTION_LINK_ACK,
  goalContributionLinkFromMessage,
  isSameTab,
  markHandoff,
} from "@/lib/goal-contribution-channel";

/**
 * Escucha el enlace del correo abierto en otra pestaña y lleva esta a la
 * aceptación. Se monta una sola vez en el layout raíz; no dibuja nada.
 */
export function GoalContributionChannelBridge() {
  const router = useRouter();

  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") return;

    const channel = new BroadcastChannel(GOAL_CONTRIBUTION_CHANNEL);
    channel.onmessage = (event: MessageEvent<unknown>) => {
      const link = goalContributionLinkFromMessage(event.data);
      if (!link || isSameTab(link.sourceId)) return;

      // Confirmamos recepción antes de navegar: la pestaña del correo podrá
      // saltar a /goals y dejar un solo formulario abierto.
      channel.postMessage({
        type: GOAL_CONTRIBUTION_LINK_ACK,
        requestId: link.requestId,
      });

      const current = `${window.location.pathname}${window.location.search}`;
      if (current === link.path) return;

      markHandoff(new URL(link.path, window.location.origin).searchParams.get("token") ?? "");
      router.push(link.path);
    };

    return () => channel.close();
  }, [router]);

  return null;
}
