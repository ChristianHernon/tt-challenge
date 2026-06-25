import type { HierarchyPath } from "../../api/types";

export const locationFilterOptions = (
  options: HierarchyPath[],
  { inputValue }: { inputValue: string },
) => {
  const tokens = inputValue
    .split(">")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);

  if (tokens.length === 0) return options;

  return options.filter((option) => {
    const segments = option.path.split(" > ").map((s) => s.toLowerCase());
    let tokenIdx = 0;
    for (const segment of segments) {
      if (segment.includes(tokens[tokenIdx])) {
        tokenIdx++;
        if (tokenIdx === tokens.length) return true;
      }
    }
    return false;
  });
};
