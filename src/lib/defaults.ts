import type { BandMode, PatternRow } from "@/types/inkle";

const BASIC_DEFAULT_ROWS: PatternRow[] = [
  { label: "H", colors: [null, null, null, null, null] },
  { label: "U", colors: [null, null, null, null, null] },
];

// N=0: 9 warps (borders only). Ownership: H1 | U2 H1 U2 H1 | U2 H1 U2 H1
export const KROKBRAGD_MIN_WARPS = 9;

const KROKBRAGD_DEFAULT_ROWS: PatternRow[] = [
  { label: "H1", colors: Array(KROKBRAGD_MIN_WARPS).fill(null) },
  { label: "U2", colors: Array(KROKBRAGD_MIN_WARPS).fill(null) },
  { label: "U3", colors: Array(KROKBRAGD_MIN_WARPS).fill(null) },
];

export function getDefaultRows(mode: BandMode): PatternRow[] {
  const rows =
    mode === "krokbragd" ? KROKBRAGD_DEFAULT_ROWS : BASIC_DEFAULT_ROWS;
  return rows.map((r) => ({ ...r, colors: [...r.colors] }));
}

/**
 * Returns which row index (0=H1, 1=U2, 2=U3) owns a given column in krokbragd.
 *
 * Layout: [H1] [U2 H1 U2 H1] [middle: U3 U2 H1 cycling...] [U2 H1 U2 H1]
 *          0    1  2  3  4     5 ...                           last 4
 */
export function getKrokbragdOwner(colIdx: number, totalCols: number): number {
  const borderEnd = 5; // first 5 columns: indices 0-4
  const tailStart = totalCols - 4; // last 4 columns

  if (colIdx === 0) return 0; // H1

  // Left border: columns 1-4 cycle U2 H1 U2 H1
  if (colIdx < borderEnd) {
    return colIdx % 2 === 1 ? 1 : 0; // odd=U2, even=H1
  }

  // Right border: last 4 columns cycle U2 H1 U2 H1
  if (colIdx >= tailStart) {
    const offset = colIdx - tailStart;
    return offset % 2 === 0 ? 1 : 0; // 0=U2, 1=H1, 2=U2, 3=H1
  }

  // Middle section: cycles U3 U2 H1 U3 U2 H1...
  const middleOffset = colIdx - borderEnd;
  const cycle = middleOffset % 3;
  return cycle === 0 ? 2 : cycle === 1 ? 1 : 0; // U3, U2, H1
}
