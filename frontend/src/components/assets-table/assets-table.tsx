import Stack from "@mui/material/Stack";
import { DataGrid } from "@mui/x-data-grid/DataGrid";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useAssetsQueryOptions } from "../../api/use-assets-query-options";
import { useHierarchyQueryOptions } from "../../api/use-hierarchy-query-options";
import { useSearchAssetsQueryOptions } from "../../api/use-search-assets-query-options";
import { AssetsTableFilters } from "./assets-table-filters";
import { useAssetFilters } from "./use-asset-filters";
import { useAssetsTableColumns } from "./use-assets-table-columns";

export const AssetsTable = () => {
  const columns = useAssetsTableColumns();
  const { debouncedParams, hasFilters, setDebouncedParams } = useAssetFilters();
  const { data: assetsData } = useQuery(useAssetsQueryOptions());
  const { data: searchData } = useQuery(
    useSearchAssetsQueryOptions(debouncedParams),
  );
  const { data: hierarchyData } = useQuery(useHierarchyQueryOptions());

  const rows = useMemo(
    () => (hasFilters ? (searchData?.assets ?? []) : (assetsData ?? [])),
    [hasFilters, searchData, assetsData],
  );

  return (
    <Stack spacing={4}>
      <AssetsTableFilters
        onParamsChange={setDebouncedParams}
        hierarchyPaths={hierarchyData?.paths ?? []}
      />
      <DataGrid
        columns={columns}
        rows={rows}
        getDetailPanelContent={(params) => (
          <span>{params.row.description}</span>
        )}
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
