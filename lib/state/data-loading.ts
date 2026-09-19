let pending = 0;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export function beginDataLoad() {
  pending++;
  emit();
}

export function endDataLoad() {
  pending = Math.max(0, pending - 1);
  emit();
}

export function isDataLoading() {
  return pending > 0;
}

export function subscribeDataLoading(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
