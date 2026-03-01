// ColorBox.tsx

import { PlusIcon, SwitchIcon, TrashIcon } from "@radix-ui/react-icons";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sortColors } from "@/lib/inkle";
import { cn } from "@/lib/utils";
import { Color } from "@/types/inkle";

type ColorSettingsProps = {
  colors: Color[];
  handleToggleColor: (color: Color) => void;
  handleToggleAll: () => void;
  handleAddColor: (name: string, hex: string) => void;
  handleDeleteColor: (color: Color) => void;
};

const ColorSettings = ({
  colors,
  handleToggleColor,
  handleToggleAll,
  handleAddColor,
  handleDeleteColor,
}: ColorSettingsProps) => {
  const [open, setOpen] = useState(false);
  const [newColorName, setNewColorName] = useState("");
  const [newColorHex, setNewColorHex] = useState("#000000");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [colorToDelete, setColorToDelete] = useState<Color | null>(null);

  const handleSubmit = () => {
    if (newColorName.trim() && newColorHex) {
      handleAddColor(newColorName.trim(), newColorHex);
      setNewColorName("");
      setNewColorHex("#000000");
      setOpen(false);
    }
  };

  const confirmDelete = () => {
    if (colorToDelete) {
      handleDeleteColor(colorToDelete);
      setColorToDelete(null);
      setDeleteDialogOpen(false);
    }
  };

  return (
    <>
      <div>
        <div className="mt-4 mb-4">
          <h2 className="scroll-m-20 pb-2 text-3xl font-semibold tracking-tight first:mt-0">
            Available settings
          </h2>
          <p>
            Click a color to toggle its availability. Only "available" colors
            will be shown in the band designer.
          </p>
        </div>
        <div className="mb-8">
          <Button variant="outline" className="mr-2" onClick={handleToggleAll}>
            <SwitchIcon className="mr-2 h-4 w-4" /> Toggle availability for all
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <PlusIcon className="mr-2 h-4 w-4" /> Add a color
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add a new color</DialogTitle>
                <DialogDescription>
                  Enter a name and hex code for your new color.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="name"
                    value={newColorName}
                    onChange={(e) => setNewColorName(e.target.value)}
                    className="col-span-3"
                    placeholder="e.g. Sky Blue"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="hex" className="text-right">
                    Hex Code
                  </Label>
                  <div className="col-span-3 flex gap-2">
                    <Input
                      id="hex"
                      type="color"
                      value={newColorHex}
                      onChange={(e) => setNewColorHex(e.target.value)}
                      className="w-16 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={newColorHex}
                      onChange={(e) => setNewColorHex(e.target.value)}
                      className="flex-1"
                      placeholder="#000000"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" onClick={handleSubmit}>
                  Add Color
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {sortColors(colors).map((color: Color, index: number) => (
            <div
              key={index}
              className={cn(
                "flex items-center my-1 group relative",
                color.owned ? "opacity-100" : "opacity-30",
              )}
            >
              <div
                className="flex items-center cursor-pointer flex-1"
                onClick={() => handleToggleColor(color)}
              >
                <div
                  style={{ backgroundColor: color.hex }}
                  className="mx-1 h-6 w-6 rounded-sm border border-gray-600 flex-shrink-0"
                ></div>
                <div className="mx-1 flex-1 min-w-0">
                  <div className="font-semibold truncate">{color.name}</div>
                  <div className="text-xs opacity-50">{color.hex}</div>
                </div>
              </div>
              {color.isCustom && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    setColorToDelete(color);
                    setDeleteDialogOpen(true);
                  }}
                >
                  <TrashIcon className="h-4 w-4 text-red-600" />
                </Button>
              )}
            </div>
          ))}
        </div>
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Custom Color</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{colorToDelete?.name}"? This
                will remove it from your color library and replace it with empty
                spaces in any patterns where it's used. This action cannot be
                undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setColorToDelete(null)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </>
  );
};

export default ColorSettings;
