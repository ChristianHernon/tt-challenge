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
import TextField from "@mui/material/TextField";
import type { GridColDef } from "@mui/x-data-grid";
import { useId, useMemo, useState } from "react";
import type { AssetsItem } from "../../api/types";
import { getSelectOptions, isValidBulkValue } from "./bulk-edit-utils";

/** Text fields that get a multiline editor. */
const MULTILINE_FIELDS = new Set(["description"]);

type Props = {
  colDef: GridColDef<AssetsItem>;
  rows: AssetsItem[];
  onCancel: () => void;
  onApply: (value: unknown) => void;
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
  const options = useMemo(() => getSelectOptions(colDef), [colDef]);

  const headerName = colDef.headerName ?? colDef.field;
  const multiline = MULTILINE_FIELDS.has(colDef.field);
  const isSupported =
    colDef.type === "singleSelect" ||
    colDef.type === undefined ||
    colDef.type === "string";
  const isValid = isSupported && isValidBulkValue(colDef, value);

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
        <TextField
          label={headerName}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          error={!isValid}
          helperText={isValid ? " " : `${headerName} cannot be empty`}
          multiline={multiline}
          minRows={multiline ? 3 : undefined}
          fullWidth
          autoFocus
        />
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
          if (isValid) onApply(value);
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
