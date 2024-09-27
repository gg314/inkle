export type Color = {
  name: string;
  hex: string;
  owned: boolean;
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
  band: PatternRow[];
  repeaters: Repeater[];
};
