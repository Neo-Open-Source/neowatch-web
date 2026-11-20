import { bindEach } from "../lib/client/bind";
import { dateLabel } from "../lib/dates";

bindEach<HTMLElement>("[data-calendar]", (widget, signal) => {
  const days = [...widget.querySelectorAll<HTMLElement>("[data-calendar-day]")];
  const picker = document.querySelector<HTMLElement>('[data-date-id="calendar-jump"]');
  const todayKey = widget.dataset.today;

  const select = (key: string): void => {
    const match = days.find((day) => day.dataset.calendarDay === key);
    for (const other of days) {
      const on = other === match;
      other.dataset.active = String(on);
      other.setAttribute("aria-pressed", String(on));
    }
    match?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });

    const hidden = picker?.querySelector<HTMLInputElement>("[data-date-value]");
    const label = picker?.querySelector<HTMLElement>("[data-date-label]");
    if (hidden) hidden.value = key;
    if (label) label.textContent = dateLabel(key);
  };

  for (const day of days) {
    day.addEventListener("click", () => select(day.dataset.calendarDay ?? ""));
  }

  document.addEventListener(
    "date-change",
    (event) => {
      const source = event.target;
      if (!(source instanceof HTMLElement)) return;
      if (source.dataset.dateId !== "calendar-jump") return;
      const value = (event as CustomEvent<string>).detail;
      if (value) select(value);
    },
    { signal },
  );

  const strip = widget.querySelector<HTMLElement>("[data-calendar-strip]");
  if (!strip) return undefined;

  const arrows = [...widget.querySelectorAll<HTMLButtonElement>("[data-calendar-scroll]")];
  const syncArrows = (): void => {
    const max = strip.scrollWidth - strip.clientWidth;
    for (const arrow of arrows) {
      const isPrev = arrow.dataset.calendarScroll === "prev";
      arrow.hidden = max <= 4 || (isPrev ? strip.scrollLeft <= 4 : strip.scrollLeft >= max - 4);
    }
  };

  for (const button of arrows) {
    button.addEventListener("click", () => {
      const direction = button.dataset.calendarScroll === "prev" ? -1 : 1;
      strip.scrollBy({ left: direction * strip.clientWidth * 0.7, behavior: "smooth" });
    });
  }

  strip.addEventListener("scroll", () => requestAnimationFrame(syncArrows), { passive: true });
  const observer = new ResizeObserver(syncArrows);
  observer.observe(strip);
  syncArrows();
  if (todayKey) select(todayKey);

  return () => observer.disconnect();
});
