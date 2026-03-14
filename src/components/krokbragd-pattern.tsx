import React, { useEffect, useMemo, useRef, useState } from "react";
import { getKrokbragdOwner } from "@/lib/defaults";
import { repeat } from "@/lib/inkle";
import { PatternRow, Repeater } from "@/types/inkle";

interface KrokbragdPatternProps {
  bandConfig: PatternRow[];
  repeaterGroups: Repeater[][];
  useShadow: boolean;
}

const W = 14;
const H = 2.5 * 20;

// Row alternation for krokbragd: 1-2-1-3-1-2-1-3...
// Maps visual row index to data row index (0=H1, 1=U2, 2=U3)
function getWeaveRow(visualRow: number): number {
  // 0->0(H1), 1->1(U2), 2->0(H1), 3->2(U3), repeating
  const cycle = visualRow % 4;
  if (cycle === 0 || cycle === 2) return 0; // H1
  if (cycle === 1) return 1; // U2
  return 2; // U3
}

const WEAVE_ROWS_PER_TILE = 4; // one full 1-2-1-3 cycle

const KrokbragdPattern: React.FC<KrokbragdPatternProps> = ({
  bandConfig,
  repeaterGroups,
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
    () =>
      bandConfig.map((b) => ({
        ...b,
        colors: repeat(b.colors, repeaterGroups),
      })),
    [bandConfig, repeaterGroups],
  );

  const hexPerRow = data[0].colors.length;
  const totalCols = hexPerRow;
  const tileHeight = (WEAVE_ROWS_PER_TILE * H * 3) / 4;

  // Count H1 cells to determine actual content width
  const h1Count = useMemo(() => {
    let count = 0;
    for (let i = 0; i < totalCols; i++) {
      if (getKrokbragdOwner(i, totalCols) === 0) count++;
    }
    return count;
  }, [totalCols]);

  // Content bounds: odd rows shift left by W/2, even rows span 0..h1Count*W
  const contentLeft = -W / 2;
  const contentRight = h1Count * W;
  const padding = 4 * W;
  const bandWidth = contentRight - contentLeft + padding;
  const vbX = contentLeft - padding / 2;

  const scale = bandWidth / containerSize.width;
  const visibleHeight = containerSize.height * scale;
  const repeatCount = Math.min(Math.ceil(visibleHeight / tileHeight) + 2, 150);

  const vbY = (-2 + 2.5) * H;

  const tile = useMemo(() => {
    const cells: (React.ReactElement | null)[] = [];

    // Precompute cumulative H1 cell count before each column index.
    // H1 defines the even-row hex grid columns; odd-row hexagons
    // are positioned relative to them.
    const h1Before: number[] = new Array(totalCols);
    let count = 0;
    for (let i = 0; i < totalCols; i++) {
      h1Before[i] = count;
      if (getKrokbragdOwner(i, totalCols) === 0) count++;
    }

    for (let vRow = 0; vRow < WEAVE_ROWS_PER_TILE; vRow++) {
      const dataRowIdx = getWeaveRow(vRow);
      const row = data[dataRowIdx];

      for (let colIdx = 0; colIdx < row.colors.length; colIdx++) {
        // For U3 rows (vRow 3), fill the 2 border positions on each side
        // with U2 colors since U3 only exists in the middle section.
        let color = row.colors[colIdx];
        if (dataRowIdx === 2 && color === null) {
          const isLeftBorder = colIdx === 1 || colIdx === 3;
          const isRightBorder =
            colIdx === totalCols - 4 || colIdx === totalCols - 2;
          if (isLeftBorder || isRightBorder) {
            color = data[1].colors[colIdx];
          }
        }
        if (color === null) continue;

        const n = h1Before[colIdx];
        const cx = vRow % 2 === 1 ? n * W - W / 2 : n * W;
        const cy = (vRow * H * 3) / 4;

        const points = [
          [cx + W / 2, cy],
          [cx + W, cy + H / 4],
          [cx + W, cy + (3 * H) / 4],
          [cx + W / 2, cy + H],
          [cx, cy + (3 * H) / 4],
          [cx, cy + H / 4],
        ];

        const pointsStr = points.map(([x, y]) => `${x},${y}`).join(" ");

        cells.push(
          <polygon
            key={`${vRow}-${colIdx}`}
            points={pointsStr}
            fill={color.hex}
            stroke={useShadow ? "rgba(0, 0, 0, 0.1)" : undefined}
            strokeWidth={useShadow ? W * 0.6 : undefined}
            paintOrder={useShadow ? "stroke fill" : undefined}
          />,
        );
      }
    }

    return cells;
  }, [data, useShadow]);

  const tileInstances = useMemo(() => {
    return Array.from({ length: repeatCount }, (_, i) => (
      <use
        key={i}
        href="#krokbragdTile"
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
          <g id="krokbragdTile">{tile}</g>
        </defs>

        <g filter="url(#dropShadow)">{tileInstances}</g>
      </svg>
    </div>
  );
};

export default KrokbragdPattern;
