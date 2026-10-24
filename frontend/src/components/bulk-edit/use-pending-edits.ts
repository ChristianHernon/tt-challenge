import type { GridRowId, GridValidRowModel } from "@mui/x-data-grid";
import { useCallback, useState } from "react";
import { isEmptyPatch } from "./bulk-edit-utils";

export type PendingEdits<R> = Map<GridRowId, Partial<R>>;

/**
 * Local overlay of staged, unsaved edits keyed by row id. Only the changed
 * fields are stored so fresh server data for other fields is never masked,
 * and edits survive refetches that replace the server rows.
 */
export const usePendingEdits = <R extends GridValidRowModel>(
  getRowId: (row: R) => GridRowId,
) => {
  const [pendingEdits, setPendingEdits] = useState<PendingEdits<R>>(
    () => new Map(),
  );

  const applyPatches = useCallback(
    (patches: Iterable<[GridRowId, Partial<R>]>) => {
      setPendingEdits((prev) => {
        let next: PendingEdits<R> | null = null;

        for (const [id, patch] of patches) {
          if (isEmptyPatch(patch)) continue;
          next ??= new Map(prev);
          next.set(id, { ...next.get(id), ...patch });
        }

        return next ?? prev;
      });
    },
    [],
  );

  const applyPatch = useCallback(
    (id: GridRowId, patch: Partial<R>) => applyPatches([[id, patch]]),
    [applyPatches],
  );

  const discardAll = useCallback(() => setPendingEdits(new Map()), []);

  const mergeRows = useCallback(
    (rows: R[]) =>
      pendingEdits.size === 0
        ? rows
        : rows.map((row) => {
            const patch = pendingEdits.get(getRowId(row));
            return patch ? { ...row, ...patch } : row;
          }),
    [getRowId, pendingEdits],
  );

  return { pendingEdits, applyPatch, applyPatches, discardAll, mergeRows };
};
