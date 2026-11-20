import { bindEach } from "../../lib/client/bind";

bindEach<HTMLElement>("[data-stepper]", (box) => {
  const input = box.querySelector<HTMLInputElement>("input");
  if (!input) return undefined;

  const limit = Number(input.max);
  const clamp = (raw: number): number => {
    const value = Math.max(0, raw);
    return Number.isFinite(limit) && limit > 0 ? Math.min(value, limit) : value;
  };
  const step = (delta: number): void => {
    input.value = String(clamp((Number(input.value) || 0) + delta));
    input.dispatchEvent(new Event("input", { bubbles: true }));
  };

  box.querySelector("[data-step-up]")?.addEventListener("click", () => step(1));
  box.querySelector("[data-step-down]")?.addEventListener("click", () => step(-1));

  return undefined;
});
