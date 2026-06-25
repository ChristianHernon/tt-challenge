import Chip, { type ChipProps } from "@mui/material/Chip";
import type { Status } from "../../api/types";

const STATUSES: Status[] = ["Normal", "Warning", "Critical"];

export const isStatus = (value: string): value is Status =>
  STATUSES.includes(value as Status);

type Props = {
  status: Status;
};

const color: Record<string, ChipProps["color"]> = {
  Normal: "success",
  Warning: "warning",
  Critical: "error",
};

export const StatusCell = ({ status }: Props) => {
  return <Chip label={status} color={color[status]} variant="outlined" />;
};
