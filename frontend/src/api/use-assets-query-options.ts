import { queryOptions } from "@tanstack/react-query";

export const getAssetsQueryKey = () => ["assets"];

export const useAssetsQueryOptions = () => {
  return queryOptions({
    queryKey: getAssetsQueryKey(),
    queryFn: async () => {
      const res = await fetch("http://localhost:5001/api/assets");
      return res.json();
    },
  });
};
