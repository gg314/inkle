import jsPDF from "jspdf";
import { mirrorData, repeat } from "@/lib/inkle";
import type { PatternRow, Repeater } from "@/types/inkle";

interface PdfExportOptions {
  rows: PatternRow[];
  repeaterGroups: Repeater[][];
  useMirror: boolean;
  patternTitle: string;
  creatorName: string;
  footerLabel: string;
}

// US Letter landscape in inches
const PAGE_W = 11;
const PAGE_H = 8.5;
const MARGIN_X = 0.5;
const MARGIN_Y = 0.4;
const MARGIN_BOTTOM = 0.25;
const CONTENT_W = PAGE_W - 2 * MARGIN_X;

// Font loading
let fontLoaded = false;

async function loadBahnschrift(doc: jsPDF) {
  if (fontLoaded) return;
  const resp = await fetch("/fonts/bahnschrift.ttf");
  const buf = await resp.arrayBuffer();
  const base64 = arrayBufferToBase64(buf);
  doc.addFileToVFS("bahnschrift.ttf", base64);
  doc.addFont("bahnschrift.ttf", "Bahnschrift", "normal");
  fontLoaded = true;
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

function drawDraftRows(doc: jsPDF, data: PatternRow[], y: number): number {
  const numCols = data[0].colors.length;
  // Scale cell size to fit the page width, with some room for the label
  const labelWidth = 0.15;
  const availableWidth = CONTENT_W - labelWidth;
  const cellSize = Math.min(0.185, availableWidth / numCols);

  const startX = MARGIN_X + labelWidth;

  doc.setFontSize(8);
  doc.setTextColor(0);

  // First pass: draw all grey cells
  for (let rowIdx = 0; rowIdx < data.length; rowIdx++) {
    const rowY = y + rowIdx * cellSize;
    for (let colIdx = 0; colIdx < data[rowIdx].colors.length; colIdx++) {
      if ((rowIdx + colIdx) % 2 === 1) {
        doc.setFillColor(228, 231, 232);
        doc.rect(startX + colIdx * cellSize, rowY, cellSize, cellSize, "F");
      }
    }
  }

  // Second pass: draw all active cells on top
  for (let rowIdx = 0; rowIdx < data.length; rowIdx++) {
    const row = data[rowIdx];
    const rowY = y + rowIdx * cellSize;

    // Row label (H or U)
    doc.setFont("Bahnschrift", "normal");
    doc.text(row.label, MARGIN_X, rowY + cellSize * 0.75);

    for (let colIdx = 0; colIdx < row.colors.length; colIdx++) {
      if ((rowIdx + colIdx) % 2 === 1) continue;

      const color = row.colors[colIdx];
      const cellX = startX + colIdx * cellSize;

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

  return y + data.length * cellSize + 0.55;
}

function drawHexPattern(doc: jsPDF, data: PatternRow[], startY: number) {
  const numCols = data[0].colors.length;

  // Hex dimensions in inches — scale to fit page width
  const labelWidth = 0.3;
  const availableWidth = CONTENT_W - labelWidth;
  const hexW = Math.min(0.12, availableWidth / (numCols / 2 + 0.5)) * 0.7;
  const hexH = 2.5 * hexW;

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
        const color = row.colors[colIdx];
        if (!color) continue;

        const cx = startX + (colIdx / 2) * hexW;
        const cy = startY + repOffsetY + (rowIdx * hexH * 3) / 4;

        // Skip if off page
        if (cy + hexH > PAGE_H - MARGIN_BOTTOM - 0.3) continue;

        const points = [
          [cx + hexW / 2, cy],
          [cx + hexW, cy + hexH / 4],
          [cx + hexW, cy + (3 * hexH) / 4],
          [cx + hexW / 2, cy + hexH],
          [cx, cy + (3 * hexH) / 4],
          [cx, cy + hexH / 4],
        ];

        const [r, g, b] = hexToRgb(color.hex);
        doc.setFillColor(r, g, b);
        doc.setDrawColor(
          Math.max(0, r - 30),
          Math.max(0, g - 30),
          Math.max(0, b - 30),
        );
        doc.setLineWidth(0.004);

        // Draw hexagon polygon
        doc.moveTo(points[0][0], points[0][1]);
        for (let i = 1; i < points.length; i++) {
          doc.lineTo(points[i][0], points[i][1]);
        }
        doc.close();
        doc.fillStroke();
      }
    }
  }
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

  // H/U draft rows
  y = drawDraftRows(doc, data, y);

  // Hexagon pattern
  drawHexPattern(doc, data, y);

  // Footer
  drawFooter(doc, footerLabel);

  // Save
  const filename = patternTitle ? `${patternTitle}.pdf` : "inkle-pattern.pdf";
  doc.save(filename);
}
