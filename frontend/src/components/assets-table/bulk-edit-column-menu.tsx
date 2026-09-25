import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import MenuItem from "@mui/material/MenuItem";
import {
  GridColumnMenu,
  gridRowSelectionCountSelector,
  useGridApiContext,
  useGridSelector,
  type ColumnMenuPropsOverrides,
  type GridColumnMenuItemProps,
  type GridColumnMenuProps,
} from "@mui/x-data-grid";
import { PencilLine } from "lucide-react";

declare module "@mui/x-data-grid" {
  interface ColumnMenuPropsOverrides {
    onBulkEdit: (field: string) => void;
  }
}

const BulkEditMenuItem = ({
  colDef,
  onClick,
  onBulkEdit,
}: GridColumnMenuItemProps & ColumnMenuPropsOverrides) => {
  const apiRef = useGridApiContext();
  const count = useGridSelector(apiRef, gridRowSelectionCountSelector);

  if (!colDef.editable) return null;

  return (
    <MenuItem
      disabled={count === 0}
      onClick={(event) => {
        onBulkEdit(colDef.field);
        // Closes the column menu.
        onClick(event);
      }}
    >
      <ListItemIcon>
        <PencilLine size={18} />
      </ListItemIcon>
      <ListItemText>
        Bulk edit {count} {count === 1 ? "row" : "rows"}…
      </ListItemText>
    </MenuItem>
  );
};

export const BulkEditColumnMenu = ({
  onBulkEdit,
  ...props
}: GridColumnMenuProps & ColumnMenuPropsOverrides) => (
  <GridColumnMenu
    {...props}
    slots={{ columnMenuBulkEditItem: BulkEditMenuItem }}
    slotProps={{ columnMenuBulkEditItem: { displayOrder: 5, onBulkEdit } }}
  />
);
