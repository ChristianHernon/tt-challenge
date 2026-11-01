import type { HierarchyPath } from "../../api/types";

/**
 * Parses `a > b c > d` into parts, each a list of lowercase words. Empty
 * parts (e.g. a trailing `>` while typing) are dropped.
 */
const parseQuery = (inputValue: string) =>
  inputValue
    .split(">")
    .map((part) => part.trim().toLowerCase().split(/\s+/).filter(Boolean))
    .filter((words) => words.length > 0);

/** A part matches a level when the level's name contains every word in it. */
const matchesLevel = (level: string, words: string[]) =>
  words.every((word) => level.includes(word));

/**
 * Autocomplete filter for hierarchy paths. Parts separated by `>` must match
 * levels in order, skipping any levels in between. Within a part, words can
 * appear anywhere in the level's name, so `kibble 01` matches
 * "Kibble Line 01". Case-insensitive.
 */
export const locationFilterOptions = (
  options: HierarchyPath[],
  { inputValue }: { inputValue: string },
) => {
  const parts = parseQuery(inputValue);
  if (parts.length === 0) return options;

  return options.filter((option) => {
    const levels = option.path.split(" > ").map((s) => s.toLowerCase());
    let partIdx = 0;
    // Greedy is enough: matching a part at the earliest possible level
    // leaves the most levels for the parts after it.
    for (const level of levels) {
      if (matchesLevel(level, parts[partIdx])) {
        partIdx++;
        if (partIdx === parts.length) return true;
      }
    }
    return false;
  });
};
