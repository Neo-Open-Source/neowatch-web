"use client";

import { useEffect } from "react";
import { SITE_NAME } from "@/lib/i18n";

export function PageTitle({ children }: { children: string }) {
  useEffect(() => {
    document.title = children ? `${SITE_NAME} - ${children}` : SITE_NAME;
  }, [children]);

  return null;
}
