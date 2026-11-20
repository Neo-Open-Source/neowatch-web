import type { EpisodeItem } from "../data/types";

export const weekdays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"] as const;

export const months = [
  "Январь",
  "Февраль",
  "Март",
  "Апрель",
  "Май",
  "Июнь",
  "Июль",
  "Август",
  "Сентябрь",
  "Октябрь",
  "Ноябрь",
  "Декабрь",
] as const;

export const monthsShort = [
  "янв.",
  "февр.",
  "март",
  "апр.",
  "май",
  "июнь",
  "июль",
  "авг.",
  "сент.",
  "окт.",
  "нояб.",
  "дек.",
] as const;

const pad = (value: number): string => String(value).padStart(2, "0");

export function dateKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function parseDateKey(value: string): Date | null {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

export function dateLabel(value: string): string {
  const date = parseDateKey(value);
  if (!date) return "—";
  return `${pad(date.getDate())} ${monthsShort[date.getMonth()]} ${date.getFullYear()}`;
}

export interface CalendarDay {
  date: string;
  weekday: string;
  day: string;
  month: string;
  items: EpisodeItem[];
}

// EpisodeItem carries pre-formatted Russian calendar fields from the API; the
// weekend accent keys off the same short weekday labels, kept here so the
// widget stays presentation-only.
const weekendDays = new Set<string>([weekdays[5], weekdays[6]]);

export function isWeekend(weekday: string): boolean {
  return weekendDays.has(weekday);
}

export function groupByDay(episodes: EpisodeItem[] | null): CalendarDay[] {
  if (!episodes) return [];
  const days = new Map<string, CalendarDay>();
  for (const episode of episodes) {
    const existing = days.get(episode.date);
    if (existing) existing.items.push(episode);
    else
      days.set(episode.date, {
        date: episode.date,
        weekday: episode.weekday,
        day: episode.day,
        month: episode.month,
        items: [episode],
      });
  }
  return [...days.values()];
}
