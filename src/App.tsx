import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { ALL_COLORS, presetPatterns } from "@/assets/presets/presets";
import "./App.css";
import {
  BlendingModeIcon,
  BookmarkIcon,
  ChevronDownIcon,
  ColorWheelIcon,
  CopyIcon,
  Cross2Icon,
  DownloadIcon,
  EyeOpenIcon,
  FilePlusIcon,
  FileTextIcon,
  GearIcon,
  GitHubLogoIcon,
  GridIcon,
  HeartIcon,
  MagicWandIcon,
  MinusIcon,
  Pencil2Icon,
  PlusIcon,
  QuestionMarkCircledIcon,
  RulerSquareIcon,
  UploadIcon,
} from "@radix-ui/react-icons";
import { Eraser, Paintbrush, Pipette, Redo2, Undo2 } from "lucide-react";
import { Toaster, toast } from "sonner";
import KrokbragdPattern from "@/components/krokbragd-pattern";
import ColorSettings from "@/components/pages/colors";
import RandomGenerator from "@/components/pages/generator";
import Pattern from "@/components/pattern";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useHistory } from "@/hooks/useHistory";
import {
  getDefaultRows,
  getKrokbragdOwner,
  KROKBRAGD_MIN_WARPS,
} from "@/lib/defaults";
import {
  groupNonOverlappingRepeaters,
  mirrorData,
  repeaterLength,
} from "@/lib/inkle";
import { exportPdf } from "@/lib/pdf-export";
import {
  BandMode,
  Color,
  PatternRow,
  PresetPattern,
  Repeater,
} from "@/types/inkle";

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
  const [logoSrc] = useState(() => `/logo${Math.ceil(Math.random() * 6)}.png`);
  const [useMirror, setUseMirror] = useState(false);
  const [useShadow, setUseShadow] = useState(true);
  const [previewBackground, setPreviewBackground] = useState<
    "light-wood" | "medium-wood" | "dark-wood" | "plain"
  >("light-wood");

  const [bandMode, setBandMode] = useState<BandMode>("basic");
  const [pendingMode, setPendingMode] = useState<BandMode | null>(null);
  const [patternTitle, setPatternTitle] = useState("");
  const [creatorName, setCreatorName] = useState("");
  const [colors, setColors] = useState<Color[]>(ALL_COLORS);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState<Color>(
    ALL_COLORS.find((c) => c.owned && c.name === "Black") ??
      ALL_COLORS.find((c) => c.owned) ??
      ALL_COLORS[0],
  );
  const [activeTool, setActiveTool] = useState<
    "paint" | "erase" | "eyedropper"
  >("paint");
  const [paintPickerOpen, setPaintPickerOpen] = useState(false);
  const defaultPreset =
    [...presetPatterns].reverse().find((p) => !p.mode || p.mode === "basic") ??
    presetPatterns[0];
  const [rows, setRows] = useState<PatternRow[]>(defaultPreset.band);
  const [repeaters, setRepeaters] = useState<Repeater[]>(
    defaultPreset.repeaters,
  );
  const [pendingPreset, setPendingPreset] = useState<PresetPattern | null>(
    null,
  );
  const { saveSnapshot, undo, redo, canUndo, canRedo, clearHistory } =
    useHistory(rows, repeaters, setRows, setRepeaters);
  // Update document title when pattern title changes
  useEffect(() => {
    if (patternTitle.trim()) {
      document.title = `${patternTitle} - Inkle Pattern Designer`;
    } else {
      document.title = "Inkle Pattern Designer";
    }
  }, [patternTitle]);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((e.ctrlKey || e.metaKey) && e.key === "z" && e.shiftKey) {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo]);

  // add nulls to the end of each pattern row
  const addColor = useCallback(() => {
    saveSnapshot();
    setRows((oldRows) =>
      oldRows.map((row) => {
        if (bandMode === "krokbragd") {
          // Insert before the last 4 (right border) columns
          const insertAt = row.colors.length - 4;
          const colors = [...row.colors];
          colors.splice(insertAt, 0, null);
          return { ...row, colors };
        }
        return { ...row, colors: [...row.colors, null] };
      }),
    );
  }, [saveSnapshot, bandMode]);

  const removeColor = useCallback(() => {
    saveSnapshot();
    setRows((oldRows) =>
      oldRows.map((row) => {
        if (bandMode === "krokbragd") {
          // Remove from end of middle section (just before right border)
          const removeAt = row.colors.length - 5;
          const colors = [...row.colors];
          colors.splice(removeAt, 1);
          return { ...row, colors };
        }
        return { ...row, colors: row.colors.slice(0, -1) };
      }),
    );
  }, [saveSnapshot, bandMode]);

  const updateColor = useCallback(
    (rowIndex: number, colorIndex: number, color: Color | null) => {
      saveSnapshot();
      setRows((oldRows) =>
        oldRows.map((row, i) =>
          i === rowIndex
            ? {
                ...row,
                colors: row.colors.map((c, j) =>
                  j === colorIndex ? color : c,
                ),
              }
            : row,
        ),
      );
    },
    [saveSnapshot],
  );

  const addMirroredData = () => {
    saveSnapshot();
    setRows(mirrorData(rows));
    setUseMirror(false);
  };

  const isValidRepeater = (repeater: Repeater): boolean => {
    if (repeater.length <= 0) return false;
    if (repeater.start < 0) return false;
    if (repeater.start + repeater.length > rows[0].colors.length) return false;

    // Length must be a multiple of the number of rows
    const rowCount = bandMode === "krokbragd" ? 3 : 2;
    return repeater.length % rowCount === 0;
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
    saveSnapshot();
    setRows(updatedRows);
  };

  const applyPreset = (preset: PresetPattern) => {
    clearHistory();
    setBandMode(preset.mode ?? "basic");
    setRows(preset.band);
    setRepeaters(preset.repeaters);
    toast.success(`Loaded preset "${preset.name}"`);
  };

  const setPreset = (preset: PresetPattern) => {
    if (canUndo) {
      setPendingPreset(preset);
    } else {
      applyPreset(preset);
    }
  };

  const requestModeChange = (mode: BandMode) => {
    if (mode === bandMode) return;
    setPendingMode(mode);
  };

  const confirmModeChange = () => {
    if (!pendingMode) return;
    clearHistory();
    setBandMode(pendingMode);
    setRows(getDefaultRows(pendingMode));
    setRepeaters([]);
    setUseMirror(false);
    setPendingMode(null);
  };

  const confirmClearPattern = () => {
    clearHistory();
    setRows(getDefaultRows(bandMode));
    setRepeaters([]);
    setUseMirror(false);
    setClearDialogOpen(false);
  };

  const savePattern = () => {
    const patternData = {
      version: "1.1",
      mode: bandMode,
      title: patternTitle,
      creator: creatorName,
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

  const exportPatternPdf = async () => {
    try {
      await exportPdf({
        rows,
        repeaterGroups: groupNonOverlappingRepeaters(validRepeaters),
        useMirror,
        patternTitle,
        creatorName,
        footerLabel: bandMode === "krokbragd" ? "Krokbragd" : "Basic",
        mode: bandMode,
      });
      toast.success("PDF exported");
    } catch (error) {
      toast.error("Error exporting PDF: " + (error as Error).message);
    }
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
          toast.error("Invalid pattern file format");
          return;
        }

        // Restore all settings
        clearHistory();
        if (patternData.mode) setBandMode(patternData.mode);
        if (patternData.title) setPatternTitle(patternData.title);
        if (patternData.creator) setCreatorName(patternData.creator);
        if (patternData.colors) setColors(patternData.colors);
        if (patternData.band) setRows(patternData.band);
        if (patternData.repeaters) setRepeaters(patternData.repeaters);
        if (patternData.useMirror !== undefined)
          setUseMirror(patternData.useMirror);
        if (patternData.useShadow !== undefined)
          setUseShadow(patternData.useShadow);
        toast.success(`Loaded "${patternData.title || file.name}"`);
      } catch (error) {
        toast.error("Error loading pattern: " + (error as Error).message);
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
            Inkle Loom Pattern Designer
          </h1>
          <p className="text-muted-foreground text-base leading-relaxed">
            A free, beginner-friendly tool for designing inkle loom weaving
            patterns. Build your warping draft visually, assign any colors you
            like, and preview your band before you warp.
          </p>
        </div>

        {/* Preview image + Desktop notice — full-bleed muted background */}
        <div className="bg-muted px-6 pt-8 pb-8">
          <div className="mb-6">
            <img
              src="/preview-image.jpg"
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

        {/* FAQ */}
        <div className="px-6 pt-8 pb-8">
          <h2 className="text-lg font-semibold mb-2 text-foreground font-display">
            Frequently asked questions
          </h2>
          <Accordion type="single" collapsible>
            <AccordionItem value="what-is-inkle-loom">
              <AccordionTrigger>What is an inkle loom?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                An inkle loom is a simple frame loom used to weave narrow bands
                and straps. It's one of the easiest looms to learn on, making it
                popular with beginners. Inkle bands are woven by raising and
                lowering alternating warp threads to create colorful patterns.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="how-to-design">
              <AccordionTrigger>
                How do I design an inkle loom pattern?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                You can design inkle loom patterns using a warping draft — a
                grid that shows which color thread goes in each position. This
                tool lets you build drafts visually, assign colors, and preview
                how the finished band will look before you start warping your
                loom.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="is-free">
              <AccordionTrigger>Is this tool free?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                Yes, completely free. There are no accounts, subscriptions, or
                paywalls. You can save and load your patterns as files on your
                own computer.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="experience">
              <AccordionTrigger>Do I need weaving experience?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                No experience is needed. The designer includes a library of
                ready-made pattern templates you can start from, and you can
                generate random patterns to explore different designs.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="krokbragd">
              <AccordionTrigger>What is krokbragd?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                Krokbragd is a Scandinavian three-shaft weaving technique that
                produces bold, geometric patterns. It can be adapted for an
                inkle loom using three separate sheds and a single shuttle. This
                tool includes a dedicated krokbragd mode with draft editing,
                band preview, and PDF export.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="warping-draft">
              <AccordionTrigger>What is a warping draft?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                A warping draft is a chart that maps out the color and position
                of every warp thread on an inkle loom. Each row represents a
                pair of threads — one heddled and one unheddled. The draft
                determines the pattern that appears in the finished woven band.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        {/* PDF Resources */}
        <div className="bg-muted px-6 pt-8 pb-8">
          <h2 className="text-lg font-semibold mb-1 text-foreground font-display">
            Resources
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Printable documents for inkle weavers
          </p>
          <div className="grid grid-cols-2 gap-3 mb-4">
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
              <div className="px-3 py-2">
                <div className="font-medium text-sm">Standard Template</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Blank warping draft
                </div>
              </div>
            </a>
            <a
              href="/inkle-loom-pattern-krokbragd.pdf"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "inherit", textDecoration: "none" }}
              className="rounded-lg border bg-white overflow-hidden transition-shadow duration-200 hover:shadow-[0_0_8px_rgba(0,0,0,0.12)]"
            >
              <img
                src="/template-krokbragd-thumbnail.png"
                alt="Blank krokbragd pattern template"
                className="w-full"
                width="600"
                height="461"
                loading="lazy"
              />
              <div className="px-3 py-2">
                <div className="font-medium text-sm">Krokbragd Template</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  3-shaft blank draft
                </div>
              </div>
            </a>
          </div>
          <a
            href="/inkle-loom-plans.pdf"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "inherit", textDecoration: "none" }}
            className="block rounded-lg border bg-white overflow-hidden transition-shadow duration-200 hover:shadow-[0_0_8px_rgba(0,0,0,0.12)]"
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
              <GitHubLogoIcon className="h-4 w-4" />
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
              <HeartIcon className="h-4 w-4" />
              Support
            </a>
          </Button>
        </div>
      </div>

      {/* Desktop view */}
      <div className="hidden h-screen flex-col md:flex">
        <div className="flex flex-col items-start justify-between space-y-2 py-[11px] sm:flex-row sm:items-center sm:space-y-0 md:h-14 px-4">
          <div className="flex items-center gap-2">
            <img
              src={logoSrc}
              alt="Inkle logo"
              className="w-[30px] select-none pointer-events-none"
            />
            <h1 className="text-lg whitespace-nowrap font-light font-display">
              Inkle Loom Pattern Designer
            </h1>
          </div>
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
                  File
                  <ChevronDownIcon className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>New</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setClearDialogOpen(true)}>
                  <FilePlusIcon className="h-4 w-4" />
                  New Blank Pattern
                </DropdownMenuItem>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <GridIcon className="h-4 w-4" />
                    New from Template
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="w-auto whitespace-nowrap">
                    <DropdownMenuLabel className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                      Standard
                    </DropdownMenuLabel>
                    {presetPatterns
                      .filter((p) => !p.mode || p.mode === "basic")
                      .map((preset, idx) => (
                        <DropdownMenuItem
                          key={`basic-${idx}`}
                          onClick={() => setPreset(preset)}
                        >
                          {preset.name}
                        </DropdownMenuItem>
                      ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                      Krokbragd
                    </DropdownMenuLabel>
                    {presetPatterns
                      .filter((p) => p.mode === "krokbragd")
                      .map((preset, idx) => (
                        <DropdownMenuItem
                          key={`krok-${idx}`}
                          onClick={() => setPreset(preset)}
                        >
                          {preset.name}
                        </DropdownMenuItem>
                      ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>File</DropdownMenuLabel>
                <DropdownMenuItem onClick={savePattern}>
                  <DownloadIcon className="h-4 w-4" />
                  Save Pattern...
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                  <UploadIcon className="h-4 w-4" />
                  Open Pattern...
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportPatternPdf}>
                  <FileTextIcon className="h-4 w-4" />
                  Export PDF...
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost">
                  Resources
                  <ChevronDownIcon className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <FileTextIcon className="h-4 w-4" />
                    Blank Template PDFs
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem
                      onSelect={() =>
                        window.open(
                          "/inkle-loom-pattern-standard.pdf",
                          "_blank",
                          "noopener,noreferrer",
                        )
                      }
                    >
                      Standard
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() =>
                        window.open(
                          "/inkle-loom-pattern-krokbragd.pdf",
                          "_blank",
                          "noopener,noreferrer",
                        )
                      }
                    >
                      Krokbragd
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() =>
                    window.open(
                      "/inkle-loom-plans.pdf",
                      "_blank",
                      "noopener,noreferrer",
                    )
                  }
                >
                  <RulerSquareIcon className="h-4 w-4" />
                  Build an Inkle Loom
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost">
                  About
                  <ChevronDownIcon className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem
                  onSelect={() =>
                    window.open(
                      "https://github.com/gg314/inkle",
                      "_blank",
                      "noopener,noreferrer",
                    )
                  }
                >
                  <GitHubLogoIcon className="h-4 w-4" />
                  Source Code
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() =>
                    window.open(
                      "https://github.com/sponsors/gg314?frequency=one-time",
                      "_blank",
                      "noopener,noreferrer",
                    )
                  }
                >
                  <HeartIcon className="h-4 w-4" />
                  Support
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <Separator />

        <ResizablePanelGroup className="flex-1 rounded-lg md:min-w-[450px]">
          <ResizablePanel defaultSize="75%">
            <div className="p-10 overflow-y-auto h-full">
              <div>
                <div className="flex h-full justify-center">
                  <Tabs defaultValue="designer" style={{ width: "100%" }}>
                    <div>
                      <TabsList className="mb-4">
                        <TabsTrigger value="designer">
                          <Pencil2Icon className="h-4 w-4" />
                          Band Designer
                        </TabsTrigger>
                        {bandMode !== "krokbragd" && (
                          <TabsTrigger value="generator">
                            <MagicWandIcon className="h-4 w-4" />
                            Random Generator
                          </TabsTrigger>
                        )}
                        <TabsTrigger value="colors">
                          <BlendingModeIcon className="h-4 w-4" />
                          Available Colors
                        </TabsTrigger>
                        <TabsTrigger value="settings">
                          <GearIcon className="h-4 w-4" />
                          Settings
                        </TabsTrigger>
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

                          <div className="flex items-center gap-2 mb-4">
                            <ToggleGroup
                              type="single"
                              variant="outline"
                              value={activeTool}
                              onValueChange={(val) => {
                                if (val)
                                  setActiveTool(
                                    val as "paint" | "erase" | "eyedropper",
                                  );
                              }}
                            >
                              <ToggleGroupItem
                                value="paint"
                                className="relative"
                                title="Paint"
                              >
                                <Paintbrush className="relative z-10 h-4 w-4" />
                                <span
                                  className="absolute bottom-[7px] center-[2px] h-2 w-2 z-0"
                                  style={{
                                    backgroundColor: selectedColor.hex,
                                    clipPath:
                                      "polygon(100% 0%, 0% 0%, 50% 60%)",
                                  }}
                                />
                              </ToggleGroupItem>
                              <ToggleGroupItem value="erase" title="Eraser">
                                <Eraser className="h-4 w-4" />
                              </ToggleGroupItem>
                              <ToggleGroupItem
                                value="eyedropper"
                                title="Eyedropper"
                              >
                                <Pipette className="h-4 w-4" />
                              </ToggleGroupItem>
                            </ToggleGroup>
                            <Popover
                              open={paintPickerOpen}
                              onOpenChange={setPaintPickerOpen}
                            >
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className={`gap-2 ${activeTool !== "paint" ? "opacity-50" : ""}`}
                                >
                                  <div
                                    className="h-4 w-4 rounded-sm border border-gray-400 flex-shrink-0"
                                    style={{
                                      backgroundColor: selectedColor.hex,
                                    }}
                                  />
                                  {selectedColor.name}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-[200px] p-0">
                                <Command>
                                  <CommandInput placeholder="Search colors..." />
                                  <CommandList>
                                    <CommandEmpty>No results</CommandEmpty>
                                    <CommandGroup>
                                      {colors.map((c, idx) => {
                                        if (c.owned) {
                                          return (
                                            <CommandItem
                                              key={idx}
                                              value={c.name}
                                              onSelect={() => {
                                                setSelectedColor(c);
                                                setActiveTool("paint");
                                                setPaintPickerOpen(false);
                                              }}
                                            >
                                              <div
                                                className="h-4 w-4 rounded-sm border border-gray-300"
                                                style={{
                                                  backgroundColor: c.hex,
                                                }}
                                              />
                                              <span>{c.name}</span>
                                            </CommandItem>
                                          );
                                        }
                                      })}
                                    </CommandGroup>
                                  </CommandList>
                                </Command>
                              </PopoverContent>
                            </Popover>
                            <Separator orientation="vertical" className="h-6" />
                            <ToggleGroup
                              type="single"
                              variant="outline"
                              value=""
                            >
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <ToggleGroupItem
                                      value="undo"
                                      disabled={!canUndo}
                                      onClick={undo}
                                    >
                                      <Undo2 className="h-4 w-4" />
                                    </ToggleGroupItem>
                                  </TooltipTrigger>
                                  <TooltipContent>Undo (Ctrl+Z)</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <ToggleGroupItem
                                      value="redo"
                                      disabled={!canRedo}
                                      onClick={redo}
                                    >
                                      <Redo2 className="h-4 w-4" />
                                    </ToggleGroupItem>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    Redo (Ctrl+Shift+Z)
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </ToggleGroup>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-muted-foreground"
                                >
                                  <QuestionMarkCircledIcon className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-[480px]">
                                <DialogHeader>
                                  <DialogTitle>
                                    How to use the designer
                                  </DialogTitle>
                                  <DialogDescription>
                                    A quick guide to designing inkle loom
                                    patterns.
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-2 text-sm">
                                  <div>
                                    <p className="font-medium mb-1">Toolbar</p>
                                    <p className="text-muted-foreground">
                                      The toolbar has three tools.{" "}
                                      <strong>Paint</strong> fills cells with
                                      the selected color.{" "}
                                      <strong>Eraser</strong> clears cells.{" "}
                                      <strong>Eyedropper</strong> picks a color
                                      from an existing cell. Choose a color from
                                      the dropdown, then click cells in the
                                      grid. Use <strong>Ctrl+Z</strong> to undo
                                      and <strong>Ctrl+Shift+Z</strong> to redo.
                                    </p>
                                  </div>
                                  <div>
                                    <p className="font-medium mb-1">Warps</p>
                                    <p className="text-muted-foreground">
                                      Use <strong>Add warp</strong> and{" "}
                                      <strong>Remove warp</strong> below the
                                      draft to change the width of your band.
                                    </p>
                                  </div>
                                  <div>
                                    <p className="font-medium mb-1">
                                      Mirroring
                                    </p>
                                    <p className="text-muted-foreground">
                                      Check{" "}
                                      <strong>
                                        Mirror pattern horizontally
                                      </strong>{" "}
                                      to preview a symmetric design. Use{" "}
                                      <strong>Expand mirrored pattern</strong>{" "}
                                      to make it permanent.
                                    </p>
                                  </div>
                                  <div>
                                    <p className="font-medium mb-1">
                                      Repeaters
                                    </p>
                                    <p className="text-muted-foreground">
                                      Repeaters duplicate a section of your
                                      pattern. Set a start and end position,
                                      then choose how many times to repeat.
                                    </p>
                                  </div>
                                  <div>
                                    <p className="font-medium mb-1">
                                      Saving and loading
                                    </p>
                                    <p className="text-muted-foreground">
                                      Use the <strong>File</strong> menu to save
                                      your design, open a saved file, or start
                                      from a template.
                                    </p>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>

                          <ScrollArea className="mb-6 w-full whitespace-nowrap border rounded-md">
                            <div className="p-4">
                              {rows.map((row, rowIdx) => (
                                <div
                                  key={rowIdx}
                                  className="flex items-center h-8 flex-nowrap"
                                >
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <span className="weight-light p-2 text-muted-foreground w-8 flex-shrink-0 cursor-default">
                                          {row.label}
                                        </span>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        {bandMode === "krokbragd"
                                          ? row.label === "H1"
                                            ? "Unheddled (1)"
                                            : row.label === "U2"
                                              ? "Heddled (2)"
                                              : "Heddled (3)"
                                          : row.label === "H"
                                            ? "Heddled"
                                            : "Unheddled"}
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                  {row.colors.map((color, idx) => {
                                    const isCellDisabled =
                                      bandMode === "krokbragd"
                                        ? getKrokbragdOwner(
                                            idx,
                                            row.colors.length,
                                          ) !== rowIdx
                                        : (rowIdx + idx) % 2 === 1;
                                    return (
                                      <Fragment key={idx}>
                                        {color === null && isCellDisabled ? (
                                          BLANK_BUTTON
                                        ) : (
                                          <div
                                            className="rounded-none border border-gray-700 w-8 h-8 p-0 flex-shrink-0 cursor-pointer"
                                            style={
                                              color?.hex
                                                ? { backgroundColor: color.hex }
                                                : {
                                                    background:
                                                      "repeating-linear-gradient(-45deg, transparent, transparent 4px, rgba(0,0,0,.08) 4px, rgba(0,0,0,.08) 8px)",
                                                  }
                                            }
                                            onClick={() => {
                                              if (activeTool === "eyedropper") {
                                                if (color) {
                                                  setSelectedColor(color);
                                                }
                                              } else if (
                                                activeTool === "erase"
                                              ) {
                                                updateColor(rowIdx, idx, null);
                                              } else {
                                                updateColor(
                                                  rowIdx,
                                                  idx,
                                                  selectedColor,
                                                );
                                              }
                                            }}
                                          />
                                        )}
                                      </Fragment>
                                    );
                                  })}
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
                                        cursor =
                                          repeater.start + repeater.length;

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
                              <PlusIcon className="h-4 w-4" /> Add warp
                            </Button>
                            <Button
                              variant="outline"
                              onClick={removeColor}
                              disabled={
                                rows[0].colors.length <=
                                (bandMode === "krokbragd"
                                  ? KROKBRAGD_MIN_WARPS
                                  : 1)
                              }
                            >
                              <MinusIcon className="h-4 w-4" /> Remove warp
                            </Button>
                          </div>
                          {bandMode !== "krokbragd" && (
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="outline"
                                disabled={!useMirror}
                                onClick={addMirroredData}
                              >
                                <CopyIcon className="h-4 w-4" />
                                Expand mirrored pattern
                              </Button>
                            </div>
                          )}
                        </div>

                        {bandMode !== "krokbragd" && (
                          <>
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
                                  {'Tip: start and finish in the "H" row'}
                                </p>
                              </div>
                            </div>
                          </>
                        )}

                        <h4 className="scroll-m-20 text-xl font-semibold tracking-tight mb-4 mt-8">
                          Repeaters
                        </h4>
                        <p className="text-sm text-muted-foreground mb-4">
                          Repeaters duplicate a section of your pattern. The
                          length must be a multiple of{" "}
                          {bandMode === "krokbragd"
                            ? "3 (matching H1, U2, U3 rows)"
                            : "2 (equal H and U threads)"}
                          .
                        </p>

                        <div className="mb-4">
                          {repeaters.length === 0 ? (
                            <p className="text-sm text-muted-foreground mb-4 italic opacity-70">
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
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => {
                                                saveSnapshot();
                                                const newRepeaters =
                                                  repeaters.filter(
                                                    (_, i) => i !== idx,
                                                  );
                                                setRepeaters(newRepeaters);
                                              }}
                                              className="text-muted-foreground hover:text-red-600"
                                            >
                                              <Cross2Icon className="h-4 w-4" />
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            Delete repeater
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
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
                                          saveSnapshot();
                                          const newRepeaters = [...repeaters];
                                          newRepeaters[idx].start =
                                            parseInt(e.target.value) || 0;
                                          setRepeaters(newRepeaters);
                                        }}
                                        className="h-8 w-16"
                                      />
                                      <Label
                                        htmlFor={`repeater-${idx}-length`}
                                        className="text-sm font-normal whitespace-nowrap"
                                      >
                                        Length:
                                      </Label>
                                      <Input
                                        id={`repeater-${idx}-length`}
                                        type="number"
                                        min={1}
                                        max={rows[0].colors.length}
                                        value={repeater.length}
                                        onChange={(e) => {
                                          saveSnapshot();
                                          const newRepeaters = [...repeaters];
                                          newRepeaters[idx].length =
                                            parseInt(e.target.value) || 1;
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
                                          saveSnapshot();
                                          const newRepeaters = [...repeaters];
                                          newRepeaters[idx].count =
                                            parseInt(e.target.value) || 1;
                                          setRepeaters(newRepeaters);
                                        }}
                                        className="h-8 w-16"
                                      />
                                    </div>
                                    {!isValid && (
                                      <p className="text-xs text-red-600 pb-2">
                                        {repeater.length <= 0
                                          ? "Length must be positive"
                                          : repeater.start < 0 ||
                                              repeater.start + repeater.length >
                                                rows[0].colors.length
                                            ? "Repeater extends beyond pattern. Decrease Start or Length"
                                            : `Length must be a multiple of ${bandMode === "krokbragd" ? 3 : 2} (currently ${repeater.length})`}
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
                              saveSnapshot();
                              setRepeaters([
                                ...repeaters,
                                { start: 0, length: 2, count: 2 },
                              ]);
                            }}
                          >
                            <PlusIcon className="h-4 w-4" /> Add repeater
                          </Button>
                        </div>
                      </div>
                    </TabsContent>
                    <TabsContent value="generator">
                      <RandomGenerator
                        colors={colors}
                        setDataFn={setRows}
                        setRepeatersFn={setRepeaters}
                        saveSnapshot={saveSnapshot}
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
                            Band Mode
                          </h4>
                          <div className="grid gap-3">
                            <Label htmlFor="band-mode">Mode</Label>
                            <Select
                              value={bandMode}
                              onValueChange={(value: BandMode) =>
                                requestModeChange(value)
                              }
                            >
                              <SelectTrigger
                                className="w-[240px]"
                                id="band-mode"
                              >
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="basic">Basic</SelectItem>
                                <SelectItem value="krokbragd">
                                  Krokbragd
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
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
                            <Label htmlFor="creator-name">Creator</Label>
                            <Input
                              type="text"
                              id="creator-name"
                              className="w-[480px]"
                              placeholder="Enter creator name"
                              value={creatorName}
                              onChange={(e) => setCreatorName(e.target.value)}
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
                          <div className="flex items-center gap-3 mt-4">
                            <Label htmlFor="preview-background">
                              Background
                            </Label>
                            <Select
                              value={previewBackground}
                              onValueChange={(v) =>
                                setPreviewBackground(
                                  v as typeof previewBackground,
                                )
                              }
                            >
                              <SelectTrigger
                                id="preview-background"
                                className="w-[160px]"
                              >
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="light-wood">
                                  Light Wood
                                </SelectItem>
                                <SelectItem value="medium-wood">
                                  Medium Wood
                                </SelectItem>
                                <SelectItem value="dark-wood">
                                  Dark Wood
                                </SelectItem>
                                <SelectItem value="plain">Plain</SelectItem>
                              </SelectContent>
                            </Select>
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
          <ResizablePanel defaultSize="8%" minSize="6%" maxSize="50%">
            <div
              className={`h-full px-8 overflow-hidden ${previewBackground === "plain" ? "bg-gray-50" : ""}`}
              style={
                previewBackground !== "plain"
                  ? {
                      backgroundImage: `url(/${previewBackground}.jpg)`,
                      backgroundRepeat: "repeat",
                      backgroundPosition: "right",
                    }
                  : undefined
              }
            >
              {bandMode === "krokbragd" ? (
                <KrokbragdPattern
                  bandConfig={rows}
                  repeaterGroups={groupNonOverlappingRepeaters(validRepeaters)}
                  useShadow={useShadow}
                />
              ) : (
                <Pattern
                  bandConfig={rows}
                  repeaterGroups={groupNonOverlappingRepeaters(validRepeaters)}
                  useMirror={useMirror}
                  useShadow={useShadow}
                />
              )}
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

      <AlertDialog
        open={pendingMode !== null}
        onOpenChange={(open) => {
          if (!open) setPendingMode(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change Band Mode?</AlertDialogTitle>
            <AlertDialogDescription>
              Switching to {pendingMode === "krokbragd" ? "Krokbragd" : "Basic"}{" "}
              mode will reset your current pattern. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmModeChange}
              className="bg-red-600 hover:bg-red-700"
            >
              Change Mode
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog
        open={pendingPreset !== null}
        onOpenChange={(open) => {
          if (!open) setPendingPreset(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Load Preset?</AlertDialogTitle>
            <AlertDialogDescription>
              Loading &ldquo;{pendingPreset?.name}&rdquo; will replace your
              current pattern. Your undo history will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingPreset) applyPreset(pendingPreset);
                setPendingPreset(null);
              }}
            >
              Load Preset
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Toaster position="bottom-right" />
    </>
  );
}

export default App;
