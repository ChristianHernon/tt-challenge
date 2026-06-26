import { queryOptions } from "@tanstack/react-query";
import type { AssetsItem } from "./types";

export interface SearchAssetsParams {
  name?: string;
  excludeNames?: string[];
  parentId?: number;
  statusId?: number;
  classId?: number;
  ancestorId?: number;
}

export interface SearchAssetsResponse {
  count: number;
  assets: AssetsItem[];
}

export const getSearchAssetsQueryKey = (params: SearchAssetsParams) => [
  "assets",
  "search",
  params,
];

export const useSearchAssetsQueryOptions = (params: SearchAssetsParams) => {
  return queryOptions({
    queryKey: getSearchAssetsQueryKey(params),
    queryFn: async (): Promise<SearchAssetsResponse> => {
      const res = await fetch("http://localhost:5001/api/assets/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      return res.json();
    },
  });
};
