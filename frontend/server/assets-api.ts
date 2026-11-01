// In-memory port of the read endpoints in backend/server.js, for Cloudflare
// Pages Functions (no node:sqlite there). Data is the snapshot written by
// `npm run export` in backend/. Keep the behavior in sync with server.js.
import rawAssets from "./assets.json";

type AssetRow = {
  id: number;
  name: string;
  description: string | null;
  friendlyId: string;
  parentId: number | null;
  statusId: number;
  status: string;
  icon: string | null;
  classId: number | null;
  className: string | null;
  classDescription: string | null;
};

type Ancestor = { id: number; name: string; icon: string | null };

const assets = rawAssets as AssetRow[];
const byId = new Map(assets.map((a) => [a.id, a]));

/** Root-first ancestors per asset, matching the recursive CTE in server.js. */
const ancestorMap = new Map<number, Ancestor[]>();
for (const asset of assets) {
  const ancestors: Ancestor[] = [];
  let parent = asset.parentId != null ? byId.get(asset.parentId) : undefined;
  while (parent) {
    ancestors.unshift({ id: parent.id, name: parent.name, icon: parent.icon });
    parent = parent.parentId != null ? byId.get(parent.parentId) : undefined;
  }
  if (ancestors.length) ancestorMap.set(asset.id, ancestors);
}

const descendantMap = new Map<number, Set<number>>();
for (const [leafId, ancestors] of ancestorMap) {
  for (const anc of ancestors) {
    let set = descendantMap.get(anc.id);
    if (!set) descendantMap.set(anc.id, (set = new Set()));
    set.add(leafId);
  }
}

export const hierarchyPaths = (() => {
  const parentIds = new Set(assets.map((a) => a.parentId));
  const nodes = assets.filter((a) => parentIds.has(a.id));

  const getPath = (node: AssetRow) => {
    const parts: string[] = [];
    let current: AssetRow | undefined = node;
    while (current) {
      if (current.icon !== "enterprise") parts.unshift(current.name);
      current =
        current.parentId != null ? byId.get(current.parentId) : undefined;
    }
    return parts.join(" > ");
  };

  return nodes
    .filter((n) => n.icon !== "enterprise")
    .map((n) => ({ id: n.id, path: getPath(n) }))
    .sort((a, b) => a.path.localeCompare(b.path));
})();

/**
 * SQLite `LIKE`: `%` and `_` are wildcards, ASCII case-insensitive, and the
 * pattern must match the whole value.
 */
const likeToRegExp = (pattern: string) =>
  new RegExp(
    "^" +
      pattern
        .split("")
        .map((ch) =>
          ch === "%"
            ? "[\\s\\S]*"
            : ch === "_"
              ? "[\\s\\S]"
              : ch.replace(/[.*+?^${}()|[\]\\/-]/g, "\\$&"),
        )
        .join("") +
      "$",
    "i",
  );

/** Same `*` handling as server.js: a leading `*` wins over a trailing one. */
const toLikePattern = (term: string) => {
  if (term.startsWith("*")) return term.replace(/^\*/, "%");
  if (term.endsWith("*")) return term.replace(/\*$/, "%");
  return `%${term}%`;
};

export type SearchBody = {
  name?: unknown;
  excludeNames?: unknown;
  parentId?: unknown;
  statusId?: unknown;
  classId?: unknown;
  ancestorId?: unknown;
};

// SQLite compares the INTEGER column with numeric affinity, so "5" == 5.
const sameId = (column: number | null, value: unknown) =>
  column != null && column === Number(value);

export const searchAssets = (body: SearchBody) => {
  const filters: ((a: AssetRow) => boolean)[] = [];

  if (typeof body.name === "string" && body.name) {
    const re = likeToRegExp(toLikePattern(body.name));
    filters.push((a) => re.test(a.name));
  }

  if (Array.isArray(body.excludeNames)) {
    for (const term of body.excludeNames) {
      const re = likeToRegExp(toLikePattern(String(term)));
      filters.push((a) => !re.test(a.name));
    }
  }

  if (body.parentId) filters.push((a) => sameId(a.parentId, body.parentId));
  if (body.statusId) filters.push((a) => sameId(a.statusId, body.statusId));
  if (body.classId) filters.push((a) => sameId(a.classId, body.classId));

  if (body.ancestorId) {
    const ancestorId = parseInt(String(body.ancestorId), 10);
    const descendants = !isNaN(ancestorId)
      ? descendantMap.get(ancestorId)
      : undefined;
    filters.push((a) => descendants?.has(a.id) ?? false);
  }

  const result = assets
    .filter((a) => filters.every((f) => f(a)))
    // Same columns as the SELECT in server.js (statusId is filter-only).
    .map((a) => ({
      id: a.id,
      name: a.name,
      description: a.description,
      friendlyId: a.friendlyId,
      parentId: a.parentId,
      status: a.status,
      icon: a.icon,
      classId: a.classId,
      className: a.className,
      classDescription: a.classDescription,
      ancestors: ancestorMap.get(a.id) ?? [],
    }));

  return { count: result.length, assets: result };
};
