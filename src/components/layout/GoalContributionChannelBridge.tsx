"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  GOAL_CONTRIBUTION_CHANNEL,
  goalContributionPathFromMessage,
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
      const path = goalContributionPathFromMessage(event.data);
      if (!path) return;

      const current = `${window.location.pathname}${window.location.search}`;
      if (current === path) return;

      router.push(path);
    };

    return () => channel.close();
  }, [router]);

  return null;
}
