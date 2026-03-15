import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { mirrorData, repeat } from "@/lib/inkle";
import type { PatternRow, Repeater } from "@/types/inkle";

interface PatternProps {
  bandConfig: PatternRow[];
  repeaterGroups: Repeater[][];
  useMirror: boolean;
  useShadow: boolean;
}

const W = 20;
const H = 2.5 * W;

const prepareData = (
  bandConfig: PatternRow[],
  repeaterGroups: Repeater[][],
  useMirror: boolean,
) => {
  const data = bandConfig.map((b) => {
    return {
      ...b,
      colors: repeat(b.colors, repeaterGroups),
    };
  });
  return useMirror ? mirrorData(data) : data;
};

const Pattern: React.FC<PatternProps> = ({
  bandConfig,
  repeaterGroups,
  useMirror,
  useShadow,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 1, height: 1 });

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) {
        setContainerSize({ width, height });
      }
    });
    ro.observe(node);
    return () => ro.disconnect();
  }, []);

  const data = useMemo(
    () => prepareData(bandConfig, repeaterGroups, useMirror),
    [bandConfig, repeaterGroups, useMirror],
  );

  const hexPerRow = data[0].colors.length;
  const tileHeight = (data.length * H * 3) / 4;

  // Content bounds: hexes span from x=0 to ((hexPerRow+1)/2)*W
  const contentRight = ((hexPerRow + 1) / 2) * W;
  const padding = 4 * W;
  const bandWidth = contentRight + padding;
  const vbX = -padding / 2;

  // Scale: SVG units per pixel (band fills container width)
  const scale = bandWidth / containerSize.width;

  // Visible height in SVG units, matching the container's aspect ratio
  const visibleHeight = containerSize.height * scale;

  // Enough tile repeats to fill the visible height, plus a buffer
  const repeatCount = Math.min(Math.ceil(visibleHeight / tileHeight) + 2, 150);

  const vbY = (-2 + 2.5) * H;

  const tile = useMemo(() => {
    return data.flatMap((row, rowIdx) =>
      row.colors.map((color, colIdx) => {
        if (color === null) return null;

        const cx = (colIdx / 2) * W;
        const cy = (rowIdx * H * 3) / 4;

        const points = [
          [cx + W / 2, cy],
          [cx + W, cy + H / 4],
          [cx + W, cy + (3 * H) / 4],
          [cx + W / 2, cy + H],
          [cx, cy + (3 * H) / 4],
          [cx, cy + H / 4],
        ];

        const pointsStr = points.map(([x, y]) => `${x},${y}`).join(" ");

        return (
          <polygon
            key={`${rowIdx}-${colIdx}`}
            points={pointsStr}
            fill={color.hex}
            stroke={useShadow ? "rgba(0, 0, 0, 0.1)" : undefined}
            strokeWidth={useShadow ? 12 : undefined}
            paintOrder={useShadow ? "stroke fill" : undefined}
          />
        );
      }),
    );
  }, [data, useShadow]);

  const tileInstances = useMemo(() => {
    return Array.from({ length: repeatCount }, (_, i) => (
      <use
        key={`tile-${i}`}
        href="#bandTile"
        transform={`translate(0, ${i * tileHeight})`}
      />
    ));
  }, [repeatCount, tileHeight]);

  return (
    <div ref={containerRef} style={{ width: "100%", height: "100%" }}>
      <svg
        width="100%"
        height="100%"
        viewBox={`${vbX} ${vbY} ${bandWidth} ${visibleHeight}`}
        preserveAspectRatio="xMidYMin meet"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter id="dropShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow
              dx="0"
              dy="0"
              stdDeviation="10"
              floodColor="black"
              floodOpacity="0.25"
            />
            <feDropShadow
              dx="0"
              dy="0"
              stdDeviation="20"
              floodColor="black"
              floodOpacity="0.25"
            />
          </filter>
          <g id="bandTile">{tile}</g>
        </defs>

        <g filter="url(#dropShadow)">{tileInstances}</g>
      </svg>
    </div>
  );
};

export default Pattern;
