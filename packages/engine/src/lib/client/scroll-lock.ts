let holders = 0;

export function lockScroll(): void {
  holders += 1;
  if (holders > 1) return;
  document.documentElement.style.overflow = "hidden";
}

export function unlockScroll(): void {
  holders = Math.max(0, holders - 1);
  if (holders > 0) return;
  document.documentElement.style.overflow = "";
}
