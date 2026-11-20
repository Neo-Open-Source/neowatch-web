import { buildId } from "@neowatch/engine/lib/config";
import { manifest } from "@neowatch/engine/lib/updates/version";
import type { APIRoute } from "astro";

export const GET: APIRoute = () =>
  Response.json(manifest(buildId()), { headers: { "cache-control": "no-store" } });
