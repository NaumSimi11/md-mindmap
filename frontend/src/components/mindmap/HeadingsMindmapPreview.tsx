import { useEffect, useRef } from "react";

// Lightweight Markmap wrapper for headings-based preview
// Uses dynamic imports to avoid SSR/build issues if deps are missing at dev time

type MarkmapType = any;
type TransformerType = any;

interface HeadingsMindmapPreviewProps {
  markdown: string;
  className?: string;
}

export default function HeadingsMindmapPreview({ markdown, className }: HeadingsMindmapPreviewProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const markmapInstanceRef = useRef<MarkmapType | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const markmapViewModule = await import("markmap-view");
        const markmapLibModule = await import("markmap-lib");

        if (cancelled) return;

        const { Markmap } = markmapViewModule;
        const { Transformer } = markmapLibModule;

        if (!Markmap || !Transformer) {
          throw new Error("Markmap components not available");
        }

        const transformer: TransformerType = new Transformer();
        const { root } = transformer.transform(markdown || "");

        if (!svgRef.current) return;

        if (!markmapInstanceRef.current) {
          markmapInstanceRef.current = Markmap.create(svgRef.current);
        }

        markmapInstanceRef.current.setData(root);
        markmapInstanceRef.current.fit();
      } catch (err) {
        // Silently fail in preview if markmap isn't available
        // eslint-disable-next-line no-console
        console.warn("Markmap preview unavailable:", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [markdown]);

  return (
    <div className={className}>
      <svg ref={svgRef} className="w-full h-[420px]" />
    </div>
  );
}


