import type {
  GridColDef,
  GridRowId,
  GridSingleSelectColDef,
  GridValidRowModel,
} from "@mui/x-data-grid";
import { setRowValue, type GridApiRef } from "./grid-compat";

/**
 * Per-column bulk-edit options. Declared on the column definition itself so
 * each table configures its own columns; nothing here is keyed by field name.
 */
export type BulkEditOptions = {
  /** Return `false` to reject a value (bulk and inline edits). */
  validate?: (value: unknown) => boolean;
  /** Message shown when `validate` rejects a value. */
  invalidMessage?: string;
  /** Use a multiline text editor. */
  multiline?: boolean;
  /** Text columns accept `${oldValue}` templates unless this is `false`. */
  template?: boolean;
};

/**
 * A column definition with optional bulk-edit options. Assignable to
 * `GridColDef`, and the grid keeps the extra key on its resolved columns.
 */
export type BulkEditColDef<R extends GridValidRowModel = GridValidRowModel> =
  GridColDef<R> & { bulkEdit?: BulkEditOptions };

export const getBulkEditOptions = (colDef: GridColDef): BulkEditOptions =>
  (colDef as BulkEditColDef).bulkEdit ?? {};

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

/** Non-empty once trimmed. Handy as a `bulkEdit.validate`. */
export const isNonBlankString = (value: unknown) =>
  typeof value === "string" && value.trim().length > 0;

export const isTextColumn = (colDef: GridColDef) =>
  colDef.type === undefined || colDef.type === "string";

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

/** Checks the column type's constraints, then the column's own `validate`. */
export const isValidValue = (colDef: GridColDef, value: unknown) => {
  if (
    colDef.type === "singleSelect" &&
    !getSelectOptions(colDef).some((option) => option.value === value)
  ) {
    return false;
  }

  return getBulkEditOptions(colDef).validate?.(value) ?? true;
};

/** Placeholder in a bulk text value that is replaced with each row's current value. */
export const OLD_VALUE_TOKEN = "${oldValue}";

export const hasOldValueToken = (template: string) =>
  template.includes(OLD_VALUE_TOKEN);

/**
 * Replaces every `${oldValue}` in `template` with `oldValue`. Uses split/join
 * rather than `replaceAll`, whose string replacement would interpret `$&`,
 * `$1`, etc. inside the old value.
 */
export const resolveTemplate = (template: string, oldValue: unknown) =>
  template
    .split(OLD_VALUE_TOKEN)
    .join(oldValue == null ? "" : String(oldValue));

/**
 * Builds one patch per row that actually changes when `getValue(row)` is
 * written to `colDef`'s field, honouring the column's `valueSetter`.
 */
export const buildBulkPatches = <R extends GridValidRowModel>(
  rows: R[],
  colDef: GridColDef<R>,
  getValue: (row: R) => unknown,
  getRowId: (row: R) => GridRowId,
  apiRef: GridApiRef,
): [GridRowId, Partial<R>][] =>
  rows.flatMap((row) => {
    const patch = diff(row, setRowValue(colDef, row, getValue(row), apiRef));
    return isEmptyPatch(patch)
      ? []
      : [[getRowId(row), patch] as [GridRowId, Partial<R>]];
  });
