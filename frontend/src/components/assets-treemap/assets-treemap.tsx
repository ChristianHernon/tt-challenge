import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import type { AssetsItem } from "../../api/types";
import { useAssetsQueryOptions } from "../../api/use-assets-query-options";
import { useHierarchyQueryOptions } from "../../api/use-hierarchy-query-options";
import { useSearchAssetsQueryOptions } from "../../api/use-search-assets-query-options";
import { AssetsTableFilters } from "../assets-table/assets-table-filters";
import { useAssetFilters } from "../assets-table/use-asset-filters";
import { buildFilteredTree, buildTree } from "./treemap-utils";
import { TreemapVisualization } from "./treemap-visualization";

export const AssetsTreemap = () => {
  const { debouncedParams, hasFilters, setParams } = useAssetFilters();
  const { data: assetsData, isLoading } = useQuery(useAssetsQueryOptions());
  const { data: searchData, isFetching: isSearchFetching } = useQuery(
    useSearchAssetsQueryOptions(debouncedParams),
  );
  const { data: hierarchyData } = useQuery(useHierarchyQueryOptions());

  const assets = useMemo(
    () =>
      (hasFilters ? (searchData?.assets ?? []) : (assetsData ?? [])) as AssetsItem[],
    [hasFilters, searchData, assetsData],
  );

  const tree = useMemo(
    () => (hasFilters ? buildFilteredTree(assets) : buildTree(assets)),
    [hasFilters, assets],
  );

  const loading = isLoading || (hasFilters && isSearchFetching && !searchData);

  return (
    <Stack spacing={3}>
      <AssetsTableFilters
        onParamsChange={setParams}
        hierarchyPaths={hierarchyData?.paths ?? []}
      />
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      ) : !tree ? (
        <Typography color="text.secondary" sx={{ textAlign: "center", py: 8 }}>
          No assets to display
        </Typography>
      ) : (
        <TreemapVisualization root={tree} />
      )}
    </Stack>
  );
};
