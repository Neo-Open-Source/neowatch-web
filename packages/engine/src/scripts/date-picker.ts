import { bindEach } from "../lib/client/bind";
import { attachPopover } from "../lib/client/popover";
import { dateKey, dateLabel, parseDateKey } from "../lib/dates";
import { monthGridHtml } from "./date-picker-grid";

const NAV_SHIFT: Record<string, [years: number, months: number]> = {
  "date-prev-year": [-1, 0],
  "date-prev": [0, -1],
  "date-next": [0, 1],
  "date-next-year": [1, 0],
};

bindEach<HTMLElement>("[data-date-picker]", (root, signal) => {
  const trigger = root.querySelector<HTMLButtonElement>("[data-date-trigger]");
  const label = root.querySelector<HTMLElement>("[data-date-label]");
  const hidden = root.querySelector<HTMLInputElement>("[data-date-value]");
  const panel = root.querySelector<HTMLElement>("[data-date-popup]");
  if (!trigger || !label || !hidden || !panel) return undefined;

  const initial = parseDateKey(hidden.value) ?? new Date();
  const { dateMin, dateMax } = root.dataset;
  const range = dateMin && dateMax ? { min: dateMin, max: dateMax } : undefined;
  const showClear = root.dataset.dateHideClear === undefined;
  let view = new Date(initial.getFullYear(), initial.getMonth(), 1);

  const render = (): void => {
    label.textContent = dateLabel(hidden.value);
    panel.innerHTML = monthGridHtml(view, hidden.value, range, showClear);
  };

  render();
  const popover = attachPopover({ trigger, panel, signal });

  const pick = (value: string): void => {
    hidden.value = value;
    render();
    popover.close();
    root.dispatchEvent(new CustomEvent("date-change", { bubbles: true, detail: value }));
  };

  panel.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const day = target.closest<HTMLElement>("[data-date-day]")?.dataset.dateDay;
    if (day) {
      pick(day);
      return;
    }

    for (const [name, [years, months]] of Object.entries(NAV_SHIFT)) {
      if (!target.closest(`[data-${name}]`)) continue;
      view = new Date(view.getFullYear() + years, view.getMonth() + months, 1);
      render();
      popover.reposition();
      return;
    }

    if (target.closest("[data-date-clear]")) {
      pick("");
      return;
    }
    if (target.closest("[data-date-today]")) {
      const now = new Date();
      view = new Date(now.getFullYear(), now.getMonth(), 1);
      pick(dateKey(now));
    }
  });

  return undefined;
});
