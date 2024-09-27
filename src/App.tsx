import { Slider } from "@/components/ui/slider";
import { ALL_COLORS, presetPatterns } from "@/assets/presets/presets";
import { Fragment, useCallback, useEffect, useState } from "react";
import "./App.css";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  ChevronRightIcon,
  ChevronLeftIcon,
  ResetIcon,
  SwitchIcon,
  CopyIcon,
  ShuffleIcon,
  PlusIcon,
  MinusIcon,
  HeartIcon,
} from "@radix-ui/react-icons";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Color, PatternRow, PresetPattern, Repeater } from "@/types/inkle";
import Pattern from "@/components/pattern";
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
import ColorBox from "@/components/colorbox";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import {
  groupNonOverlappingRepeaters,
  mirrorData,
  repeaterLength,
} from "@/lib/inkle";
import RandomGenerator from "@/components/pages/generator";
import ColorSettings from "@/components/pages/colors";
import PresetSelector from "@/components/presetSelector";
import { Label } from "@/components/ui/label";

const BLANK_BUTTON = (
  <div
    className="rounded-none border-none opacity-30 h-8 w-8 p-0 inline-block"
    style={{
      background:
        "repeating-linear-gradient(-45deg, rgba(0, 0, 0, .1), rgba(0, 0, 0, .1) 4px, rgba(0, 0, 0, .4) 4px, rgba(0, 0, 0, .4) 8px)",
    }}
  ></div>
);

function App() {
  const [useMirror, setUseMirror] = useState(false);
  const [useShadow, setUseShadow] = useState(true);
  const [colors, setColors] = useState<Color[]>(ALL_COLORS);
  const [rows, setRows] = useState<PatternRow[]>(
    presetPatterns[presetPatterns.length - 1].band
  );
  const [repeaters, setRepeaters] = useState<Repeater[]>(
    presetPatterns[presetPatterns.length - 1].repeaters
  );
  // const [rows, setRows] = useState<PatternRow[]>([
  //   {
  //     label: "H",
  //     colors: [
  //       colors[20],
  //       null,
  //       colors[20],
  //       null,
  //       colors[30],
  //       null,
  //       colors[30],
  //       null,
  //       colors[20],
  //     ],
  //   },
  //   {
  //     label: "U",
  //     colors: [
  //       null,
  //       colors[30],
  //       null,
  //       colors[30],
  //       null,
  //       colors[20],
  //       null,
  //       colors[30],
  //       null,
  //     ],
  //   },
  // ]);
  // const [repeaters, setRepeaters] = useState<Repeater[]>([
  //   { count: 2, start: 1, end: 3 },
  //   { count: 3, start: 1, end: 7 },
  //   { count: 2, start: 5, end: 7 },
  //   { count: 3, start: 7, end: 9 },
  // ]);

  // add nulls to the end of each pattern row
  const addColor = useCallback(() => {
    setRows((oldRows) =>
      oldRows.map((row) => {
        return { ...row, colors: [...row.colors, null] };
      })
    );
  }, []);

  // remove 1 from the end of each pattern row
  const removeColor = useCallback(() => {
    setRows((oldRows) =>
      oldRows.map((row) => {
        return { ...row, colors: row.colors.slice(0, -1) };
      })
    );
  }, []);

  const updateColor = useCallback(
    (rowIndex: number, colorIndex: number, color: Color) => {
      setRows((oldRows) => {
        const updatedRows = [...oldRows];
        updatedRows[rowIndex].colors[colorIndex] = color;
        return updatedRows;
      });
    },
    []
  );

  const addMirroredData = () => {
    setRows(mirrorData(rows));
    setUseMirror(false);
  };

  const toggleColorOwned = (color: Color) => {
    const updatedColors = colors.map((c) => {
      if (c.name === color.name) {
        return { ...c, owned: !c.owned };
      }
      return c;
    });
    setColors(updatedColors);
  };

  const setPreset = (preset: PresetPattern) => {
    setRows(preset.band);
    setRepeaters(preset.repeaters);
  };

  return (
    <>
      <div className="hidden h-full flex-col md:flex">
        <div className="flex flex-col items-start justify-between space-y-2 py-4 sm:flex-row sm:items-center sm:space-y-0 md:h-16 px-4">
          <h2 className="text-lg whitespace-nowrap font-light">
            Inkle Pattern Generator
          </h2>
          <div className="ml-auto flex w-full space-x-2 sm:justify-end">
            <PresetSelector setPresetFn={setPreset} />
            <Button variant="ghost">
              <CopyIcon className="h-4 w-4 mr-2" />
              Save
            </Button>
            <Button variant="ghost">
              <HeartIcon className="h-4 w-4 mr-2" />
              Support
            </Button>
          </div>
        </div>
        <Separator />

        <ResizablePanelGroup
          direction="horizontal"
          className="min-h-[200px] rounded-lg  md:min-w-[450px]"
        >
          <ResizablePanel defaultSize={75}>
            <div className="p-10">
              <div>
                <div className="flex h-full justify-center">
                  <Tabs defaultValue="designer" style={{ width: "100%" }}>
                    <div>
                      <TabsList className="mb-4">
                        <TabsTrigger value="designer">
                          Band Designer
                        </TabsTrigger>
                        <TabsTrigger value="generator">
                          Random Generator
                        </TabsTrigger>
                        <TabsTrigger value="colors">Color Settings</TabsTrigger>
                      </TabsList>
                    </div>
                    <TabsContent value="designer">
                      <div>
                        <div className="mt-4 mb-8">
                          <h2 className="scroll-m-20 pb-2 text-3xl font-semibold tracking-tight first:mt-0">
                            Band designer
                          </h2>
                        </div>

                        <div className="mb-8">
                          <h4 className="scroll-m-20 text-xl font-semibold tracking-tight mb-4">
                            Warping draft
                          </h4>

                          <div className="mb-6">
                            {rows.map((row, rowIdx) => (
                              <div
                                key={rowIdx}
                                className="flex items-center h-8"
                              >
                                <span className="weight-light p-2 text-muted-foreground w-8">
                                  {row.label}
                                </span>
                                {row.colors.map((color, idx) => (
                                  <Fragment key={idx}>
                                    {color === null &&
                                    (rowIdx + idx) % 2 === 1 ? (
                                      BLANK_BUTTON
                                    ) : (
                                      <ColorBox
                                        color={color}
                                        colors={colors}
                                        rowIdx={rowIdx}
                                        colIdx={idx}
                                        updateColorFn={updateColor}
                                      />
                                    )}
                                  </Fragment>
                                ))}
                              </div>
                            ))}

                            {groupNonOverlappingRepeaters(repeaters).map(
                              (repeaterGroup, idx) => {
                                let cursor = 0;
                                return (
                                  <div
                                    className="flex items-center space-y-0"
                                    key={idx}
                                  >
                                    <span className="w-8"></span>
                                    {repeaterGroup.map((repeater, rIdx) => {
                                      const test = Array.from({
                                        length: repeater.start - cursor,
                                      }).map((_, index) => (
                                        <div
                                          key={`row3-blank${index}`}
                                          className="w-8"
                                        ></div>
                                      ));
                                      cursor = repeater.end + 1;

                                      const repeaterHtml = (
                                        <div
                                          style={{
                                            width: `${
                                              2 * repeaterLength(repeater)
                                            }rem`,
                                          }}
                                          className={`flex items-center justify-center border-l border-r border-b border-gray-800 relative mt-2.5 h-3`}
                                        >
                                          <span className="px-0.5 z-10 text-sm text-gray-500 absolute bottom pb-1">
                                            &times;{repeater.count}
                                          </span>
                                        </div>
                                      );
                                      return (
                                        <div
                                          className="flex space-x-0"
                                          key={rIdx}
                                        >
                                          {test}
                                          {repeaterHtml}
                                        </div>
                                      );
                                    })}
                                  </div>
                                );
                              }
                            )}
                          </div>

                          <div className="flex items-center space-x-2 mb-4">
                            <Button variant="outline" onClick={addColor}>
                              <PlusIcon className="mr-2 h-4 w-4" /> Add warp
                            </Button>
                            <Button
                              variant="outline"
                              onClick={removeColor}
                              disabled={rows[0].colors.length <= 1}
                            >
                              <MinusIcon className="mr-2 h-4 w-4" /> Remove warp
                            </Button>
                            <Button
                              variant="outline"
                              disabled
                              onClick={addColor}
                            >
                              <PlusIcon className="mr-2 h-4 w-4" /> Add repeater
                            </Button>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              disabled={!useMirror}
                              onClick={addMirroredData}
                            >
                              <CopyIcon className="mr-2 h-4 w-4" />
                              Expand mirrored pattern
                            </Button>

                            <Button variant="outline">
                              <ResetIcon className="mr-2 h-4 w-4" />
                              Clear pattern
                            </Button>
                          </div>
                        </div>

                        <h4 className="scroll-m-20 text-xl font-semibold tracking-tight mb-4">
                          Settings
                        </h4>
                        <div className="mb-8">
                          Title ,, move Show Shadows to COlros tabs
                        </div>

                        <h4 className="scroll-m-20 text-xl font-semibold tracking-tight mb-4">
                          Options
                        </h4>

                        <div className="flex items-center space-x-2 mb-4">
                          <Checkbox
                            id="use-mirror"
                            className="p-0"
                            checked={useMirror}
                            onClick={() => setUseMirror(!useMirror)}
                          />
                          <Label
                            htmlFor="use-mirror"
                            className="grid gap-0.5 leading-none text-sm font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            <span>Mirror pattern horizontally</span>
                            <p className="text-sm text-muted-foreground">
                              Tip: start and finish in the "H" row
                            </p>
                          </Label>
                        </div>

                        <div className="flex items-center space-x-2 mb-4">
                          <Checkbox
                            id="show-shadows"
                            className="p-0"
                            checked={useShadow}
                            onClick={() => setUseShadow(!useShadow)}
                          />
                          <Label
                            htmlFor="show-shadows"
                            className="grid gap-0.5 leading-none text-sm font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            <span>Show shadows</span>
                            <p className="text-sm text-muted-foreground">
                              Simulate a 3D effect in the band preview
                            </p>
                          </Label>
                        </div>
                      </div>
                    </TabsContent>
                    <TabsContent value="generator">
                      <RandomGenerator
                        colors={colors}
                        setDataFn={setRows}
                        setRepeatersFn={setRepeaters}
                      />
                    </TabsContent>
                    <TabsContent value="colors">
                      <ColorSettings
                        colors={colors}
                        handleToggleColor={toggleColorOwned}
                      />
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={25} minSize={8} maxSize={50}>
            <div
              className="flex h-full justify-center items-center px-8 bg-gray-50"
              // style={{ maxHeight: "100%" }}
            >
              <Pattern
                bandConfig={rows}
                repeaterGroups={groupNonOverlappingRepeaters(repeaters)}
                useMirror={useMirror}
                useShadow={useShadow}
                nRows={15}
              />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </>
  );
}

export default App;
