// Bundles the engine service worker into each app's public/ so the static
// build serves a real /sw.js. Runs before astro build.
import { build } from "esbuild";
import { fileURLToPath } from "node:url";

const swEntry = fileURLToPath(new URL("../packages/engine/src/sw/index.ts", import.meta.url));

for (const app of ["anime", "movies"]) {
  await build({
    entryPoints: [swEntry],
    bundle: true,
    format: "iife",
    target: ["es2022"],
    minify: true,
    outfile: fileURLToPath(new URL(`../packages/${app}/public/sw.js`, import.meta.url)),
  });
}
