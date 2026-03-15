import { GitHubLogoIcon } from "@radix-ui/react-icons";
import { HeartIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { presetPatterns } from "@/assets/presets/presets";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { usePageMeta } from "@/hooks/useCanonical";
import { getKrokbragdOwner } from "@/lib/defaults";
import { groupNonOverlappingRepeaters, repeat } from "@/lib/inkle";

const W = 10;
const H = 2.5 * W;

// Krokbragd weave row cycle: 1-2-1-3
function getWeaveRow(visualRow: number): number {
  const cycle = visualRow % 4;
  if (cycle === 0 || cycle === 2) return 0;
  if (cycle === 1) return 1;
  return 2;
}

function hexPoints(cx: number, cy: number): string {
  return [
    [cx + W / 2, cy],
    [cx + W, cy + H / 4],
    [cx + W, cy + (3 * H) / 4],
    [cx + W / 2, cy + H],
    [cx, cy + (3 * H) / 4],
    [cx, cy + H / 4],
  ]
    .map(([x, y]) => `${x},${y}`)
    .join(" ");
}

function buildBasicTile(data: { colors: ({ hex: string } | null)[] }[]): {
  cells: JSX.Element[];
  tileHeight: number;
  bandWidth: number;
} {
  const tileRows = data.length;
  const hexPerRow = data[0].colors.length;
  const tileHeight = (tileRows * H * 3) / 4;
  const bandWidth = ((hexPerRow + 1) / 2) * W;
  const cells: JSX.Element[] = [];

  for (let rowIdx = 0; rowIdx < tileRows; rowIdx++) {
    const row = data[rowIdx];
    for (let colIdx = 0; colIdx < row.colors.length; colIdx++) {
      const color = row.colors[colIdx];
      if (!color) continue;
      const cx = (colIdx / 2) * W;
      const cy = (rowIdx * H * 3) / 4;
      cells.push(
        <polygon
          key={`${rowIdx}-${colIdx}`}
          points={hexPoints(cx, cy)}
          fill={color.hex}
          stroke="rgba(0,0,0,0.08)"
          strokeWidth={W * 0.4}
          paintOrder="stroke fill"
        />,
      );
    }
  }
  return { cells, tileHeight, bandWidth };
}

function buildKrokbragdTile(data: { colors: ({ hex: string } | null)[] }[]): {
  cells: JSX.Element[];
  tileHeight: number;
  bandWidth: number;
} {
  const WEAVE_ROWS = 4;
  const totalCols = data[0].colors.length;
  const tileHeight = (WEAVE_ROWS * H * 3) / 4;

  // Precompute H1 cell positions
  const h1Before: number[] = new Array(totalCols);
  let h1Count = 0;
  for (let i = 0; i < totalCols; i++) {
    h1Before[i] = h1Count;
    if (getKrokbragdOwner(i, totalCols) === 0) h1Count++;
  }

  const contentLeft = -W / 2;
  const contentRight = h1Count * W;
  const bandWidth = contentRight - contentLeft + W;

  const cells: JSX.Element[] = [];
  for (let vRow = 0; vRow < WEAVE_ROWS; vRow++) {
    const dataRowIdx = getWeaveRow(vRow);
    const row = data[dataRowIdx];

    for (let colIdx = 0; colIdx < row.colors.length; colIdx++) {
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
      const cx = (vRow % 2 === 1 ? n * W - W / 2 : n * W) - contentLeft;
      const cy = (vRow * H * 3) / 4;

      cells.push(
        <polygon
          key={`${vRow}-${colIdx}`}
          points={hexPoints(cx, cy)}
          fill={color.hex}
          stroke="rgba(0,0,0,0.08)"
          strokeWidth={W * 0.4}
          paintOrder="stroke fill"
        />,
      );
    }
  }
  return { cells, tileHeight, bandWidth };
}

function PatternCard({
  preset,
  horizontal,
}: {
  preset: (typeof presetPatterns)[number];
  horizontal: boolean;
}) {
  const repeaterGroups = useMemo(
    () => groupNonOverlappingRepeaters(preset.repeaters),
    [preset.repeaters],
  );

  const data = useMemo(
    () =>
      preset.band.map((b) => ({
        ...b,
        colors: repeat(b.colors, repeaterGroups),
      })),
    [preset.band, repeaterGroups],
  );

  const isKrokbragd = preset.mode === "krokbragd";

  const { cells, tileHeight, bandWidth } = useMemo(
    () => (isKrokbragd ? buildKrokbragdTile(data) : buildBasicTile(data)),
    [data, isKrokbragd],
  );

  const verticalReps = isKrokbragd ? 3 : 4;
  const horizontalReps = isKrokbragd ? 12 : 16;
  const reps = horizontal ? horizontalReps : verticalReps;
  const totalHeight = reps * tileHeight;

  // When horizontal, swap viewBox dimensions and rotate content
  const pad = horizontal ? bandWidth * 0.3 : 0;
  const vbW = horizontal ? totalHeight : bandWidth;
  const vbH = horizontal ? bandWidth + 2 * pad : totalHeight;

  return (
    <div className="rounded-lg border bg-white overflow-hidden transition-shadow duration-200 hover:shadow-[0_0_8px_rgba(0,0,0,0.12)]">
      <div
        className={`${horizontal ? "h-24" : "h-32"} flex items-center justify-center overflow-hidden relative`}
      >
        <div
          className="absolute inset-0 opacity-50"
          style={{
            backgroundImage: "url(/light-wood.jpg)",
            backgroundRepeat: "repeat",
          }}
        />
        <svg
          className={`${horizontal ? "" : "max-w-[200px]"} relative`}
          width="100%"
          height="100%"
          viewBox={`0 0 ${vbW} ${vbH}`}
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <g id={`tile-${preset.name}`}>{cells}</g>
          </defs>
          <g
            transform={
              horizontal
                ? `translate(${totalHeight}, ${pad}) rotate(90)`
                : undefined
            }
          >
            {Array.from({ length: reps }, (_, i) => (
              <use
                key={i}
                href={`#tile-${preset.name}`}
                transform={`translate(0, ${i * tileHeight})`}
              />
            ))}
          </g>
        </svg>
      </div>
      <div className="px-4 py-3">
        <div className="font-medium text-sm">{preset.name}</div>
        <div className="text-xs text-muted-foreground mt-0.5">
          {isKrokbragd ? "Krokbragd" : "Standard"} &middot;{" "}
          {preset.band[0].colors.filter((c) => c !== null).length} warps
        </div>
      </div>
    </div>
  );
}

export default function PatternsPage() {
  usePageMeta({
    title: "Inkle Loom Patterns - Free Weaving Pattern Gallery",
    description:
      "Browse free inkle loom weaving patterns including standard and krokbragd designs. Preview patterns with live hex simulations and load them into the designer.",
  });
  const [horizontal, setHorizontal] = useState(true);

  // Structured data for SEO
  useEffect(() => {
    const items = presetPatterns.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: `${p.mode === "krokbragd" ? "Krokbragd" : "Standard"}: ${p.name}`,
      url: "https://inkle.band/patterns",
    }));
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "patterns-structured-data";
    script.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "Inkle Loom Weaving Patterns",
      description:
        "A collection of free inkle loom weaving patterns including standard and krokbragd designs.",
      numberOfItems: presetPatterns.length,
      itemListElement: items,
    });
    document.head.appendChild(script);
    return () => {
      script.remove();
    };
  }, []);

  const standardPatterns = presetPatterns.filter(
    (p) => !p.mode || p.mode === "basic",
  );
  const krokbragdPatterns = presetPatterns.filter(
    (p) => p.mode === "krokbragd",
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="px-6 md:px-12 lg:px-20 pt-8 pb-4">
        <Link
          to="/"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          &larr; Back to designer
        </Link>
      </div>

      <div className="px-6 md:px-12 lg:px-20 pb-8 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2 text-foreground font-display">
            Inkle Loom Patterns
          </h1>
          <p className="text-muted-foreground text-base leading-relaxed max-w-2xl">
            Browse inkle loom patterns for inspiration. Open the designer on
            desktop to load any of these templates and customize them with your
            own colors.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Label
            htmlFor="horizontal-toggle"
            className="text-sm text-muted-foreground"
          >
            Horizontal
          </Label>
          <Switch
            id="horizontal-toggle"
            checked={horizontal}
            onCheckedChange={setHorizontal}
          />
        </div>
      </div>

      <div className="px-6 md:px-12 lg:px-20 pb-8">
        <h2 className="text-lg font-semibold mb-4 text-foreground font-display">
          Standard Patterns
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {standardPatterns.map((preset) => (
            <PatternCard
              key={preset.name}
              preset={preset}
              horizontal={horizontal}
            />
          ))}
        </div>
      </div>

      <div className="px-6 md:px-12 lg:px-20 pb-12">
        <h2 className="text-lg font-semibold mb-4 text-foreground font-display">
          Krokbragd Patterns
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {krokbragdPatterns.map((preset) => (
            <PatternCard
              key={preset.name}
              preset={preset}
              horizontal={horizontal}
            />
          ))}
        </div>
      </div>

      <div className="mt-auto px-6 py-6 border-t flex justify-center gap-2">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="text-muted-foreground"
        >
          <a
            href="https://github.com/gg314/inkle"
            target="_blank"
            rel="noopener noreferrer"
          >
            <GitHubLogoIcon className="h-4 w-4" />
            Source code
          </a>
        </Button>
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="text-muted-foreground"
        >
          <a
            href="https://github.com/sponsors/gg314?frequency=one-time"
            target="_blank"
            rel="noopener noreferrer"
          >
            <HeartIcon className="h-4 w-4" />
            Support
          </a>
        </Button>
      </div>
    </div>
  );
}
