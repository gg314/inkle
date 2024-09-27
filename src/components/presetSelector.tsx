import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Fragment, useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Color, PatternRow, PresetPattern } from "@/types/inkle";
import {
  DoubleArrowUpIcon,
  MinusIcon,
  PlusIcon,
  RocketIcon,
  ShuffleIcon,
} from "@radix-ui/react-icons";
import { presetPatterns } from "@/assets/presets/presets";

type PresetSelectorProps = {
  setPresetFn: (preset: PresetPattern) => void;
};

const PresetSelector = ({ setPresetFn }: PresetSelectorProps) => {
  const [selectedPreset, setSelectedPreset] = useState<PresetPattern>(
    presetPatterns[0]
  );

  const handlePresetChange = (presetName: string) => {
    const selected = presetPatterns.find(
      (preset) => preset.name === presetName
    );
    if (selected) {
      setSelectedPreset(selected);
      setPresetFn(selected);
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <Select onValueChange={handlePresetChange}>
        <SelectTrigger className="w-[240px]">
          <SelectValue placeholder="Load a preset pattern" />
        </SelectTrigger>
        <SelectContent>
          {presetPatterns.map((preset, idx) => (
            <SelectItem value={preset.name} key={idx}>
              {preset.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {/* <Button variant="outline" onClick={() => setPresetFn(selectedPreset)}>
        <DoubleArrowUpIcon className="h-4 w-4 mr-2" />
        Load pattern
      </Button> */}
    </div>
  );
};

export default PresetSelector;
