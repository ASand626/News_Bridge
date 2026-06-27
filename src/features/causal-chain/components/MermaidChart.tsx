"use client";
import { useEffect, useRef, useState } from "react";

interface Props {
  chart: string;
  id: string;
}

export function MermaidChart({ chart, id }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!ref.current || !chart) return;
    let cancelled = false;

    import("mermaid").then((mod) => {
      if (cancelled) return;
      const mermaid = mod.default;
      mermaid.initialize({
        startOnLoad: false,
        theme: document.documentElement.classList.contains("dark") ? "dark" : "neutral",
        flowchart: { curve: "basis", padding: 20 },
        themeVariables: {
          fontSize: "14px",
          fontFamily: "system-ui, sans-serif",
        },
      });
      const safeId = `mermaid-${id.replace(/[^a-zA-Z0-9]/g, "")}`;
      mermaid
        .render(safeId, chart)
        .then(({ svg }) => {
          if (!cancelled && ref.current) {
            ref.current.innerHTML = svg;
            // Make SVG responsive
            const svgEl = ref.current.querySelector("svg");
            if (svgEl) {
              svgEl.removeAttribute("width");
              svgEl.removeAttribute("height");
              svgEl.style.maxWidth = "100%";
            }
          }
        })
        .catch(() => { if (!cancelled) setError(true); });
    });

    return () => { cancelled = true; };
  }, [chart, id]);

  if (error) return null;
  return <div ref={ref} className="overflow-x-auto" />;
}
