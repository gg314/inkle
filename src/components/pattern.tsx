import React, { Fragment } from "react";
import { mirrorData, repeat } from "@/lib/inkle";
import { PatternRow, Repeater } from "@/types/inkle";

interface PatternProps {
  bandConfig: PatternRow[];
  repeaterGroups: Repeater[][];
  useMirror: boolean;
  useShadow: boolean;
  nRows: number;
}

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
  nRows = 25,
}) => {
  const data = prepareData(bandConfig, repeaterGroups, useMirror);
  const W = 20;
  const H = 2.5 * W;
  const hexPerRow = data[0].colors.length;

  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`${-2 * W} ${(-2 + 2.5) * H} ${((hexPerRow + 8) / 2) * W} ${
        (3 * nRows + 3.5 - 4.5) * H
      }`}
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
        </filter>
      </defs>

      <g filter="url(#dropShadow)">
        {Array.from({ length: 2 * nRows }).flatMap((_, repeatIdx) =>
          data.map((row, rowIdx) =>
            row.colors.map((color, colIdx) => {
              if (color === null) return null;

              // Calculate the center of the hexagon
              const cx = (colIdx / 2) * W;
              const cy = ((repeatIdx * data.length + rowIdx) * H * 3) / 4;

              // Define the points for the polygon (similar to the original Python code)
              const points = [
                [cx + W / 2, cy],
                [cx + W, cy + H / 4],
                [cx + W, cy + (3 * H) / 4],
                [cx + W / 2, cy + H],
                [cx, cy + (3 * H) / 4],
                [cx, cy + H / 4],
              ];

              // Create the points string for the SVG polygon
              const pointsStr = points.map(([x, y]) => `${x},${y}`).join(" ");

              return (
                <Fragment key={`${rowIdx}-${colIdx}`}>
                  <polygon
                    points={pointsStr}
                    fill={color.hex}
                    stroke={useShadow ? "rgba(0, 0, 0, 0.02)" : undefined}
                    strokeWidth={18}
                  />

                  {useShadow ? (
                    <>
                      <polygon
                        points={pointsStr}
                        fill={"transparent"}
                        stroke="rgba(0, 0, 0, 0.03)"
                        strokeWidth={14}
                      />
                      <polygon
                        points={pointsStr}
                        fill={"transparent"}
                        stroke="rgba(0, 0, 0, 0.03)"
                        strokeWidth={8}
                      />
                      <polygon
                        points={pointsStr}
                        fill={"transparent"}
                        stroke="rgba(0, 0, 0, 0.01)"
                        strokeWidth={3}
                      />
                    </>
                  ) : null}
                </Fragment>
              );
            }),
          ),
        )}{" "}
      </g>
    </svg>
  );
};

export default Pattern;
