// @ts-check
import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import icon from "astro-icon";
import tailwindcss from "@tailwindcss/vite";
import { neowatch } from "@neowatch/engine/integration";
import { fileURLToPath } from "node:url";

export default defineConfig({
  site: process.env.PUBLIC_SITE_URL ?? "https://watch.neome.uk",
  output: "static",
  trailingSlash: "never",
  adapter: cloudflare({ imageService: "passthrough" }),
  integrations: [icon(), neowatch()],
  devToolbar: { enabled: false },
  session: false,
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        "@neowatch/engine": fileURLToPath(new URL("../engine/src", import.meta.url)),
        "@neowatch/module": fileURLToPath(new URL("./src/module.ts", import.meta.url)),
        "@neowatch/data": fileURLToPath(new URL("./src/detail.ts", import.meta.url)),
      },
    },
  },
});
