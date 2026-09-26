import { alpha, type Theme } from "@mui/material/styles";
import {
  useGridApiRef,
  type DataGridProps,
  type GridColDef,
  type GridRowId,
  type GridValidRowModel,
} from "@mui/x-data-grid";
import { useCallback, useMemo, useState } from "react";
import { BulkEditColumnMenu } from "./bulk-edit-column-menu";
import { BulkEditDialog } from "./bulk-edit-dialog";
import { buildBulkPatches, diff, isValidValue } from "./bulk-edit-utils";
import { getSelectedRows } from "./grid-compat";
import { PendingEditsBar } from "./pending-edits-bar";
import { usePendingEdits } from "./use-pending-edits";

const PENDING_CELL_CLASS = "cell--pending";

const defaultGetRowId = (row: GridValidRowModel): GridRowId => row.id;

const pendingCellSx = (theme: Theme) => ({
  [`& .${PENDING_CELL_CLASS}`]: {
    boxShadow: `inset 3px 0 0 ${theme.palette.warning.main}`,
    backgroundColor: alpha(theme.palette.warning.main, 0.12),
  },
});

type Options<R extends GridValidRowModel> = {
  /** Server rows; pending edits are overlaid on these. */
  rows: R[] | undefined;
  /** Must be stable. Defaults to `row.id`. */
  getRowId?: (row: R) => GridRowId;
};

type BulkEditState<R extends GridValidRowModel> = {
  colDef: GridColDef<R>;
  rows: R[];
};

/**
 * Bulk and inline editing over a local pending-edits overlay, for any
 * DataGrid. Mark columns `editable: true` (optionally with `bulkEdit`
 * options, see `BulkEditColDef`), spread `gridProps` onto the grid, and
 * render `pendingBar` and `dialog`.
 *
 * `gridProps` sets `apiRef`, `rows`, `getRowId`, `checkboxSelection`,
 * `processRowUpdate`, `getCellClassName`, `sx`, `slots` and `slotProps`;
 * merge by hand if the grid needs its own values for any of these.
 */
export const useBulkEdit = <R extends GridValidRowModel>({
  rows: serverRows,
  getRowId = defaultGetRowId as (row: R) => GridRowId,
}: Options<R>) => {
  const apiRef = useGridApiRef();
  const { pendingEdits, applyPatch, applyPatches, discardAll, mergeRows } =
    usePendingEdits<R>(getRowId);

  // Snapshot of the column and selected rows, taken when the dialog opens.
  const [bulkEdit, setBulkEdit] = useState<BulkEditState<R> | null>(null);

  const rows = useMemo(
    () => mergeRows(serverRows ?? []),
    [mergeRows, serverRows],
  );

  const openBulkEdit = useCallback(
    (field: string) => {
      if (!apiRef.current) return;
      setBulkEdit({
        colDef: apiRef.current.getColumn(field),
        rows: getSelectedRows<R>(apiRef),
      });
    },
    [apiRef],
  );

  const applyBulkEdit = (getValue: (row: R) => unknown) => {
    if (!bulkEdit) return;
    applyPatches(
      buildBulkPatches(
        bulkEdit.rows,
        bulkEdit.colDef,
        getValue,
        getRowId,
        apiRef,
      ),
    );
    setBulkEdit(null);
  };

  const processRowUpdate = (newRow: R, oldRow: R) => {
    const patch = diff(oldRow, newRow);
    // Same per-column validation as the dialog; an invalid edit reverts.
    for (const field of Object.keys(patch)) {
      const colDef = apiRef.current?.getColumn(field);
      if (colDef && !isValidValue(colDef, newRow[field])) return oldRow;
    }
    applyPatch(getRowId(newRow), patch);
    return newRow;
  };

  const getCellClassName: DataGridProps<R>["getCellClassName"] = ({
    id,
    field,
    colDef,
  }) => {
    const patch = pendingEdits.get(id);
    return colDef.editable && patch && field in patch ? PENDING_CELL_CLASS : "";
  };

  return {
    rows,
    pendingEdits,
    discardAll,
    gridProps: {
      apiRef,
      rows,
      getRowId,
      checkboxSelection: true,
      processRowUpdate,
      // Grid-level rather than per-column cellClassName so `columns` keeps a
      // stable reference (new column defs reset widths and order).
      getCellClassName,
      sx: pendingCellSx,
      slots: { columnMenu: BulkEditColumnMenu },
      slotProps: { columnMenu: { onBulkEdit: openBulkEdit } },
    } satisfies Partial<DataGridProps<R>>,
    pendingBar: (
      <PendingEditsBar count={pendingEdits.size} onDiscard={discardAll} />
    ),
    dialog: bulkEdit && (
      <BulkEditDialog
        colDef={bulkEdit.colDef}
        rows={bulkEdit.rows}
        onCancel={() => setBulkEdit(null)}
        onApply={applyBulkEdit}
      />
    ),
  };
};
