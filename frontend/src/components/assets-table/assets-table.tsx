import Stack from "@mui/material/Stack";
import { DataGrid } from "@mui/x-data-grid/DataGrid";
import { useQuery } from "@tanstack/react-query";
import { useHierarchyQueryOptions } from "../../api/use-hierarchy-query-options";
import { useSearchAssetsQueryOptions } from "../../api/use-search-assets-query-options";
import { useBulkEdit } from "../bulk-edit/use-bulk-edit";
import { AssetsTableFilters } from "./assets-table-filters";
import { useAssetFilters } from "./use-asset-filters";
import { useAssetsTableColumns } from "./use-assets-table-columns";

export const AssetsTable = () => {
  const columns = useAssetsTableColumns();
  const { debouncedParams, setParams } = useAssetFilters();
  const { data: searchData, isFetching } = useQuery(
    useSearchAssetsQueryOptions(debouncedParams),
  );
  const { data: hierarchyData } = useQuery(useHierarchyQueryOptions());

  const { gridProps, pendingBar, dialog } = useBulkEdit({
    rows: searchData?.assets,
  });

  return (
    <Stack spacing={4}>
      <AssetsTableFilters
        onParamsChange={setParams}
        hierarchyPaths={hierarchyData?.paths ?? []}
      />
      {pendingBar}
      <DataGrid
        {...gridProps}
        columns={columns}
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
      {dialog}
    </Stack>
  );
};
