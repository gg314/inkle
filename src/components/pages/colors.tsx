// ColorBox.tsx
import { Button } from "@/components/ui/button";
import { Color } from "@/types/inkle";
import { PlusIcon, SwitchIcon } from "@radix-ui/react-icons";
import { sortColors } from "@/lib/inkle";
import { cn } from "@/lib/utils";

type ColorSettingsProps = {
  colors: Color[];
  handleToggleColor: (color: Color) => void;
};

const ColorSettings = ({ colors, handleToggleColor }: ColorSettingsProps) => {
  return (
    <>
      <div>
        <div className="mt-4 mb-4">
          <h2 className="scroll-m-20 pb-2 text-3xl font-semibold tracking-tight first:mt-0">
            Color settings
          </h2>
          <p>
            Click a color to toggle its availability. Only "available" colors
            will be shown in the band designer.
          </p>
        </div>
        <div className="mb-8">
          <Button variant="outline" className="mr-2">
            <SwitchIcon className="mr-2 h-4 w-4" /> Toggle availability for all
          </Button>
          <Button variant="outline" disabled>
            {/* TODO */}
            <PlusIcon className="mr-2 h-4 w-4" /> Add a color
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {sortColors(colors).map((color: Color, index: number) => (
            <div
              key={index}
              className={cn(
                "flex items-center my-1 cursor-pointer",
                color.owned ? "opacity-100" : "opacity-30"
              )}
              onClick={() => handleToggleColor(color)}
            >
              <div
                style={{ backgroundColor: color.hex }}
                className="mx-1 h-6 w-6 rounded-sm border border-gray-600"
              ></div>
              <div className="mx-1">
                <div className="font-semibold">{color.name}</div>
                <div className="text-xs opacity-50">{color.hex}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default ColorSettings;
