import { Stack } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { useMemo } from "react";
import type { AssetsItem } from "../../api/types";
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
        field: "parentId",
        headerName: "Parent",
        type: "number",
      },
      {
        field: "className",
        headerName: "Class",
        flex: 1,
        renderCell: ({ row }) => (
          <span title={row.classDescription}>{row.className}</span>
        ),
      },
    ],
    [],
  );

  return columns;
};
