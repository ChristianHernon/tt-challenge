import { useState } from "react";
import type { SearchAssetsParams } from "../../api/use-search-assets-query-options";

export const useAssetFilters = () => {
  const [debouncedParams, setDebouncedParams] = useState<SearchAssetsParams>({});
  const hasFilters = Object.values(debouncedParams).some((v) => v !== undefined);
  return { debouncedParams, hasFilters, setDebouncedParams };
};
