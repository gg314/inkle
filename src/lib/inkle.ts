import type { Color, PatternRow, Repeater } from "@/types/inkle";

export const mirrorData = (bandConfig: PatternRow[]) => {
  // Add a reversed copy of all elements except the last to each row
  return bandConfig.map((row) => {
    const reversedColors = [...row.colors.slice(0, -1)].reverse(); // Exclude the last element
    return { ...row, colors: [...row.colors, ...reversedColors] };
  });
};

function expandRepeaterIndices(
  repeater: Repeater,
  previousRepeaters: Repeater[],
): Repeater {
  let totalShiftStart = 0;
  let totalShiftStop = 0;

  const end = repeater.start + repeater.length;

  for (const prevRepeater of previousRepeaters) {
    const lengthAdded = prevRepeater.length * prevRepeater.count;
    const prevEnd = prevRepeater.start + prevRepeater.length;

    if (prevEnd < repeater.start) {
      // The previous repeater is entirely before the start of the current repeater
      totalShiftStart += lengthAdded;
    }

    if (prevEnd < end) {
      // The previous repeater is entirely before the end of the current repeater
      totalShiftStop += lengthAdded;
    }
  }

  return {
    ...repeater,
    start: repeater.start + totalShiftStart,
    length: repeater.length + totalShiftStop - totalShiftStart,
  };
}

function expandRepeaterGroups(repeaterGroups: Repeater[][]): Repeater[][] {
  const adjustedRepeaterGroups: Repeater[][] = [];
  const previousRepeaters: Repeater[] = [];

  for (const currentGroup of repeaterGroups) {
    // Adjust the current group's repeaters based on previous repeaters
    const adjustedGroup = currentGroup.map((repeater) =>
      expandRepeaterIndices(repeater, previousRepeaters),
    );

    // Add the adjusted group to the result
    adjustedRepeaterGroups.push(adjustedGroup);

    // Update the list of previous repeaters
    previousRepeaters.push(...adjustedGroup);
  }

  return adjustedRepeaterGroups;
}
export function expandData(
  rows: PatternRow[],
  repeaterGroups: Repeater[][],
): PatternRow[] {
  // Adjust the repeater groups
  const adjustedRepeaterGroups = expandRepeaterGroups(repeaterGroups);

  // Deep copy the rows to avoid mutating the original data
  const expandedRows = rows.map((row) => ({ ...row, colors: [...row.colors] }));

  // Iterate over each adjusted repeater group
  for (const repeaterGroup of adjustedRepeaterGroups) {
    // Sort repeaters within the group from highest to lowest start
    const sortedRepeaters = repeaterGroup
      .slice()
      .sort((a, b) => b.start - a.start);

    // Process each row
    for (const row of expandedRows) {
      const colors = row.colors;

      // Process each repeater in the group from right to left
      for (const repeater of sortedRepeaters) {
        const { count, start, length } = repeater;
        const end = start + length;

        // Extract the section to be repeated
        const section = colors.slice(start, end + 1);

        // Create the repeated sections
        const copies: (Color | null)[] = [];
        for (let i = 0; i < count - 1; i++) {
          copies.push(...section);
        }

        // Insert the copies after the end
        colors.splice(end + 1, 0, ...copies);
      }
    }
  }

  return expandedRows;
}

export function repeat<T>(
  colors: T[],
  repeaterGroups: { count: number; start: number; length: number }[][],
): T[] {
  let currentColors: T[] = [...colors];
  let indices: number[] = [];
  for (let i = 0; i <= colors.length; i++) {
    indices.push(i);
  }
  for (const repeaterGroup of repeaterGroups) {
    const newColors: T[] = [];
    const newIndices: number[] = [];
    let lastEnd: number = 0;
    let indicesToSkip: number = 0;
    for (const repeater of repeaterGroup) {
      const end = repeater.start + repeater.length;
      newColors.push(
        ...currentColors.slice(indices[lastEnd], indices[repeater.start]),
      );
      for (let i = lastEnd; i < end; i++) {
        newIndices.push(indicesToSkip + i);
      }
      for (let c = 0; c < repeater.count; c++) {
        newColors.push(
          ...currentColors.slice(indices[repeater.start], indices[end]),
        );
      }
      indicesToSkip += (repeater.count - 1) * repeater.length;
      lastEnd = end;
    }
    newColors.push(
      ...currentColors.slice(indices[lastEnd], currentColors.length),
    );
    for (let i = lastEnd; i < indices.length; i++) {
      newIndices.push(indicesToSkip + i);
    }
    newIndices.push(newColors.length);
    currentColors = newColors;
    indices = newIndices;
  }

  return currentColors;
}

function hexToHSL(hex: string): { h: number; s: number; l: number } {
  // Remove the hash if present
  hex = hex.replace(/^#/, "");

  // Parse the hex values
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
}

export function sortColors(colors: Color[]): Color[] {
  return [...colors].sort((a, b) => {
    const hslA = hexToHSL(a.hex);
    const hslB = hexToHSL(b.hex);

    // If one is gray and the other isn't, sort grays first
    const isGrayA = hslA.s < 10;
    const isGrayB = hslB.s < 10;
    if (isGrayA && !isGrayB) return -1;
    if (!isGrayA && isGrayB) return 1;
    if (isGrayA && isGrayB) {
      if (hslA.l !== hslB.l) return hslB.l - hslA.l;
    }

    // If both are gray or both are not gray, compare by hue
    if (hslA.h !== hslB.h) return hslA.h - hslB.h;

    // Compare by lightness
    if (hslA.l !== hslB.l) return hslB.l - hslA.l;

    // Compare by saturation
    return hslA.s - hslB.s;
  });
}

export function repeaterLength(repeater: Repeater): number {
  return repeater.length;
}

/**
 * Returns the smallest number of lists of non-overlapping repeaters
 * @param repeaters - The array of Repeater objects
 * @returns - An array of lists of non-overlapping Repeater objects
 */
export function groupNonOverlappingRepeaters(
  repeaters: Repeater[],
): Repeater[][] {
  // Sort the repeaters by length and then by start
  const sortedRepeaters = [...repeaters].sort((a, b) => {
    return a.length - b.length || a.start - b.start;
  });

  // Initialize the array of groups
  const groups: Repeater[][] = [];

  // Place each repeater into the first group that doesn't overlap
  for (const repeater of sortedRepeaters) {
    let placed = false;

    // Try to place in an existing group
    for (const group of groups) {
      if (!group.some((r) => overlaps(r, repeater))) {
        group.push(repeater);
        placed = true;
        break;
      }
    }

    // If it doesn't fit, create a new group
    if (!placed) {
      groups.push([repeater]);
    }
  }

  // Iteratively attempt to move elements up into earlier groups
  let changed = false;
  do {
    changed = false;
    for (let i = groups.length - 1; i > 0; i--) {
      const group = groups[i];
      for (let j = group.length - 1; j >= 0; j--) {
        const repeater = group[j];

        // Check if this repeater can be moved up to any previous group
        for (let k = 0; k < i; k++) {
          if (!groups[k].some((r) => overlaps(r, repeater))) {
            groups[k].push(repeater);
            group.splice(j, 1); // Remove from the current group
            changed = true;
            break;
          }
        }
      }
    }
  } while (changed);

  // Remove any empty groups
  const nonEmptyGroups = groups.filter((group) => group.length > 0);

  // Sort each group by start
  nonEmptyGroups.forEach((group) => {
    group.sort((a, b) => a.start - b.start);
  });

  return nonEmptyGroups;
}

// Helper function to check if two repeaters overlap
function overlaps(r1: Repeater, r2: Repeater): boolean {
  const r1End = r1.start + r1.length;
  const r2End = r2.start + r2.length;
  return !(r1End <= r2.start || r2End <= r1.start);
}
