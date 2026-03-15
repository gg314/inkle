import { presetPatterns } from "@/assets/presets/presets";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PresetPattern } from "@/types/inkle";

type PresetSelectorProps = {
  setPresetFn: (preset: PresetPattern) => void;
};

const PresetSelector = ({ setPresetFn }: PresetSelectorProps) => {
  const handlePresetChange = (presetName: string) => {
    const selected = presetPatterns.find(
      (preset) => preset.name === presetName,
    );
    if (selected) {
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
          {presetPatterns.map((preset) => (
            <SelectItem value={preset.name} key={preset.name}>
              {preset.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {/* <Button variant="outline" onClick={() => setPresetFn(selectedPreset)}>
        <DoubleArrowUpIcon className="h-4 w-4" />
        Load pattern
      </Button> */}
    </div>
  );
};

export default PresetSelector;
