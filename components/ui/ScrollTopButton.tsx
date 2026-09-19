"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { useInputMode } from "@/lib/context/input-mode";
import { getScrollY, onScrollRoot, scrollRootTo } from "@/lib/state/scroll-root";

export function ScrollTopButton() {
  const isSpatial = useInputMode();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setVisible(getScrollY() > 600);
    };
    onScroll();
    return onScrollRoot(onScroll);
  }, []);

  if (isSpatial) return null;

  return (
    <button
      type="button"
      aria-label="Scroll to top"
      className={`scroll-top-btn${visible ? " scroll-top-btn--visible" : ""}`}
      onClick={() => scrollRootTo(0, "smooth")}
    >
      <ArrowUp size={20} />
    </button>
  );
}
