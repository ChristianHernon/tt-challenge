import type {
  GridApi,
  GridSingleSelectColDef,
  GridColDef,
} from "@mui/x-data-grid";
import type { RefObject } from "react";

/**
 * Shallow compare of two objects. Returns only the keys of `next` whose
 * values differ from `prev` (by `Object.is`).
 */
export const diff = <T extends object>(prev: T, next: T): Partial<T> => {
  const patch: Partial<T> = {};

  for (const key of Object.keys(next) as (keyof T)[]) {
    if (!Object.is(prev[key], next[key])) {
      patch[key] = next[key];
    }
  }

  return patch;
};

export const isEmptyPatch = (patch: object) => Object.keys(patch).length === 0;

/** Names must be non-empty once trimmed. */
export const isValidName = (value: unknown) =>
  typeof value === "string" && value.trim().length > 0;

export type SelectOption = { value: string | number; label: string };

/**
 * Normalizes a singleSelect column's `valueOptions` (array or function,
 * primitive or `{ value, label }` entries) into `{ value, label }` pairs.
 */
export const getSelectOptions = (colDef: GridColDef): SelectOption[] => {
  if (colDef.type !== "singleSelect") return [];

  const { valueOptions, getOptionValue, getOptionLabel } =
    colDef as GridSingleSelectColDef;
  const options =
    typeof valueOptions === "function"
      ? valueOptions({ field: colDef.field })
      : (valueOptions ?? []);

  return options.map((option) =>
    typeof option === "object"
      ? {
          value: getOptionValue?.(option) ?? option.value,
          label: getOptionLabel?.(option) ?? option.label,
        }
      : { value: option, label: String(option) },
  );
};

/** Per-field validation beyond what the column type implies. */
const FIELD_VALIDATORS: Partial<Record<string, (value: unknown) => boolean>> = {
  name: isValidName,
};

export const isValidBulkValue = (colDef: GridColDef, value: unknown) => {
  if (
    colDef.type === "singleSelect" &&
    !getSelectOptions(colDef).some((option) => option.value === value)
  ) {
    return false;
  }

  return FIELD_VALIDATORS[colDef.field]?.(value) ?? true;
};

/**
 * Builds one patch per row that actually changes when `value` is written to
 * `colDef`'s field, honouring the column's `valueSetter`.
 */
export const buildBulkPatches = <R extends { id: number }>(
  rows: R[],
  colDef: GridColDef<R>,
  value: unknown,
  apiRef: RefObject<GridApi | null>,
): [number, Partial<R>][] =>
  rows.flatMap((row) => {
    const next: R = colDef.valueSetter
      ? // Only called while the grid is mounted, so the ref is populated.
        colDef.valueSetter(value, row, colDef, apiRef as RefObject<GridApi>)
      : { ...row, [colDef.field]: value };
    const patch = diff(row, next);
    return isEmptyPatch(patch) ? [] : [[row.id, patch] as [number, Partial<R>]];
  });
