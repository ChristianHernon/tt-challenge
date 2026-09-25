import { useCallback, useState } from "react";
import type { AssetsItem } from "../../api/types";
import { isEmptyPatch } from "./bulk-edit-utils";

export type AssetPatch = Partial<AssetsItem>;
export type PendingEdits = Map<number, AssetPatch>;

/**
 * Local overlay of staged, unsaved edits keyed by row id. Only the changed
 * fields are stored so fresh server data for other fields is never masked,
 * and edits survive refetches that replace the server rows.
 */
export const usePendingEdits = () => {
  const [pendingEdits, setPendingEdits] = useState<PendingEdits>(
    () => new Map(),
  );

  const applyPatches = useCallback(
    (patches: Iterable<[number, AssetPatch]>) => {
      setPendingEdits((prev) => {
        let next: PendingEdits | null = null;

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
    (id: number, patch: AssetPatch) => applyPatches([[id, patch]]),
    [applyPatches],
  );

  const discardAll = useCallback(() => setPendingEdits(new Map()), []);

  const mergeRows = useCallback(
    (rows: AssetsItem[]) =>
      pendingEdits.size === 0
        ? rows
        : rows.map((row) => {
            const patch = pendingEdits.get(row.id);
            return patch ? { ...row, ...patch } : row;
          }),
    [pendingEdits],
  );

  return { pendingEdits, applyPatch, applyPatches, discardAll, mergeRows };
};
