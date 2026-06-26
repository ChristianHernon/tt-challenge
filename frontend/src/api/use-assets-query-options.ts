import { queryOptions } from "@tanstack/react-query";
import type { Assets } from "./types";

export const getAssetsQueryKey = () => ["assets"];

export const useAssetsQueryOptions = () => {
  return queryOptions({
    queryKey: getAssetsQueryKey(),
    queryFn: async (): Promise<Assets> => {
      const res = await fetch("http://localhost:5001/api/assets");
      return res.json();
    },
  });
};
