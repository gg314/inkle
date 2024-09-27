// ColorBox.tsx
import { Fragment, useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import ColorBox from "@/components/colorbox";
import { Color, PatternRow, Repeater } from "@/types/inkle";
import {
  MinusIcon,
  PlusIcon,
  RocketIcon,
  ShuffleIcon,
} from "@radix-ui/react-icons";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { mirrorData } from "@/lib/inkle";

type RandomGeneratorProps = {
  colors: Color[];
  setDataFn: React.Dispatch<React.SetStateAction<PatternRow[]>>;
  setRepeatersFn: React.Dispatch<React.SetStateAction<Repeater[]>>;
};

const RandomGenerator = ({
  colors,
  setDataFn,
  setRepeatersFn,
}: RandomGeneratorProps) => {
  const [numberOfColors, setNumberOfColors] = useState<number>(5);
  const [colorPalette, setColorPalette] = useState<string>("available");
  const [outerBands, setOuterBands] = useState<(Color | null | "random")[]>([
    "random",
  ]);
  const [numberOfWarpThreads, setnumberOfWarpThreads] = useState<number>(10);
  const [useMirror, setUseMirror] = useState<boolean>(true);

  const addOuterBand = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setOuterBands([...outerBands, "random"]);
  };

  const removeOuterBand = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setOuterBands(outerBands.slice(0, -1));
  };

  const updateColor = useCallback(
    (_: number, colorIndex: number, color: Color) => {
      setOuterBands((prev) => {
        const updated = [...prev];
        updated[colorIndex] = color;
        return updated;
      });
    },
    []
  );

  function getRandomColor(
    color: Color | "random" | null,
    palette: Color[] = []
  ) {
    if (color == "random") {
      return palette[Math.floor(Math.random() * palette.length)];
    }
    return color;
  }

  const generateData = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const startingPalette =
      colorPalette === "all" ? colors : colors.filter((c) => c.owned);
    const palette =
      startingPalette.length <= numberOfColors
        ? startingPalette
        : [...startingPalette]
            .sort(() => 0.5 - Math.random())
            .slice(0, numberOfColors);
    let bands = outerBands.map((c) => getRandomColor(c, palette));
    let warps = Array(numberOfWarpThreads)
      .fill("random")
      .map((c) => getRandomColor(c, palette));

    let row1Colors = bands.flatMap((item) => [item, null]);
    let row2Colors = bands.flatMap((item) => [null, item]);
    warps.forEach((warp, index) => {
      if (index % 2 === 0) {
        row1Colors.push(warp);
        row2Colors.push(null);
      } else {
        row1Colors.push(null);
        row2Colors.push(warp);
      }
    });
    let row1 = {
      label: "H",
      colors: row1Colors,
    };
    let row2 = {
      label: "U",
      colors: row2Colors,
    };
    let data = [row1, row2];
    if (useMirror) {
      data = mirrorData(data);
    }
    setDataFn(data);
    setRepeatersFn([]);
  };

  return (
    <>
      <div className="mt-4 mb-8">
        <h2 className="scroll-m-20 pb-2 text-3xl font-semibold tracking-tight first:mt-0">
          Random generator
        </h2>
      </div>
      <div className="mb-8">
        <form
          className="grid w-full items-start gap-6 overflow-auto p-4 pt-0"
          onSubmit={generateData}
        >
          <fieldset className="grid gap-6 rounded-lg border p-4">
            <legend className="-ml-1 px-1 text-sm font-medium">Colors</legend>
            <div className="grid gap-3">
              <Label htmlFor="colors-to-use">Color palette</Label>
              <Select
                onValueChange={setColorPalette}
                defaultValue={colorPalette}
              >
                <SelectTrigger className="w-[240px]">
                  {(() => {
                    switch (colorPalette) {
                      case "all":
                        return "All colors";
                      default:
                        return "Available colors";
                    }
                  })()}
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div>All colors</div>
                    <span className="text-muted-foreground">...</span>
                  </SelectItem>
                  <SelectItem value="available">
                    <div>
                      <span>Available colors</span>
                      <div className="text-muted-foreground">...</div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-3">
              <Label htmlFor="number-of-colors">Number of colors to use</Label>
              <Input
                type="number"
                id="number-of-colors"
                className="w-[240px]"
                placeholder="Number of colors"
                value={numberOfColors}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  const boundedValue = Math.min(50, Math.max(1, value));
                  setNumberOfColors(boundedValue);
                }}
              />
            </div>
          </fieldset>

          <fieldset className="grid gap-6 rounded-lg border p-4">
            <legend className="-ml-1 px-1 text-sm font-medium">Warp</legend>
            <div className="flex items-center space-x-2">
              <Button
                className="mr-2"
                variant={"outline"}
                onClick={addOuterBand}
              >
                <PlusIcon className="mr-2 h-4 w-4" />
                Add outer band
              </Button>
              <Button
                className="mr-2"
                variant={"outline"}
                onClick={removeOuterBand}
                disabled={outerBands.length <= 0}
              >
                <MinusIcon className="mr-2 h-4 w-4" />
                Remove outer band
              </Button>
            </div>
            <div className="px-2">
              {outerBands.map((color, idx) => (
                <div key={idx} className="inline-block mr-1.5">
                  <ColorBox
                    colors={colors}
                    color={color}
                    rowIdx={0}
                    colIdx={idx}
                    updateColorFn={updateColor}
                  />
                </div>
              ))}
            </div>
            <Separator />
            <div className="grid gap-3">
              <Label htmlFor="number-of-inner">Number of warp threads</Label>
              <Input
                type="number"
                id="number-of-inner"
                className="w-[240px]"
                placeholder="Number of warp threads"
                value={numberOfWarpThreads}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  const boundedValue = Math.min(50, Math.max(1, value));
                  setnumberOfWarpThreads(boundedValue);
                }}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                className="p-0"
                id="mirror"
                checked={useMirror}
                onClick={() => setUseMirror(!useMirror)}
              />
              <Label htmlFor="mirror">Mirror pattern horizontally</Label>
            </div>
          </fieldset>

          <div className="mb-4">
            <Button className="mr-2">
              <ShuffleIcon className="mr-2 h-4 w-4" />
              Generate
            </Button>
          </div>
        </form>

        <Alert>
          <RocketIcon className="h-4 w-4" />
          <AlertTitle>Pro tip!</AlertTitle>
          <AlertDescription>
            Return to the band designer to further customize your pattern.
          </AlertDescription>
        </Alert>
      </div>
    </>
  );
};

export default RandomGenerator;
