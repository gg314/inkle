export type BandMode = "basic" | "krokbragd";

export type Color = {
  name: string;
  hex: string;
  owned: boolean;
  isCustom?: boolean;
};

export type PatternRow = {
  label: string;
  colors: (Color | null)[];
};

export type Repeater = {
  count: number;
  start: number;
  end: number;
};

export type PresetPattern = {
  name: string;
  mode?: BandMode;
  band: PatternRow[];
  repeaters: Repeater[];
};
