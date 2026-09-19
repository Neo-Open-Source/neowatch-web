import type { ReactNode } from "react";

/**
 * Route-group layout for the video player pages.
 * Renders only the page content — no header, footer, or mobile nav.
 * The URL is unaffected by the (player) group segment.
 */
export default function PlayerLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
