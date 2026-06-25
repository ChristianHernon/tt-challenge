import { useQuery } from "@tanstack/react-query";

// ideally defined by api client
export const ICONS = {
  enterprise: "enterprise",
  site: "site",
  area: "area",
  line: "line",
  equipment: "equipment",
  sensor: "sensor",
  subassembly: "subassembly",
  component: "component",
} as const;

export const useIcons = () => {
  return useQuery<typeof ICONS>({
    queryKey: ["icons"],
    queryFn: async () => {
      const res = await fetch("http://localhost:5001/api/assets/icons");
      return res.json();
    },
  });
};
