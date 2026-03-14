import jsPDF from "jspdf";
import { getKrokbragdOwner } from "@/lib/defaults";
import { mirrorData, repeat } from "@/lib/inkle";
import type { BandMode, PatternRow, Repeater } from "@/types/inkle";

interface PdfExportOptions {
  rows: PatternRow[];
  repeaterGroups: Repeater[][];
  useMirror: boolean;
  patternTitle: string;
  creatorName: string;
  footerLabel: string;
  mode: BandMode;
}

// US Letter landscape in inches
const PAGE_W = 11;
const PAGE_H = 8.5;
const MARGIN_X = 0.5;
const MARGIN_Y = 0.4;
const MARGIN_BOTTOM = 0.25;
const CONTENT_W = PAGE_W - 2 * MARGIN_X;

// Cache the font data across calls, but always register it on each new doc
let fontBase64: string | null = null;

async function loadBahnschrift(doc: jsPDF) {
  if (!fontBase64) {
    const resp = await fetch("/fonts/bahnschrift.ttf");
    const buf = await resp.arrayBuffer();
    fontBase64 = arrayBufferToBase64(buf);
  }
  doc.addFileToVFS("bahnschrift.ttf", fontBase64);
  doc.addFont("bahnschrift.ttf", "Bahnschrift", "normal");
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function hexToRgb(hex: string): [number, number, number] {
  hex = hex.replace(/^#/, "");
  return [
    parseInt(hex.substring(0, 2), 16),
    parseInt(hex.substring(2, 4), 16),
    parseInt(hex.substring(4, 6), 16),
  ];
}

function prepareData(
  rows: PatternRow[],
  repeaterGroups: Repeater[][],
  useMirror: boolean,
): PatternRow[] {
  const data = rows.map((b) => ({
    ...b,
    colors: repeat(b.colors, repeaterGroups),
  }));
  return useMirror ? mirrorData(data) : data;
}

function drawHeader(
  doc: jsPDF,
  y: number,
  patternTitle: string,
  creatorName: string,
): number {
  doc.setFont("Bahnschrift", "normal");

  const gap = 0.2;
  const creatorW = CONTENT_W * 0.308;
  const dateW = CONTENT_W * 0.165;
  const titleW = CONTENT_W - creatorW - dateW - 2 * gap;
  const creatorX = MARGIN_X + titleW + gap;
  const dateX = creatorX + creatorW + gap;

  // Values above lines
  const valueY = y - 0.08;
  doc.setFontSize(14);
  doc.setTextColor(0);
  if (patternTitle) {
    doc.text(patternTitle, MARGIN_X, valueY);
  }
  if (creatorName) {
    doc.text(creatorName, creatorX, valueY);
  }

  // Lines
  const lineY = y;
  doc.setDrawColor(0);
  doc.setLineWidth(0.008);
  doc.line(MARGIN_X, lineY, MARGIN_X + titleW, lineY);
  doc.line(creatorX, lineY, creatorX + creatorW, lineY);
  doc.line(dateX, lineY, dateX + dateW, lineY);

  // Labels below lines
  const labelY = lineY + 0.14;
  doc.setFontSize(8);
  doc.setTextColor(70);
  doc.text("TITLE", MARGIN_X, labelY);
  doc.text("CREATOR", creatorX, labelY);
  doc.text("DATE", dateX, labelY);

  return labelY + 0.325;
}

const FIRST_LINE_COLS = 53;
const CONT_LINE_COLS = 51;

function drawDraftRows(
  doc: jsPDF,
  data: PatternRow[],
  y: number,
  repeaterGroups: Repeater[][],
  mode: BandMode,
): number {
  const numCols = data[0].colors.length;
  const labelWidth = 0.15;
  const contLabelWidth = 0.365; // extra indent for "→ cont." label
  const availableWidth = CONTENT_W - labelWidth;
  const cellSize = Math.min(
    0.185,
    availableWidth / Math.min(numCols, FIRST_LINE_COLS),
  );

  // Build line segments: first line up to 52 cols, then 46 each
  const lines: { colStart: number; colEnd: number; isCont: boolean }[] = [];
  if (numCols <= FIRST_LINE_COLS) {
    lines.push({ colStart: 0, colEnd: numCols, isCont: false });
  } else {
    lines.push({ colStart: 0, colEnd: FIRST_LINE_COLS, isCont: false });
    let col = FIRST_LINE_COLS;
    while (col < numCols) {
      const end = Math.min(col + CONT_LINE_COLS, numCols);
      lines.push({ colStart: col, colEnd: end, isCont: true });
      col = end;
    }
  }

  const numRows = data.length;
  const lineSpacing = 0.08; // gap between wrapped line groups
  const contGap = 0.18; // extra gap for continuation arrow
  let curY = y;

  for (const line of lines) {
    const startX = MARGIN_X + labelWidth + (line.isCont ? contLabelWidth : 0);

    // Draw L-shaped arrow and "cont." before continuation lines
    if (line.isCont) {
      const centerX = MARGIN_X + labelWidth + contLabelWidth / 2;
      const shiftDown = cellSize * 0.5;

      // Arrow bounding box: 0.2" wide, centered on centerX
      const arrowW = 0.13;
      const arrowLeftX = centerX - arrowW / 2;
      const arrowRightX = centerX + arrowW / 2;

      const arrowMidY = curY + cellSize * 0.35 + shiftDown;
      const arrowTopY = arrowMidY - cellSize * 0.4;

      doc.setDrawColor(120);
      doc.setLineWidth(0.01);
      doc.line(arrowLeftX, arrowTopY, arrowLeftX, arrowMidY);
      doc.line(arrowLeftX, arrowMidY, arrowRightX, arrowMidY);
      const ah = 0.035;
      doc.line(arrowRightX - ah, arrowMidY - ah, arrowRightX, arrowMidY);
      doc.line(arrowRightX - ah, arrowMidY + ah, arrowRightX, arrowMidY);

      // "cont." centered below the arrow
      doc.setFont("Bahnschrift", "normal");
      doc.setFontSize(6.5);
      doc.setTextColor(120);
      doc.text("cont.", centerX, arrowMidY + 0.13, { align: "center" });
    }

    const isKrokbragd = mode === "krokbragd";
    const totalCols = data[0].colors.length;

    // First pass: draw all grey (disabled) cells
    for (let rowIdx = 0; rowIdx < numRows; rowIdx++) {
      const rowY = curY + rowIdx * cellSize;
      for (let colIdx = line.colStart; colIdx < line.colEnd; colIdx++) {
        const disabled = isKrokbragd
          ? getKrokbragdOwner(colIdx, totalCols) !== rowIdx
          : (rowIdx + colIdx) % 2 === 1;
        if (disabled) {
          doc.setFillColor(228, 231, 232);
          doc.rect(
            startX + (colIdx - line.colStart) * cellSize,
            rowY,
            cellSize,
            cellSize,
            "F",
          );
        }
      }
    }

    // Second pass: draw active cells and labels
    for (let rowIdx = 0; rowIdx < numRows; rowIdx++) {
      const row = data[rowIdx];
      const rowY = curY + rowIdx * cellSize;

      // Row label (only on first line)
      if (!line.isCont) {
        doc.setFont("Bahnschrift", "normal");
        doc.setFontSize(8);
        doc.setTextColor(0);
        doc.text(row.label, MARGIN_X, rowY + cellSize * 0.75);
      }

      for (let colIdx = line.colStart; colIdx < line.colEnd; colIdx++) {
        const disabled = isKrokbragd
          ? getKrokbragdOwner(colIdx, totalCols) !== rowIdx
          : (rowIdx + colIdx) % 2 === 1;
        if (disabled) continue;

        const color = row.colors[colIdx];
        const cellX = startX + (colIdx - line.colStart) * cellSize;

        doc.setDrawColor(40, 37, 39);
        doc.setLineWidth(0.009);
        if (color) {
          const [r, g, b] = hexToRgb(color.hex);
          doc.setFillColor(r, g, b);
        } else {
          doc.setFillColor(255, 255, 255);
        }
        doc.rect(cellX, rowY, cellSize, cellSize, "FD");
      }
    }

    // Draw repeater brackets below the cells for this line
    const bracketTopY = curY + numRows * cellSize + 0.06;
    const bracketH = 0.1;
    for (let gi = 0; gi < repeaterGroups.length; gi++) {
      const groupOffsetY = gi * (bracketH + 0.12);
      for (const repeater of repeaterGroups[gi]) {
        const repeaterEnd = repeater.start + repeater.length;
        // Clamp repeater range to this line's visible columns
        const rStart = Math.max(repeater.start, line.colStart);
        const rEnd = Math.min(repeaterEnd, line.colEnd);
        if (rStart >= rEnd) continue;

        const leftX = startX + (rStart - line.colStart) * cellSize;
        const rightX = startX + (rEnd - line.colStart) * cellSize;
        const topY = bracketTopY + groupOffsetY;
        const botY = topY + bracketH;

        const isRealStart = rStart === repeater.start;
        const isRealEnd = rEnd === repeaterEnd;

        doc.setDrawColor(60);
        doc.setLineWidth(0.008);
        // U-shaped bracket: only draw tick marks at real endpoints
        if (isRealStart) doc.line(leftX, topY, leftX, botY);
        doc.line(leftX, botY, rightX, botY);
        if (isRealEnd) doc.line(rightX, topY, rightX, botY);

        // "×N" label centered — only on the segment with the real end
        if (isRealEnd) {
          doc.setFont("Bahnschrift", "normal");
          doc.setFontSize(7);
          doc.setTextColor(100);
          doc.text(
            `\u00d7${repeater.count}`,
            (leftX + rightX) / 2,
            topY + bracketH * 0.65,
            { align: "center" },
          );
        }
      }
    }

    // Calculate bracket space used
    const bracketSpace =
      repeaterGroups.length > 0
        ? repeaterGroups.length * (bracketH + 0.12) + 0.02
        : 0;

    curY +=
      numRows * cellSize +
      bracketSpace +
      lineSpacing +
      (lines.length > 1 ? contGap : 0);
  }

  return curY + 0.4;
}

function drawHexPattern(doc: jsPDF, data: PatternRow[], startY: number) {
  const numCols = data[0].colors.length;

  // Hex dimensions in inches — scale to fit page width
  const labelWidth = 0.3;
  const availableWidth = CONTENT_W - labelWidth;
  const baseHexW = Math.min(0.12, availableWidth / (numCols / 2 + 0.5)) * 0.7;
  const hexW = baseHexW * 0.85;
  const hexH = 2.5 * baseHexW;

  const startX = MARGIN_X + labelWidth + 0.7;

  // Calculate how many tile repeats fit in the remaining page
  const tileHeight = (data.length * hexH * 3) / 4;
  const availableHeight = PAGE_H - MARGIN_BOTTOM - startY - 0.3; // leave room for footer
  const repeatCount = Math.max(1, Math.floor(availableHeight / tileHeight) - 1);

  for (let rep = 0; rep < repeatCount; rep++) {
    const repOffsetY = rep * tileHeight;

    for (let rowIdx = 0; rowIdx < data.length; rowIdx++) {
      const row = data[rowIdx];
      for (let colIdx = 0; colIdx < row.colors.length; colIdx++) {
        // Skip cells not owned by this row
        if ((rowIdx + colIdx) % 2 === 1) continue;

        const color = row.colors[colIdx];
        const cx = startX + (colIdx / 2) * hexW;
        const cy = startY + repOffsetY + (rowIdx * hexH * 3) / 4;

        // Skip if off page
        if (cy + hexH > PAGE_H - MARGIN_BOTTOM - 0.3) continue;

        drawHexCell(doc, cx, cy, hexW, hexH, color?.hex ?? null);
      }
    }
  }
}

// Krokbragd weave row alternation: 1-2-1-3 cycle
// Maps visual row index to data row index (0=H1, 1=U2, 2=U3)
function getWeaveRow(visualRow: number): number {
  const cycle = visualRow % 4;
  if (cycle === 0 || cycle === 2) return 0; // H1
  if (cycle === 1) return 1; // U2
  return 2; // U3
}

const WEAVE_ROWS_PER_TILE = 4; // one full 1-2-1-3 cycle

function drawKrokbragdHexPattern(
  doc: jsPDF,
  data: PatternRow[],
  startY: number,
) {
  const totalCols = data[0].colors.length;

  // Hex dimensions in inches — scale to fit page width, 30% skinnier than basic
  const labelWidth = 0.3;
  const availableWidth = CONTENT_W - labelWidth;
  const baseHexW = Math.min(0.12, availableWidth / (totalCols / 2 + 0.5)) * 0.7;
  const hexW = baseHexW * 0.85;
  const hexH = 2.5 * baseHexW;

  const startX = MARGIN_X + labelWidth + 0.7;

  // Precompute cumulative H1 cell count before each column index
  const h1Before: number[] = new Array(totalCols);
  let h1Count = 0;
  for (let i = 0; i < totalCols; i++) {
    h1Before[i] = h1Count;
    if (getKrokbragdOwner(i, totalCols) === 0) h1Count++;
  }

  // Calculate how many tile repeats fit in the remaining page
  const tileHeight = (WEAVE_ROWS_PER_TILE * hexH * 3) / 4;
  const availableHeight = PAGE_H - MARGIN_BOTTOM - startY - 0.3;
  const repeatCount = Math.max(1, Math.floor(availableHeight / tileHeight) - 1);

  // Treadling sequence: 1-2-1-3 mapped to display labels
  const treadlingLabels = [1, 2, 1, 3];

  for (let rep = 0; rep < repeatCount; rep++) {
    const repOffsetY = rep * tileHeight;

    for (let vRow = 0; vRow < WEAVE_ROWS_PER_TILE; vRow++) {
      const dataRowIdx = getWeaveRow(vRow);
      const row = data[dataRowIdx];

      const rowCy = startY + repOffsetY + (vRow * hexH * 3) / 4;

      // Skip if off page
      if (rowCy + hexH > PAGE_H - MARGIN_BOTTOM - 0.3) continue;

      // Treadling number to the left
      doc.setFont("Bahnschrift", "normal");
      doc.setFontSize(7);
      doc.setTextColor(120);
      doc.text(
        String(treadlingLabels[vRow]),
        startX - 0.15,
        rowCy + hexH * 0.7,
        { align: "center" },
      );

      for (let colIdx = 0; colIdx < row.colors.length; colIdx++) {
        // Skip cells not owned by this row
        const owner = getKrokbragdOwner(colIdx, totalCols);
        if (owner !== dataRowIdx) {
          // Exception: U3 border positions get filled with U2 colors
          if (dataRowIdx === 2) {
            const isLeftBorder = colIdx === 1 || colIdx === 3;
            const isRightBorder =
              colIdx === totalCols - 4 || colIdx === totalCols - 2;
            if (!(isLeftBorder || isRightBorder)) continue;
          } else {
            continue;
          }
        }

        // For U3 border positions, use U2 colors
        let color = row.colors[colIdx];
        if (dataRowIdx === 2 && color === null) {
          const isLeftBorder = colIdx === 1 || colIdx === 3;
          const isRightBorder =
            colIdx === totalCols - 4 || colIdx === totalCols - 2;
          if (isLeftBorder || isRightBorder) {
            color = data[1].colors[colIdx];
          }
        }

        const n = h1Before[colIdx];
        const cx = startX + (vRow % 2 === 1 ? n * hexW - hexW / 2 : n * hexW);
        const cy = rowCy;

        // Skip if off page
        if (cy + hexH > PAGE_H - MARGIN_BOTTOM - 0.3) continue;

        drawHexCell(doc, cx, cy, hexW, hexH, color?.hex ?? null);
      }
    }
  }
}

function drawHexCell(
  doc: jsPDF,
  cx: number,
  cy: number,
  hexW: number,
  hexH: number,
  hex: string | null,
) {
  const points = [
    [cx + hexW / 2, cy],
    [cx + hexW, cy + hexH / 4],
    [cx + hexW, cy + (3 * hexH) / 4],
    [cx + hexW / 2, cy + hexH],
    [cx, cy + (3 * hexH) / 4],
    [cx, cy + hexH / 4],
  ];

  const [r, g, b] = hex ? hexToRgb(hex) : [255, 255, 255];
  doc.setFillColor(r, g, b);
  doc.setDrawColor(
    Math.min(102, Math.max(0, r - 60)),
    Math.min(102, Math.max(0, g - 60)),
    Math.min(102, Math.max(0, b - 60)),
  );
  doc.setLineWidth(0.004);

  doc.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) {
    doc.lineTo(points[i][0], points[i][1]);
  }
  doc.close();
  doc.fillStroke();
}

function drawFooter(doc: jsPDF, footerLabel: string) {
  doc.setFont("Bahnschrift", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(150);

  const footerText = footerLabel
    ? `https://inkle.band - ${footerLabel}`
    : "https://inkle.band";

  doc.text(footerText, PAGE_W - MARGIN_X, PAGE_H - MARGIN_BOTTOM, {
    align: "right",
  });
}

export async function exportPdf(options: PdfExportOptions) {
  const {
    rows,
    repeaterGroups,
    useMirror,
    patternTitle,
    creatorName,
    footerLabel,
    mode,
  } = options;
  const data = prepareData(rows, repeaterGroups, useMirror);

  const doc = new jsPDF({
    orientation: "landscape",
    unit: "in",
    format: "letter",
  });

  await loadBahnschrift(doc);
  doc.setFont("Bahnschrift", "normal");

  let y = MARGIN_Y + 0.3;

  // Header with TITLE / CREATOR / DATE fields
  y = drawHeader(doc, y, patternTitle, creatorName);

  // H/U draft rows (unexpanded, with repeater brackets)
  y = drawDraftRows(doc, rows, y, repeaterGroups, mode);

  // Hexagon pattern
  if (mode === "krokbragd") {
    drawKrokbragdHexPattern(doc, data, y);
  } else {
    drawHexPattern(doc, data, y);
  }

  // Footer
  drawFooter(doc, footerLabel);

  // Save
  const filename = patternTitle ? `${patternTitle}.pdf` : "inkle-pattern.pdf";
  doc.save(filename);
}
