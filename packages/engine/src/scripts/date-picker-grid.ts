import { dateKey, months, weekdays } from "../lib/dates";

const ICON_PREV =
  '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>';
const ICON_NEXT =
  '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>';
const ICON_PREV_YEAR =
  '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m11 17-5-5 5-5"/><path d="m18 17-5-5 5-5"/></svg>';
const ICON_NEXT_YEAR =
  '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m13 17 5-5-5-5"/><path d="m6 17 5-5-5-5"/></svg>';

const NAV =
  "grid size-7 place-items-center rounded-sm text-muted transition-colors hover:bg-surface-hover hover:text-ink";
const MUTED_CELL = "grid h-8 w-8 place-items-center text-caption text-faint/40";
const CELLS = 42;

export interface DateRange {
  min: string;
  max: string;
}

export function monthGridHtml(
  view: Date,
  selectedKey: string,
  range?: DateRange,
  showClear = true,
): string {
  const year = view.getFullYear();
  const month = view.getMonth();
  const startShift = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevDays = new Date(year, month, 0).getDate();

  const cells: string[] = [];
  for (let i = startShift - 1; i >= 0; i -= 1) {
    cells.push(`<span class="${MUTED_CELL}">${prevDays - i}</span>`);
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    const value = dateKey(new Date(year, month, day));
    const blocked = range !== undefined && (value < range.min || value > range.max);
    const classes = blocked
      ? "text-faint/40 cursor-not-allowed"
      : value === selectedKey
        ? "bg-accent text-on-accent font-semibold"
        : "text-ink hover:bg-surface-hover";
    cells.push(
      `<button class="grid h-8 w-8 place-items-center rounded-sm text-caption transition-colors ${classes}" type="button" data-date-day="${value}"${blocked ? " disabled" : ""}>${day}</button>`,
    );
  }
  for (let day = 1; cells.length < CELLS; day += 1) {
    cells.push(`<span class="${MUTED_CELL}">${day}</span>`);
  }

  return `
    <div class="flex items-center justify-between gap-2 pb-3">
      <button class="${NAV}" type="button" data-date-prev-year aria-label="Предыдущий год">${ICON_PREV_YEAR}</button>
      <button class="${NAV}" type="button" data-date-prev aria-label="Предыдущий месяц">${ICON_PREV}</button>
      <span class="flex-1 text-center text-ui font-medium text-ink">${months[month]} ${year}</span>
      <button class="${NAV}" type="button" data-date-next aria-label="Следующий месяц">${ICON_NEXT}</button>
      <button class="${NAV}" type="button" data-date-next-year aria-label="Следующий год">${ICON_NEXT_YEAR}</button>
    </div>
    <div class="grid grid-cols-7 gap-0.5 pb-1">
      ${weekdays.map((day) => `<span class="grid h-7 place-items-center text-micro text-faint">${day}</span>`).join("")}
    </div>
    <div class="grid grid-cols-7 gap-0.5">${cells.join("")}</div>
    <div class="mt-2 flex items-center border-t border-line pt-2">
      ${showClear ? '<button class="rounded-sm px-1.5 py-1 text-caption text-faint transition-colors hover:text-ink" type="button" data-date-clear>Очистить</button>' : ""}
      <button class="ml-auto rounded-sm px-1.5 py-1 text-caption text-muted transition-colors hover:text-ink" type="button" data-date-today>Сегодня</button>
    </div>
  `;
}
