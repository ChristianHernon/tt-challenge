import { useCallback, useEffect, useRef, useState } from "react";
import type { SearchAssetsParams } from "../../api/use-search-assets-query-options";

const DEBOUNCE_MS = 500;

export const useAssetFilters = () => {
  const [debouncedParams, setDebouncedParams] = useState<SearchAssetsParams>(
    {},
  );
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const setParams = useCallback((params: SearchAssetsParams) => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(
      () => setDebouncedParams(params),
      DEBOUNCE_MS,
    );
  }, []);

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  return { debouncedParams, setParams };
};
