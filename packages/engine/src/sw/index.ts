/// <reference lib="webworker" />
import { hasUpdate, type VersionManifest } from "../lib/updates/version";

declare const self: ServiceWorkerGlobalScope;

const VERSION_URL = "/~version.json";

let servedBuild = "";

async function notify(): Promise<void> {
  const response = await fetch(VERSION_URL, { cache: "no-store" });
  if (!response.ok) return;
  const manifest = (await response.json()) as VersionManifest;
  if (!hasUpdate(manifest.build, servedBuild)) return;
  for (const client of await self.clients.matchAll({ type: "window" })) {
    client.postMessage({ type: "update-available", build: manifest.build });
  }
}

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("message", (event) => {
  if (event.data?.type === "served-build") {
    servedBuild = event.data.build;
    return;
  }
  if (event.data?.type === "check-update") {
    event.waitUntil(notify());
    return;
  }
  if (event.data?.type === "apply-update") {
    event.waitUntil(self.skipWaiting());
  }
});
