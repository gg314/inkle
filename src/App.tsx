import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { ALL_COLORS, presetPatterns } from "@/assets/presets/presets";
import "./App.css";
import {
  BookmarkIcon,
  ChevronDownIcon,
  ColorWheelIcon,
  CopyIcon,
  Cross2Icon,
  DownloadIcon,
  EyeOpenIcon,
  FileTextIcon,
  GitHubLogoIcon,
  HeartIcon,
  MinusIcon,
  Pencil2Icon,
  PlusIcon,
  ResetIcon,
  UploadIcon,
} from "@radix-ui/react-icons";
import ColorBox from "@/components/colorbox";
import ColorSettings from "@/components/pages/colors";
import RandomGenerator from "@/components/pages/generator";
import Pattern from "@/components/pattern";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  groupNonOverlappingRepeaters,
  mirrorData,
  repeaterLength,
} from "@/lib/inkle";
import { Color, PatternRow, PresetPattern, Repeater } from "@/types/inkle";

const BLANK_BUTTON = (
  <div
    className="rounded-none border-none opacity-30 h-8 w-8 p-0 inline-block flex-shrink-0"
    style={{
      background:
        "repeating-linear-gradient(-45deg, rgba(0, 0, 0, .1), rgba(0, 0, 0, .1) 4px, rgba(0, 0, 0, .4) 4px, rgba(0, 0, 0, .4) 8px)",
    }}
  ></div>
);

function App() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [useMirror, setUseMirror] = useState(false);
  const [useShadow, setUseShadow] = useState(true);
  const [patternTitle, setPatternTitle] = useState("");
  const [colors, setColors] = useState<Color[]>(ALL_COLORS);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [rows, setRows] = useState<PatternRow[]>(
    presetPatterns[presetPatterns.length - 1].band,
  );
  const [repeaters, setRepeaters] = useState<Repeater[]>(
    presetPatterns[presetPatterns.length - 1].repeaters,
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

  // Update document title when pattern title changes
  useEffect(() => {
    if (patternTitle.trim()) {
      document.title = `${patternTitle} - Inkle Pattern Designer`;
    } else {
      document.title = "Inkle Pattern Designer";
    }
  }, [patternTitle]);

  // add nulls to the end of each pattern row
  const addColor = useCallback(() => {
    setRows((oldRows) =>
      oldRows.map((row) => {
        return { ...row, colors: [...row.colors, null] };
      }),
    );
  }, []);

  // remove 1 from the end of each pattern row
  const removeColor = useCallback(() => {
    setRows((oldRows) =>
      oldRows.map((row) => {
        return { ...row, colors: row.colors.slice(0, -1) };
      }),
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
    [],
  );

  const addMirroredData = () => {
    setRows(mirrorData(rows));
    setUseMirror(false);
  };

  const isValidRepeater = (repeater: Repeater): boolean => {
    // Start must be less than end
    if (repeater.start >= repeater.end) return false;

    // The range must include an even number of positions
    // This ensures we have equal H and U threads in the repeat
    const rangeLength = repeater.end - repeater.start;
    return rangeLength % 2 === 0;
  };

  // Filter out invalid repeaters for display purposes
  const validRepeaters = repeaters.filter(isValidRepeater);

  const toggleColorOwned = (color: Color) => {
    const updatedColors = colors.map((c) => {
      if (c.name === color.name) {
        return { ...c, owned: !c.owned };
      }
      return c;
    });
    setColors(updatedColors);
  };

  const toggleAllColors = () => {
    const allOwned = colors.every((c) => c.owned);
    const updatedColors = colors.map((c) => ({
      ...c,
      owned: !allOwned,
    }));
    setColors(updatedColors);
  };

  const addColorToLibrary = (name: string, hex: string) => {
    const newColor: Color = {
      name,
      hex,
      owned: true,
      isCustom: true,
    };
    setColors([...colors, newColor]);
  };

  const deleteColor = (colorToDelete: Color) => {
    if (!colorToDelete.isCustom) return;

    // Remove the color from the colors array
    const updatedColors = colors.filter((c) => c.name !== colorToDelete.name);

    // Update rows to replace deleted color with null
    const updatedRows = rows.map((row) => ({
      ...row,
      colors: row.colors.map((c) =>
        c && c.name === colorToDelete.name ? null : c,
      ),
    }));

    setColors(updatedColors);
    setRows(updatedRows);
  };

  const setPreset = (preset: PresetPattern) => {
    setRows(preset.band);
    setRepeaters(preset.repeaters);
  };

  const confirmClearPattern = () => {
    setRows([
      {
        label: "H",
        colors: [null, null, null, null, null],
      },
      {
        label: "U",
        colors: [null, null, null, null, null],
      },
    ]);
    setRepeaters([]);
    setUseMirror(false);
    setClearDialogOpen(false);
  };

  const savePattern = () => {
    const patternData = {
      version: "1.0",
      title: patternTitle,
      colors: colors,
      band: rows,
      repeaters: repeaters,
      useMirror: useMirror,
      useShadow: useShadow,
      savedAt: new Date().toISOString(),
    };

    const jsonString = JSON.stringify(patternData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${patternTitle || "inkle-pattern"}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const loadPattern = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const patternData = JSON.parse(content);

        // Validate the data structure
        if (!patternData.version || !patternData.band) {
          alert("Invalid pattern file format");
          return;
        }

        // Restore all settings
        if (patternData.title) setPatternTitle(patternData.title);
        if (patternData.colors) setColors(patternData.colors);
        if (patternData.band) setRows(patternData.band);
        if (patternData.repeaters) setRepeaters(patternData.repeaters);
        if (patternData.useMirror !== undefined)
          setUseMirror(patternData.useMirror);
        if (patternData.useShadow !== undefined)
          setUseShadow(patternData.useShadow);
      } catch (error) {
        alert("Error loading pattern file: " + (error as Error).message);
      }
    };
    reader.readAsText(file);
    // Reset the input value so the same file can be loaded again
    event.target.value = "";
  };

  return (
    <>
      {/* Mobile / landing page view */}
      <div className="flex md:hidden min-h-screen flex-col bg-background">
        {/* Hero */}
        <div className="px-6 pt-12 pb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight mb-3 text-foreground font-display">
            Inkle Pattern Designer
          </h1>
          <p className="text-muted-foreground text-base leading-relaxed">
            A free tool for designing inkle loom weaving patterns. Build your
            warping draft visually, assign any colors you like, and preview your
            band before you warp.
          </p>
        </div>

        {/* Preview image + Desktop notice — full-bleed muted background */}
        <div className="bg-muted px-6 pt-8 pb-8">
          <div className="mb-6">
            <img
              src="/preview-image.png"
              alt="Inkle Pattern Designer showing a warping draft with colored thread rows and a woven band preview"
              className="rounded-lg border shadow-sm w-full"
              width="1200"
              height="630"
              fetchPriority="high"
            />
          </div>

          {/* Desktop notice */}
          <div className="text-sm">
            <strong>Best on desktop.</strong>{" "}
            <span className="text-muted-foreground">
              The designer requires a larger screen to use comfortably. Come
              back on a laptop or desktop to start designing.
            </span>
          </div>
        </div>

        {/* Features */}
        <div className="px-6 pt-8 pb-8">
          <h2 className="text-lg font-semibold mb-4 text-foreground font-display">
            What you can do
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border bg-white p-4">
              <Pencil2Icon
                className="h-5 w-5 mb-2"
                style={{ color: "hsl(292,70%,40%)" }}
              />
              <div className="font-medium text-sm mb-1">Design drafts</div>
              <div className="text-xs text-muted-foreground leading-relaxed">
                Lay out rows, add and remove warps
              </div>
            </div>
            <div className="rounded-lg border bg-white p-4">
              <BookmarkIcon
                className="h-5 w-5 mb-2"
                style={{ color: "hsl(274,70%,40%)" }}
              />
              <div className="font-medium text-sm mb-1">Template library</div>
              <div className="text-xs text-muted-foreground leading-relaxed">
                Start from a built-in collection of ready-made patterns
              </div>
            </div>
            <div className="rounded-lg border bg-white p-4">
              <ColorWheelIcon
                className="h-5 w-5 mb-2"
                style={{ color: "hsl(255,70%,40%)" }}
              />
              <div className="font-medium text-sm mb-1">Pick colors</div>
              <div className="text-xs text-muted-foreground leading-relaxed">
                Use any color you want, or pick from a built-in library
              </div>
            </div>
            <div className="rounded-lg border bg-white p-4">
              <CopyIcon
                className="h-5 w-5 mb-2"
                style={{ color: "hsl(237,70%,40%)" }}
              />
              <div className="font-medium text-sm mb-1">Mirror & repeat</div>
              <div className="text-xs text-muted-foreground leading-relaxed">
                Shortcuts for efficient and aesthetic design
              </div>
            </div>
            <div className="rounded-lg border bg-white p-4">
              <EyeOpenIcon
                className="h-5 w-5 mb-2"
                style={{ color: "hsl(218,70%,40%)" }}
              />
              <div className="font-medium text-sm mb-1">Live preview</div>
              <div className="text-xs text-muted-foreground leading-relaxed">
                See a simulation of the finished woven band
              </div>
            </div>
            <div className="rounded-lg border bg-white p-4">
              <DownloadIcon
                className="h-5 w-5 mb-2"
                style={{ color: "hsl(200,70%,40%)" }}
              />
              <div className="font-medium text-sm mb-1">Save your work</div>
              <div className="text-xs text-muted-foreground leading-relaxed">
                Download patterns as JSON and reload them anytime
              </div>
            </div>
          </div>
        </div>

        {/* PDF Resources */}
        <div className="bg-muted px-6 pt-8 pb-8">
          <h2 className="text-lg font-semibold mb-1 text-foreground font-display">
            Resources
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Printable documents for inkle weavers
          </p>
          <div className="flex flex-col gap-4">
            <a
              href="/inkle-loom-pattern-standard.pdf"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "inherit", textDecoration: "none" }}
              className="rounded-lg border bg-white overflow-hidden transition-shadow duration-200 hover:shadow-[0_0_8px_rgba(0,0,0,0.12)]"
            >
              <img
                src="/template-thumbnail.png"
                alt="Blank inkle loom pattern template"
                className="w-full"
                width="600"
                height="461"
                loading="lazy"
              />
              <div className="px-4 py-3">
                <div className="font-medium text-sm">Pattern Template</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Blank warping draft graph paper
                </div>
              </div>
            </a>
            <a
              href="/inkle-loom-plans.pdf"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "inherit", textDecoration: "none" }}
              className="rounded-lg border bg-white overflow-hidden transition-shadow duration-200 hover:shadow-[0_0_8px_rgba(0,0,0,0.12)]"
            >
              <img
                src="/blueprints-thumbnail.png"
                alt="Inkle loom woodworking plans"
                className="w-full"
                width="600"
                height="461"
                loading="lazy"
              />
              <div className="px-4 py-3">
                <div className="font-medium text-sm">Inkle Loom Plans</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Woodworking plans and dimensions
                </div>
              </div>
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-auto px-6 py-6 border-t flex justify-center gap-2">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
          >
            <a
              href="https://github.com/gg314/inkle"
              target="_blank"
              rel="noopener noreferrer"
            >
              <GitHubLogoIcon className="mr-2 h-4 w-4" />
              Source code
            </a>
          </Button>
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
          >
            <a
              href="https://github.com/sponsors/gg314?frequency=one-time"
              target="_blank"
              rel="noopener noreferrer"
            >
              <HeartIcon className="mr-2 h-4 w-4" />
              Support
            </a>
          </Button>
        </div>
      </div>

      {/* Desktop view */}
      <div className="hidden h-screen flex-col md:flex">
        <div className="flex flex-col items-start justify-between space-y-2 py-4 sm:flex-row sm:items-center sm:space-y-0 md:h-16 px-4">
          <h2 className="text-lg whitespace-nowrap font-light font-display">
            Inkle Pattern Designer
          </h2>
          <div className="ml-auto flex w-full space-x-2 sm:justify-end">
            <input
              type="file"
              ref={fileInputRef}
              onChange={loadPattern}
              accept=".json"
              style={{ display: "none" }}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost">
                  Manage Project
                  <ChevronDownIcon className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={savePattern}>
                  <DownloadIcon className="mr-2 h-4 w-4" />
                  Save Pattern...
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                  <UploadIcon className="mr-2 h-4 w-4" />
                  Load Pattern...
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <CopyIcon className="mr-2 h-4 w-4" />
                    Load Preset
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="w-48">
                    {presetPatterns.map((preset, idx) => (
                      <DropdownMenuItem
                        key={idx}
                        onClick={() => setPreset(preset)}
                      >
                        {preset.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setClearDialogOpen(true)}>
                  <ResetIcon className="mr-2 h-4 w-4" />
                  Clear Pattern
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost">
                  Resources
                  <ChevronDownIcon className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuItem asChild>
                  <a
                    href="https://github.com/gg314/inkle"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="cursor-pointer"
                  >
                    <GitHubLogoIcon className="mr-2 h-4 w-4" />
                    Source Code
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a
                    href="https://github.com/sponsors/gg314?frequency=one-time"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="cursor-pointer"
                  >
                    <HeartIcon className="mr-2 h-4 w-4" />
                    Support
                  </a>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Downloads</DropdownMenuLabel>
                <DropdownMenuItem asChild>
                  <a
                    href="/inkle-loom-plans.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="cursor-pointer"
                  >
                    <FileTextIcon className="mr-2 h-4 w-4" />
                    Build an Inkle Loom (PDF)
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a
                    href="/inkle-loom-pattern-standard.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="cursor-pointer"
                  >
                    <FileTextIcon className="mr-2 h-4 w-4" />
                    Blank Pattern Template (PDF)
                  </a>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <Separator />

        <ResizablePanelGroup className="flex-1 rounded-lg md:min-w-[450px]">
          <ResizablePanel defaultSize={75}>
            <div className="p-10 overflow-y-auto h-full">
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
                        <TabsTrigger value="colors">
                          Available Colors
                        </TabsTrigger>
                        <TabsTrigger value="settings">Settings</TabsTrigger>
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

                          <ScrollArea className="mb-6 w-full whitespace-nowrap border rounded-md">
                            <div className="p-4">
                              {rows.map((row, rowIdx) => (
                                <div
                                  key={rowIdx}
                                  className="flex items-center h-8 flex-nowrap"
                                >
                                  <span className="weight-light p-2 text-muted-foreground w-8 flex-shrink-0">
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

                              {groupNonOverlappingRepeaters(validRepeaters).map(
                                (repeaterGroup, idx) => {
                                  let cursor = 0;
                                  return (
                                    <div
                                      className="flex items-center space-y-0 flex-nowrap"
                                      key={idx}
                                    >
                                      <span className="w-8 flex-shrink-0"></span>
                                      {repeaterGroup.map((repeater, rIdx) => {
                                        const test = Array.from({
                                          length: repeater.start - cursor,
                                        }).map((_, index) => (
                                          <div
                                            key={`row3-blank${index}`}
                                            className="w-8 flex-shrink-0"
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
                                            className={`flex items-center justify-center border-l border-r border-b border-gray-800 relative mt-2.5 h-3 flex-shrink-0`}
                                          >
                                            <span className="px-0.5 z-10 text-sm text-gray-500 absolute bottom pb-1">
                                              &times;{repeater.count}
                                            </span>
                                          </div>
                                        );
                                        return (
                                          <div
                                            className="flex space-x-0 flex-shrink-0"
                                            key={rIdx}
                                          >
                                            {test}
                                            {repeaterHtml}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  );
                                },
                              )}
                            </div>
                            <ScrollBar orientation="horizontal" />
                          </ScrollArea>

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
                          </div>
                        </div>

                        <h4 className="scroll-m-20 text-xl font-semibold tracking-tight mb-4">
                          Options
                        </h4>

                        <div className="flex items-start gap-3">
                          <Checkbox
                            id="use-mirror"
                            checked={useMirror}
                            onClick={() => setUseMirror(!useMirror)}
                          />
                          <div className="grid gap-2">
                            <Label htmlFor="use-mirror">
                              Mirror pattern horizontally
                            </Label>
                            <p className="text-muted-foreground text-sm">
                              Tip: start and finish in the "H" row
                            </p>
                          </div>
                        </div>

                        <h4 className="scroll-m-20 text-xl font-semibold tracking-tight mb-4 mt-8">
                          Repeaters
                        </h4>
                        <p className="text-sm text-muted-foreground mb-4">
                          Repeaters duplicate a section of your pattern. The
                          range must include an even number of positions (equal
                          H and U threads).
                        </p>

                        <div className="mb-4">
                          {repeaters.length === 0 ? (
                            <p className="text-sm text-muted-foreground mb-4 italic">
                              No repeaters defined yet.
                            </p>
                          ) : (
                            <div className="mb-4">
                              {repeaters.map((repeater, idx) => {
                                const isValid = isValidRepeater(repeater);
                                const isLast = idx === repeaters.length - 1;
                                return (
                                  <div
                                    key={idx}
                                    className={`${!isLast ? "border-b" : ""} ${!isValid ? "bg-red-50" : ""}`}
                                  >
                                    <div className="flex items-center gap-2 py-3">
                                      <Label
                                        htmlFor={`repeater-${idx}-start`}
                                        className="text-sm font-normal whitespace-nowrap"
                                      >
                                        Start:
                                      </Label>
                                      <Input
                                        id={`repeater-${idx}-start`}
                                        type="number"
                                        min={0}
                                        max={rows[0].colors.length - 1}
                                        value={repeater.start}
                                        onChange={(e) => {
                                          const newRepeaters = [...repeaters];
                                          newRepeaters[idx].start =
                                            parseInt(e.target.value) || 0;
                                          setRepeaters(newRepeaters);
                                        }}
                                        className="h-8 w-16"
                                      />
                                      <Label
                                        htmlFor={`repeater-${idx}-end`}
                                        className="text-sm font-normal whitespace-nowrap"
                                      >
                                        End:
                                      </Label>
                                      <Input
                                        id={`repeater-${idx}-end`}
                                        type="number"
                                        min={0}
                                        max={rows[0].colors.length - 1}
                                        value={repeater.end}
                                        onChange={(e) => {
                                          const newRepeaters = [...repeaters];
                                          newRepeaters[idx].end =
                                            parseInt(e.target.value) || 0;
                                          setRepeaters(newRepeaters);
                                        }}
                                        className="h-8 w-16"
                                      />
                                      <Label
                                        htmlFor={`repeater-${idx}-count`}
                                        className="text-sm font-normal whitespace-nowrap"
                                      >
                                        Repetitions:
                                      </Label>
                                      <Input
                                        id={`repeater-${idx}-count`}
                                        type="number"
                                        min={1}
                                        value={repeater.count}
                                        onChange={(e) => {
                                          const newRepeaters = [...repeaters];
                                          newRepeaters[idx].count =
                                            parseInt(e.target.value) || 1;
                                          setRepeaters(newRepeaters);
                                        }}
                                        className="h-8 w-16"
                                      />
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          const newRepeaters = repeaters.filter(
                                            (_, i) => i !== idx,
                                          );
                                          setRepeaters(newRepeaters);
                                        }}
                                        className="ml-auto"
                                      >
                                        <Cross2Icon className="h-4 w-4" />
                                      </Button>
                                    </div>
                                    {!isValid && (
                                      <p className="text-xs text-red-600 pb-2">
                                        {repeater.start >= repeater.end
                                          ? "Start must be less than end"
                                          : `Range must be even (currently ${repeater.end - repeater.start})`}
                                      </p>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                          <Button
                            variant="outline"
                            onClick={() => {
                              setRepeaters([
                                ...repeaters,
                                { start: 0, end: 2, count: 2 },
                              ]);
                            }}
                          >
                            <PlusIcon className="mr-2 h-4 w-4" /> Add repeater
                          </Button>
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
                        handleToggleAll={toggleAllColors}
                        handleAddColor={addColorToLibrary}
                        handleDeleteColor={deleteColor}
                      />
                    </TabsContent>
                    <TabsContent value="settings">
                      <div>
                        <div className="mt-4 mb-8">
                          <h2 className="scroll-m-20 pb-2 text-3xl font-semibold tracking-tight first:mt-0">
                            Settings
                          </h2>
                        </div>

                        <div className="mb-8">
                          <h4 className="scroll-m-20 text-xl font-semibold tracking-tight mb-4">
                            Pattern Information
                          </h4>
                          <div className="grid gap-3">
                            <Label htmlFor="pattern-title">Title</Label>
                            <Input
                              type="text"
                              id="pattern-title"
                              className="w-[480px]"
                              placeholder="Enter pattern title"
                              value={patternTitle}
                              onChange={(e) => setPatternTitle(e.target.value)}
                            />
                            {/* TODO: Add description field in the future */}
                          </div>
                        </div>

                        <div className="mb-8">
                          <h4 className="scroll-m-20 text-xl font-semibold tracking-tight mb-4">
                            Display Options
                          </h4>
                          <div className="flex items-start gap-3">
                            <Checkbox
                              id="show-shadows"
                              checked={useShadow}
                              onClick={() => setUseShadow(!useShadow)}
                            />
                            <div className="grid gap-2">
                              <Label htmlFor="show-shadows">Show shadows</Label>
                              <p className="text-muted-foreground text-sm">
                                Simulate a 3D effect in the band preview
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={25} minSize={8} maxSize={50}>
            <div className="flex h-full justify-center px-8 bg-gray-50 overflow-hidden">
              <div className="w-full h-full overflow-hidden">
                <Pattern
                  bandConfig={rows}
                  repeaterGroups={groupNonOverlappingRepeaters(validRepeaters)}
                  useMirror={useMirror}
                  useShadow={useShadow}
                  nRows={50}
                />
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      <AlertDialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear Pattern?</AlertDialogTitle>
            <AlertDialogDescription>
              This will reset your pattern to a blank design. This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmClearPattern}
              className="bg-red-600 hover:bg-red-700"
            >
              Clear Pattern
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default App;
