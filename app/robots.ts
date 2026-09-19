import type { MetadataRoute } from "next";
import { getMetadataBase } from "@/lib/metadata";

export const dynamic = "force-dynamic";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const base = await getMetadataBase();
  const site = base.toString().replace(/\/+$/, "");
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: `${site}/sitemap.xml`,
  };
}
