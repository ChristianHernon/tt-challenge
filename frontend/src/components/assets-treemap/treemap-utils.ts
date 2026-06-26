import type { AssetsItem } from "../../api/types";

export interface TreeNode {
  id: number;
  name: string;
  icon: string;
  status?: string;
  description?: string;
  friendlyId?: string;
  className?: string;
  children: TreeNode[];
}

export function buildTree(assets: AssetsItem[]): TreeNode | null {
  if (!assets.length) return null;

  const map = new Map<number, TreeNode>();
  for (const a of assets) {
    map.set(a.id, {
      id: a.id,
      name: a.name,
      icon: a.icon,
      status: a.status,
      description: a.description,
      friendlyId: a.friendlyId,
      className: a.className || undefined,
      children: [],
    });
  }

  let root: TreeNode | null = null;
  for (const a of assets) {
    if (a.parentId === null) {
      root = map.get(a.id)!;
    } else {
      const parent = map.get(a.parentId);
      if (parent) parent.children.push(map.get(a.id)!);
    }
  }

  return root;
}

export function buildFilteredTree(assets: AssetsItem[]): TreeNode | null {
  if (!assets.length) return null;

  const map = new Map<number, TreeNode>();

  for (const a of assets) {
    for (const anc of a.ancestors) {
      if (!map.has(anc.id)) {
        map.set(anc.id, {
          id: anc.id,
          name: anc.name,
          icon: anc.icon,
          children: [],
        });
      }
    }
    if (!map.has(a.id)) {
      map.set(a.id, {
        id: a.id,
        name: a.name,
        icon: a.icon,
        status: a.status,
        description: a.description,
        friendlyId: a.friendlyId,
        className: a.className || undefined,
        children: [],
      });
    }
  }

  for (const a of assets) {
    const ancIds = a.ancestors.map((x) => x.id);
    for (let i = 0; i < ancIds.length - 1; i++) {
      const p = map.get(ancIds[i])!;
      const c = map.get(ancIds[i + 1])!;
      if (!p.children.some((x) => x.id === c.id)) p.children.push(c);
    }
    if (ancIds.length > 0) {
      const p = map.get(ancIds[ancIds.length - 1])!;
      const n = map.get(a.id)!;
      if (!p.children.some((x) => x.id === n.id)) p.children.push(n);
    }
  }

  const childIds = new Set<number>();
  for (const n of map.values()) {
    for (const c of n.children) childIds.add(c.id);
  }
  for (const [id, node] of map) {
    if (!childIds.has(id)) return node;
  }

  return null;
}
