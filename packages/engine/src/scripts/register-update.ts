const build = document.documentElement.dataset.build ?? "";
const CHECK_INTERVAL_MS = 5 * 60_000;

function notifyWorker(message: Record<string, string>): void {
  navigator.serviceWorker?.controller?.postMessage(message);
}

navigator.serviceWorker?.addEventListener("message", (event) => {
  if (event.data?.type === "update-available") {
    document.documentElement.dataset.updateAvailable = event.data.build;
    window.dispatchEvent(new CustomEvent("nw:update", { detail: event.data.build }));
  }
});

window.addEventListener("load", async () => {
  if (!build || !navigator.serviceWorker) return;
  await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  await navigator.serviceWorker.ready;
  notifyWorker({ type: "served-build", build });
  setInterval(() => notifyWorker({ type: "check-update" }), CHECK_INTERVAL_MS);
});
