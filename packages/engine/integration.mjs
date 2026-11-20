import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";

const pages = fileURLToPath(new URL("./src/pages", import.meta.url));
const buildStamp = readFileSync(new URL("../../BUILD_ID", import.meta.url), "utf8").trim();

export function neowatch() {
  return {
    name: "@neowatch/engine",
    hooks: {
      "astro:config:setup": ({ injectRoute, updateConfig }) => {
        updateConfig({
          vite: {
            define: { "import.meta.env.BUILD_ID": JSON.stringify(buildStamp) },
          },
        });
        injectRoute({ pattern: "/", entrypoint: `${pages}/index.astro` });
        injectRoute({ pattern: "catalog", entrypoint: `${pages}/catalog.astro` });
        injectRoute({ pattern: "calendar", entrypoint: `${pages}/calendar.astro` });
        injectRoute({ pattern: "history", entrypoint: `${pages}/history.astro` });
        injectRoute({ pattern: "about", entrypoint: `${pages}/about.astro` });
        injectRoute({ pattern: "terms", entrypoint: `${pages}/terms.astro` });
        injectRoute({ pattern: "settings", entrypoint: `${pages}/settings.astro` });
        injectRoute({ pattern: "settings/[section]", entrypoint: `${pages}/settings/[section].astro` });
        injectRoute({ pattern: "collections", entrypoint: `${pages}/collections/index.astro` });
        injectRoute({ pattern: "collections/[slug]", entrypoint: `${pages}/collections/[slug].astro` });
        injectRoute({ pattern: "watch/[slug]", entrypoint: `${pages}/watch/[slug].astro` });
        injectRoute({ pattern: "[slug]", entrypoint: `${pages}/[slug].astro` });
        injectRoute({ pattern: "~version.json", entrypoint: `${pages}/~version.json.ts` });
      },
    },
  };
}
