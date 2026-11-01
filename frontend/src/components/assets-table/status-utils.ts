import type { Status } from "../../api/types";

export const STATUSES: Status[] = ["Normal", "Warning", "Critical"];

export const isStatus = (value: string): value is Status =>
  STATUSES.includes(value as Status);
