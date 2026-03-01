import { useCallback, useRef } from "react";
import { PatternRow, Repeater } from "@/types/inkle";

type Snapshot = {
  rows: PatternRow[];
  repeaters: Repeater[];
};

const MAX_HISTORY = 50;

function deepCopySnapshot(rows: PatternRow[], repeaters: Repeater[]): Snapshot {
  return {
    rows: rows.map((r) => ({ ...r, colors: [...r.colors] })),
    repeaters: repeaters.map((r) => ({ ...r })),
  };
}

export function useHistory(
  rows: PatternRow[],
  repeaters: Repeater[],
  setRows: React.Dispatch<React.SetStateAction<PatternRow[]>>,
  setRepeaters: React.Dispatch<React.SetStateAction<Repeater[]>>,
) {
  const undoStack = useRef<Snapshot[]>([]);
  const redoStack = useRef<Snapshot[]>([]);

  const saveSnapshot = useCallback(() => {
    undoStack.current.push(deepCopySnapshot(rows, repeaters));
    if (undoStack.current.length > MAX_HISTORY) {
      undoStack.current.shift();
    }
    redoStack.current = [];
  }, [rows, repeaters]);

  const undo = useCallback(() => {
    const prev = undoStack.current.pop();
    if (!prev) return;
    redoStack.current.push(deepCopySnapshot(rows, repeaters));
    setRows(prev.rows);
    setRepeaters(prev.repeaters);
  }, [rows, repeaters, setRows, setRepeaters]);

  const redo = useCallback(() => {
    const next = redoStack.current.pop();
    if (!next) return;
    undoStack.current.push(deepCopySnapshot(rows, repeaters));
    setRows(next.rows);
    setRepeaters(next.repeaters);
  }, [rows, repeaters, setRows, setRepeaters]);

  const canUndo = undoStack.current.length > 0;
  const canRedo = redoStack.current.length > 0;

  return { saveSnapshot, undo, redo, canUndo, canRedo };
}
