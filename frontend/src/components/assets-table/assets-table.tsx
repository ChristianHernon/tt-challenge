import Stack from "@mui/material/Stack";
import { DataGrid } from "@mui/x-data-grid/DataGrid";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useHierarchyQueryOptions } from "../../api/use-hierarchy-query-options";
import { useSearchAssetsQueryOptions } from "../../api/use-search-assets-query-options";
import { AssetsTableFilters } from "./assets-table-filters";
import { useAssetFilters } from "./use-asset-filters";
import { useAssetsTableColumns } from "./use-assets-table-columns";
import { usePendingEdits } from "./use-pending-edits";

export const AssetsTable = () => {
  const columns = useAssetsTableColumns();
  const { debouncedParams, setParams } = useAssetFilters();
  const { data: searchData, isFetching } = useQuery(
    useSearchAssetsQueryOptions(debouncedParams),
  );
  const { data: hierarchyData } = useQuery(useHierarchyQueryOptions());

  const { mergeRows } = usePendingEdits();

  const serverRows = searchData?.assets;
  const rows = useMemo(
    () => mergeRows(serverRows ?? []),
    [mergeRows, serverRows],
  );

  return (
    <Stack spacing={4}>
      <AssetsTableFilters
        onParamsChange={setParams}
        hierarchyPaths={hierarchyData?.paths ?? []}
      />
      <DataGrid
        columns={columns}
        rows={rows}
        getDetailPanelContent={(params) => (
          <span>{params.row.description}</span>
        )}
        loading={isFetching}
        initialState={{
          columns: {
            columnVisibilityModel: {
              description: false,
            },
          },
        }}
        showToolbar
      />
    </Stack>
  );
};
