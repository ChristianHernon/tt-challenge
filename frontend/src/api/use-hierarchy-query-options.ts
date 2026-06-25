import { queryOptions } from "@tanstack/react-query";
import type { HierarchyPath } from "./types";

export interface HierarchyResponse {
  paths: HierarchyPath[];
}

export const useHierarchyQueryOptions = () =>
  queryOptions({
    queryKey: ["assets", "hierarchy"],
    queryFn: async (): Promise<HierarchyResponse> => {
      const res = await fetch("http://localhost:5001/api/assets/hierarchy");
      return res.json();
    },
  });
