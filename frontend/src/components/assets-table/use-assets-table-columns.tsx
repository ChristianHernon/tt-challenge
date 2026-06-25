import Stack from "@mui/material/Stack";
import type { GridColDef } from "@mui/x-data-grid";
import { useMemo } from "react";
import type { AssetsItem } from "../../api/types";
import { AncestorBreadcrumbCell } from "./ancestor-breadcrumb-cell";
import { IconCell, isIconKey } from "./icon-cell";
import { StatusCell, isStatus } from "./status-cell";

export const useAssetsTableColumns = () => {
  const columns: GridColDef<AssetsItem>[] = useMemo(
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
      },
      {
        field: "status",
        headerName: "Status",
        width: 120,
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
