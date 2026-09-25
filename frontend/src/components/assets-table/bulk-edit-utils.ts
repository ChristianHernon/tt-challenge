/**
 * Shallow compare of two objects. Returns only the keys of `next` whose
 * values differ from `prev` (by `Object.is`).
 */
export const diff = <T extends object>(prev: T, next: T): Partial<T> => {
  const patch: Partial<T> = {};

  for (const key of Object.keys(next) as (keyof T)[]) {
    if (!Object.is(prev[key], next[key])) {
      patch[key] = next[key];
    }
  }

  return patch;
};

export const isEmptyPatch = (patch: object) => Object.keys(patch).length === 0;

/** Names must be non-empty once trimmed. */
export const isValidName = (value: unknown) =>
  typeof value === "string" && value.trim().length > 0;
