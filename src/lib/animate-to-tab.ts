const ANIMATION_MS = 360;

/**
 * Anima una copia de la fila desde su posición actual hasta la pestaña de destino.
 * Es un efecto visual: el estado ya se actualiza de forma optimista.
 */
export function animateRowToTab(source: HTMLElement | null, target: HTMLElement | null) {
  if (!source || !target) return;
  if (typeof window === "undefined") return;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

  const sourceRect = source.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();
  if (!sourceRect.width || !sourceRect.height) return;

  const clone = source.cloneNode(true) as HTMLElement;
  clone.classList.add("finance-flying-row");
  clone.removeAttribute("data-subscription-row");
  clone.removeAttribute("data-goal-card");
  clone.setAttribute("aria-hidden", "true");
  clone.style.position = "fixed";
  clone.style.left = `${sourceRect.left}px`;
  clone.style.top = `${sourceRect.top}px`;
  clone.style.width = `${sourceRect.width}px`;
  clone.style.height = `${sourceRect.height}px`;
  clone.style.margin = "0";
  clone.style.pointerEvents = "none";
  clone.style.zIndex = "60";
  clone.style.boxShadow = "0 12px 30px rgba(0, 0, 0, 0.16)";
  clone.style.transformOrigin = "center";
  clone.style.willChange = "transform, opacity";
  clone.style.transition = `transform ${ANIMATION_MS}ms cubic-bezier(0.2, 0.8, 0.2, 1), opacity ${ANIMATION_MS}ms ease`;

  document.body.appendChild(clone);

  const translateX =
    targetRect.left + targetRect.width / 2 - (sourceRect.left + sourceRect.width / 2);
  const translateY =
    targetRect.top + targetRect.height / 2 - (sourceRect.top + sourceRect.height / 2);

  requestAnimationFrame(() => {
    clone.style.transform = `translate(${translateX}px, ${translateY}px) scale(0.2)`;
    clone.style.opacity = "0";
  });

  target.animate?.(
    [
      { transform: "scale(1)" },
      { transform: "scale(1.08)" },
      { transform: "scale(1)" },
    ],
    { duration: ANIMATION_MS, easing: "ease-out" }
  );

  window.setTimeout(() => clone.remove(), ANIMATION_MS + 40);
}
