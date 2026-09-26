import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import type { GridColDef, GridValidRowModel } from "@mui/x-data-grid";
import { useId, useMemo, useRef, useState } from "react";
import {
  getBulkEditOptions,
  getSelectOptions,
  hasOldValueToken,
  isTextColumn,
  isValidValue,
  OLD_VALUE_TOKEN,
  resolveTemplate,
} from "./bulk-edit-utils";

type Props<R extends GridValidRowModel> = {
  colDef: GridColDef<R>;
  rows: R[];
  onCancel: () => void;
  /** Receives a resolver for each row's new value. */
  onApply: (getValue: (row: R) => unknown) => void;
};

/** Prefill with the rows' shared value, if they all agree. */
const getInitialValue = <R extends GridValidRowModel>(
  field: string,
  rows: R[],
) => {
  const values = new Set(rows.map((row) => row[field]));
  const [only] = values;
  return values.size === 1 && only != null ? only : "";
};

export const BulkEditDialog = <R extends GridValidRowModel>({
  colDef,
  rows,
  onCancel,
  onApply,
}: Props<R>) => {
  const labelId = useId();
  const [value, setValue] = useState<unknown>(() =>
    getInitialValue(colDef.field, rows),
  );
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const options = useMemo(() => getSelectOptions(colDef), [colDef]);
  const bulkEdit = getBulkEditOptions(colDef);

  const headerName = colDef.headerName ?? colDef.field;
  const isText = isTextColumn(colDef);
  const isSupported = isText || colDef.type === "singleSelect";
  const templating = isText && bulkEdit.template !== false;
  const invalidMessage = bulkEdit.invalidMessage ?? `Invalid ${headerName}`;

  // Text columns treat the value as a template: `${oldValue}` is replaced
  // with each row's current (possibly already pending) value.
  const getValue = useMemo(() => {
    if (!templating || typeof value !== "string") return () => value;
    return (row: R) => resolveTemplate(value, row[colDef.field]);
  }, [colDef.field, templating, value]);

  const invalidCount = useMemo(
    () => rows.filter((row) => !isValidValue(colDef, getValue(row))).length,
    [colDef, getValue, rows],
  );
  const isValid = isSupported && invalidCount === 0;
  const usesOldValue =
    templating && typeof value === "string" && hasOldValueToken(value);

  const insertOldValueToken = () => {
    const text = typeof value === "string" ? value : "";
    const input = inputRef.current;
    const start = input?.selectionStart ?? text.length;
    const end = input?.selectionEnd ?? text.length;
    setValue(text.slice(0, start) + OLD_VALUE_TOKEN + text.slice(end));
    // Restore focus with the caret after the inserted token.
    requestAnimationFrame(() => {
      const caret = start + OLD_VALUE_TOKEN.length;
      input?.focus();
      input?.setSelectionRange(caret, caret);
    });
  };

  const textHelperText = !isValid
    ? usesOldValue
      ? `${invalidCount} of ${rows.length} rows: ${invalidMessage}`
      : invalidMessage
    : usesOldValue && rows.length > 0
      ? `e.g. “${rows[0][colDef.field] ?? ""}” → “${getValue(rows[0])}”`
      : " ";

  let editor: React.ReactNode;
  switch (colDef.type) {
    case "singleSelect":
      editor = (
        <FormControl fullWidth>
          <InputLabel id={labelId}>{headerName}</InputLabel>
          <Select
            labelId={labelId}
            label={headerName}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            autoFocus
          >
            {options.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      );
      break;
    case undefined:
    case "string":
      editor = (
        <Stack spacing={1}>
          <TextField
            label={headerName}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            inputRef={inputRef}
            error={!isValid}
            helperText={textHelperText}
            multiline={bulkEdit.multiline}
            minRows={bulkEdit.multiline ? 3 : undefined}
            fullWidth
            autoFocus
          />
          {templating && (
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              <Button
                size="small"
                variant="outlined"
                onClick={insertOldValueToken}
                // The token is case-sensitive, so don't let the button uppercase it.
                sx={{ textTransform: "none" }}
              >
                Insert <code style={{ marginLeft: 4 }}>{OLD_VALUE_TOKEN}</code>
              </Button>
              <Typography variant="caption" color="text.secondary">
                Replaced with each row’s current value.
              </Typography>
            </Stack>
          )}
        </Stack>
      );
      break;
    default:
      editor = (
        <Alert severity="warning">
          Bulk editing “{colDef.type}” columns is not supported.
        </Alert>
      );
  }

  return (
    <Dialog open onClose={onCancel} fullWidth maxWidth="sm">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (isValid) onApply(getValue);
        }}
      >
        <DialogTitle>
          Edit <em>{headerName}</em> for {rows.length}{" "}
          {rows.length === 1 ? "row" : "rows"}
        </DialogTitle>
        <DialogContent>
          {/* Top padding keeps the floating label clear of the title. */}
          <div style={{ paddingTop: 8 }}>{editor}</div>
        </DialogContent>
        <DialogActions>
          <Button onClick={onCancel}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={!isValid}>
            Apply
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
