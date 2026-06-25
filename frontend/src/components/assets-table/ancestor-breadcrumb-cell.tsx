import { Box, Stack } from "@mui/material";
import type { AncestorItem } from "../../api/types";
import { ICONS } from "../../api/use-icons";

const ARROW_SIZE = 10;

const LEVEL_COLORS: Record<string, string> = {
  [ICONS.enterprise]: "#5e35b1",
  [ICONS.site]: "#1565c0",
  [ICONS.area]: "#0277bd",
  [ICONS.line]: "#00695c",
  [ICONS.equipment]: "#2e7d32",
  [ICONS.subassembly]: "#e65100",
  [ICONS.component]: "#c62828",
  [ICONS.sensor]: "#6a1b9a",
};

type SegmentProps = {
  ancestor: AncestorItem;
  isFirst: boolean;
  isLast: boolean;
  zIndex: number;
};

const ChevronSegment = ({
  ancestor,
  isFirst,
  isLast,
  zIndex,
}: SegmentProps) => (
  <Box
    sx={{
      position: "relative",
      zIndex,
      display: "inline-flex",
      alignItems: "center",
      gap: 0.5,
      height: 26,
      pl: isFirst ? 1.5 : `${ARROW_SIZE + 10}px`,
      pr: `${ARROW_SIZE + 6}px`,
      bgcolor: LEVEL_COLORS[ancestor.icon] ?? "#546e7a",
      clipPath: isFirst
        ? `polygon(0 0, calc(100% - ${ARROW_SIZE}px) 0, 100% 50%, calc(100% - ${ARROW_SIZE}px) 100%, 0 100%)`
        : `polygon(0 0, calc(100% - ${ARROW_SIZE}px) 0, 100% 50%, calc(100% - ${ARROW_SIZE}px) 100%, 0 100%, ${ARROW_SIZE}px 50%)`,
      ml: isFirst ? 0 : `-${ARROW_SIZE}px`,
      color: "white",
      flexShrink: 0,
      filter: isLast ? undefined : "drop-shadow(3px 0 4px rgba(0,0,0,0.45))",
    }}
  >
    <span style={{ fontSize: 12, whiteSpace: "nowrap", lineHeight: 1 }}>
      {ancestor.name}
    </span>
  </Box>
);

type Props = { ancestors: AncestorItem[] };

export const AncestorBreadcrumbCell = ({ ancestors }: Props) => {
  const visible = ancestors.filter((a) => a.icon !== ICONS.enterprise);

  if (visible.length === 0)
    return <span style={{ color: "#9e9e9e", fontSize: 14 }}>—</span>;

  return (
    <Stack
      direction="row"
      sx={{ alignItems: "center", overflow: "hidden", height: 1 }}
    >
      {visible.map((ancestor, index) => (
        <ChevronSegment
          key={ancestor.id}
          ancestor={ancestor}
          isFirst={index === 0}
          isLast={index === visible.length - 1}
          zIndex={visible.length - index}
        />
      ))}
    </Stack>
  );
};
