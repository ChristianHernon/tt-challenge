/**
 * The only module in bulk-edit that touches Data Grid APIs whose names or
 * signatures differ between major versions. Porting to another version
 * should only require changing this file.
 *
 * | This file (v8+)                       | v7                              | v6                              |
 * |---------------------------------------|---------------------------------|---------------------------------|
 * | `gridRowSelectionCountSelector`       | `selectedGridRowsCountSelector` | `selectedGridRowsCountSelector` |
 * | `gridRowSelectionIdsSelector(apiRef)` | `selectedGridRowsSelector`      | `selectedGridRowsSelector`      |
 * | `valueSetter(value, row, col, api)`   | same as v8+                     | `valueSetter({ value, row })`   |
 */
import {
  gridRowSelectionCountSelector,
  gridRowSelectionIdsSelector,
  type GridApi,
  type GridColDef,
  type GridRowId,
  type GridValidRowModel,
} from "@mui/x-data-grid";
import type { RefObject } from "react";

export type GridApiRef = RefObject<GridApi | null>;

/** Reactive selected-row count, for use with `useGridSelector`. */
export const selectedRowCountSelector = gridRowSelectionCountSelector;

/**
 * Selected rows as concrete models. Resolves the v9 "exclude" selection
 * model (produced by select-all) to the rows it covers.
 */
export const getSelectedRows = <R extends GridValidRowModel>(
  apiRef: GridApiRef,
): R[] => {
  // Values can be undefined for ids whose rows are no longer in the grid.
  const selected = gridRowSelectionIdsSelector(apiRef) as Map<
    GridRowId,
    R | undefined
  >;
  return [...selected.values()].filter((row): row is R => row != null);
};

/** Writes `value` into `row` via the column's `valueSetter`, if it has one. */
export const setRowValue = <R extends GridValidRowModel>(
  colDef: GridColDef<R>,
  row: R,
  value: unknown,
  apiRef: GridApiRef,
): R =>
  colDef.valueSetter
    ? // Only called while the grid is mounted, so the ref is populated.
      colDef.valueSetter(value, row, colDef, apiRef as RefObject<GridApi>)
    : { ...row, [colDef.field]: value };
