// ColorBox.tsx

import { QuestionMarkIcon } from "@radix-ui/react-icons";
import { useState } from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Color } from "@/types/inkle";

type ColorBoxProps = {
  color: Color | null | "random";
  colors: Color[];
  rowIdx: number;
  colIdx: number;
  updateColorFn: (rowIdx: number, colIdx: number, color: Color) => void;
};

const ColorBox = ({
  color,
  colors,
  rowIdx,
  colIdx,
  updateColorFn,
}: ColorBoxProps) => {
  const [pickerOpen, setPickerOpen] = useState(false);

  const getName = (color: Color | null | "random") => {
    if (color === "random") {
      return "Random";
    } else if (color === null) {
      return "Transparent";
    } else {
      return color.name;
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger className="p-0 h-8 border-0 flex-shrink-0">
          <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
            <PopoverTrigger asChild>
              <div
                className="rounded-none border border-gray-700 w-8 h-8 p-0 flex-shrink-0"
                role="combobox"
                style={
                  typeof color === "string"
                    ? {
                        background:
                          "repeating-linear-gradient(-45deg, rgba(155, 100, 255, .03), rgba(155, 100, 255, .03) 6px, rgba(155, 100, 255, .2) 6px, rgba(155, 100, 255, .2) 12px)",
                      }
                    : color?.hex
                      ? { backgroundColor: color.hex }
                      : undefined
                }
              >
                {color === "random" && (
                  <QuestionMarkIcon className="h-8 p-0 m-0 mx-auto" />
                )}
              </div>
            </PopoverTrigger>
            <PopoverContent>
              <Command>
                <CommandInput placeholder="Search colors..." />
                <CommandList>
                  <CommandEmpty>No results</CommandEmpty>
                  <CommandGroup>
                    {colors.map((color, idx) => {
                      if (color.owned) {
                        return (
                          <CommandItem
                            key={idx}
                            value={color.name}
                            onSelect={() => {
                              updateColorFn(rowIdx, colIdx, color);
                              setPickerOpen(false);
                            }}
                          >
                            <div
                              className="h-4 w-4 mr-2 rounded-sm border border-gray-300"
                              style={{ backgroundColor: color.hex }}
                            ></div>
                            <span>{color.name}</span>
                          </CommandItem>
                        );
                      }
                    })}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </TooltipTrigger>
        <TooltipContent>{getName(color)}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default ColorBox;
