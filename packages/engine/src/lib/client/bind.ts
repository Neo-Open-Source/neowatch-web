type Teardown = () => void;

let controller = new AbortController();
const teardowns: Teardown[] = [];

const reset = (): void => {
  controller.abort();
  for (const teardown of teardowns.splice(0)) teardown();
  controller = new AbortController();
};

document.addEventListener("astro:before-swap", reset);

export function bindEach<T extends HTMLElement>(
  selector: string,
  setup: (element: T, signal: AbortSignal) => Teardown | undefined,
): void {
  document.addEventListener("astro:page-load", () => {
    for (const element of document.querySelectorAll<T>(selector)) {
      const teardown = setup(element, controller.signal);
      if (teardown) teardowns.push(teardown);
    }
  });
}
