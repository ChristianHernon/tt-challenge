import { queryOptions } from "@tanstack/react-query";

export const getClassesQueryKey = () => ["assets", "classes"];

export const useClassesQueryOptions = () => {
  return queryOptions({
    queryKey: getClassesQueryKey(),
    queryFn: async () => fetch("localhost:5001/api/assets/classes"),
  });
};
