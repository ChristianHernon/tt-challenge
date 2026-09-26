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
import type { GridColDef } from "@mui/x-data-grid";
import { useId, useMemo, useRef, useState } from "react";
import type { AssetsItem } from "../../api/types";
import {
  getSelectOptions,
  hasOldValueToken,
  isValidBulkValue,
  OLD_VALUE_TOKEN,
  resolveTemplate,
} from "./bulk-edit-utils";

/** Text fields that get a multiline editor. */
const MULTILINE_FIELDS = new Set(["description"]);

type Props = {
  colDef: GridColDef<AssetsItem>;
  rows: AssetsItem[];
  onCancel: () => void;
  /** Receives a resolver for each row's new value. */
  onApply: (getValue: (row: AssetsItem) => unknown) => void;
};

/** Prefill with the rows' shared value, if they all agree. */
const getInitialValue = (
  colDef: GridColDef<AssetsItem>,
  rows: AssetsItem[],
) => {
  const values = new Set(
    rows.map((row) => row[colDef.field as keyof AssetsItem]),
  );
  const [only] = values;
  return values.size === 1 && only != null ? only : "";
};

export const BulkEditDialog = ({ colDef, rows, onCancel, onApply }: Props) => {
  const labelId = useId();
  const [value, setValue] = useState<unknown>(() =>
    getInitialValue(colDef, rows),
  );
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const options = useMemo(() => getSelectOptions(colDef), [colDef]);

  const headerName = colDef.headerName ?? colDef.field;
  const multiline = MULTILINE_FIELDS.has(colDef.field);
  const isText = colDef.type === undefined || colDef.type === "string";
  const isSupported = isText || colDef.type === "singleSelect";

  // Plain-string columns treat the value as a template: `${oldValue}` is
  // replaced with each row's current (possibly already pending) value.
  const getValue = useMemo(() => {
    if (!isText || typeof value !== "string") return () => value;
    const field = colDef.field as keyof AssetsItem;
    return (row: AssetsItem) => resolveTemplate(value, row[field]);
  }, [colDef.field, isText, value]);

  const invalidCount = useMemo(
    () => rows.filter((row) => !isValidBulkValue(colDef, getValue(row))).length,
    [colDef, getValue, rows],
  );
  const isValid = isSupported && invalidCount === 0;
  const usesOldValue =
    isText && typeof value === "string" && hasOldValueToken(value);

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
      ? `${invalidCount} of ${rows.length} rows would get an empty ${headerName}`
      : `${headerName} cannot be empty`
    : usesOldValue && rows.length > 0
      ? `e.g. “${rows[0][colDef.field as keyof AssetsItem] ?? ""}” → “${getValue(rows[0])}”`
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
            multiline={multiline}
            minRows={multiline ? 3 : undefined}
            fullWidth
            autoFocus
          />
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
