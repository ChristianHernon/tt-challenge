export interface AncestorItem {
  id: number;
  name: string;
  icon: string;
}

export interface AssetsItem {
  id: number;
  name: string;
  description: string;
  friendlyId: string;
  parentId: null | number;
  status: string;
  icon: string;
  classId: null | number;
  className: string;
  classDescription: string;
  ancestors: AncestorItem[];
}

export type Assets = AssetsItem[];

export type Status = "Normal" | "Warning" | "Critical";

export interface HierarchyPath {
  id: number;
  path: string;
}
