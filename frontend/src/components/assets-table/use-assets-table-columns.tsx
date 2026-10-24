import Stack from "@mui/material/Stack";
import { useMemo } from "react";
import type { AssetsItem } from "../../api/types";
import {
  isNonBlankString,
  type BulkEditColDef,
} from "../bulk-edit/bulk-edit-utils";
import { AncestorBreadcrumbCell } from "./ancestor-breadcrumb-cell";
import { IconCell, isIconKey } from "./icon-cell";
import { StatusCell } from "./status-cell";
import { STATUSES, isStatus } from "./status-utils";

export const useAssetsTableColumns = () => {
  const columns: BulkEditColDef<AssetsItem>[] = useMemo(
    () => [
      {
        field: "friendlyId",
        headerName: "ID",
        width: 150,
      },
      {
        field: "name",
        headerName: "Name",
        flex: 1,
        maxWidth: 200,
        editable: true,
        bulkEdit: {
          validate: isNonBlankString,
          invalidMessage: "Name cannot be empty",
        },
        // Names are stored trimmed; applies to inline and bulk edits alike.
        valueSetter: (value: string, row) => ({ ...row, name: value.trim() }),
        renderCell: ({ row }) => {
          const { icon, name } = row;

          return isIconKey(icon) ? (
            <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
              <IconCell icon={icon} />
              <span>{name}</span>
            </Stack>
          ) : (
            <span>{name}</span>
          );
        },
      },
      {
        field: "ancestors",
        headerName: "Location",
        flex: 2,
        sortable: false,
        filterable: false,
        renderCell: ({ row }) => (
          <AncestorBreadcrumbCell ancestors={row.ancestors} />
        ),
      },
      {
        field: "description",
        headerName: "Description",
        flex: 1,
        editable: true,
        bulkEdit: { multiline: true },
      },
      {
        field: "status",
        headerName: "Status",
        width: 120,
        type: "singleSelect",
        valueOptions: STATUSES,
        editable: true,
        renderCell: ({ row }) => {
          return isStatus(row.status) ? (
            <StatusCell status={row.status} />
          ) : null;
        },
      },
      {
        field: "className",
        headerName: "Class",
        width: 200,
        renderCell: ({ row }) => (
          <span title={row.classDescription ?? "N/A"}>
            {row.className ?? "-"}
          </span>
        ),
      },
    ],
    [],
  );

  return columns;
};
