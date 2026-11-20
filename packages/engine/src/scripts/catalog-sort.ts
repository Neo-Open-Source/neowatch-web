import { bindEach } from "../lib/client/bind";

bindEach<HTMLElement>("[data-catalog]", () => {
  const url = new URL(window.location.href);
  if (url.pathname !== "/catalog" || url.searchParams.has("sort")) return undefined;
  url.searchParams.set("sort", "popular");
  window.history.replaceState(window.history.state, "", url);
  return undefined;
});
