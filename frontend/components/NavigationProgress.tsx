"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export function NavigationProgress() {
  const pathname = usePathname();
  const [active, setActive] = useState(false);
  const isFirst = useRef(true);

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }

    setActive(true);
    const timer = window.setTimeout(() => setActive(false), 200);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-x-0 top-0 z-20 h-0.5 overflow-hidden transition-opacity duration-200 ${
        active ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="nav-progress-bar h-full w-1/3 bg-lavender" />
    </div>
  );
}
