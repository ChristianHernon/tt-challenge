import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Slider from "@mui/material/Slider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { hierarchy, treemap, treemapSquarify } from "d3";
import type { MouseEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { TreeNode } from "./treemap-utils";

const LEVEL_COLORS: Record<string, string> = {
  enterprise: "#5e35b1",
  site: "#1565c0",
  area: "#0277bd",
  line: "#00695c",
  equipment: "#2e7d32",
  subassembly: "#e65100",
  component: "#c62828",
  sensor: "#6a1b9a",
};

const STATUS_COLORS: Record<string, string> = {
  Normal: "#388e3c",
  Warning: "#f57c00",
  Critical: "#d32f2f",
};

const HEIGHT = 640;

const DEFAULT_DEPTH = 4;

function pruneTree(node: TreeNode, maxDepth: number, depth = 0): TreeNode {
  if (depth >= maxDepth || node.children.length === 0) {
    return { ...node, children: [] };
  }
  return {
    ...node,
    children: node.children.map((c) => pruneTree(c, maxDepth, depth + 1)),
  };
}

function findPathIds(node: TreeNode, targetId: number): number[] | null {
  if (node.id === targetId) return [];
  for (const child of node.children) {
    const sub = findPathIds(child, targetId);
    if (sub !== null) return [child.id, ...sub];
  }
  return null;
}

interface TooltipState {
  x: number;
  y: number;
  node: TreeNode;
}

export const TreemapVisualization = ({ root }: { root: TreeNode }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(800);
  const [zoomPathIds, setZoomPathIds] = useState<number[]>([]);
  const [maxDepth, setMaxDepth] = useState(DEFAULT_DEPTH);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  useEffect(() => {
    setZoomPathIds([]);
  }, [root]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver((entries) => {
      setWidth(entries[0].contentRect.width);
    });
    obs.observe(el);
    setWidth(el.clientWidth);
    return () => obs.disconnect();
  }, []);

  const { displayRoot, breadcrumb } = useMemo(() => {
    let current = root;
    const crumb: TreeNode[] = [root];
    for (const id of zoomPathIds) {
      const child = current.children.find((c) => c.id === id);
      if (!child) break;
      current = child;
      crumb.push(child);
    }
    return { displayRoot: current, breadcrumb: crumb };
  }, [root, zoomPathIds]);

  const trueLeafIds = useMemo(() => {
    const ids = new Set<number>();
    const collect = (node: TreeNode) => {
      if (node.children.length === 0) ids.add(node.id);
      else node.children.forEach(collect);
    };
    collect(displayRoot);
    return ids;
  }, [displayRoot]);

  const tiles = useMemo(() => {
    if (width === 0) return [];

    const pruned = pruneTree(displayRoot, maxDepth);

    const h = hierarchy<TreeNode>(pruned)
      .sum((d) => (d.children.length === 0 ? 1 : 0))
      .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

    const rootNode = treemap<TreeNode>()
      .size([width, HEIGHT])
      .paddingOuter(2)
      .paddingTop(20)
      .paddingInner(1)
      .round(true)
      .tile(treemapSquarify)(h);

    return rootNode.descendants().filter((d) => d.depth > 0);
  }, [displayRoot, maxDepth, width]);

  const handleClick = (node: TreeNode) => {
    if (node.children.length === 0) return;
    const path = findPathIds(root, node.id);
    if (path !== null) setZoomPathIds(path);
  };

  const handleMouseMove = (e: MouseEvent<SVGElement>, node: TreeNode) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setTooltip({ x: e.clientX - rect.left + 16, y: e.clientY - rect.top + 16, node });
  };

  return (
    <Box ref={containerRef} sx={{ position: "relative", width: "100%" }}>
      <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", mb: 1.5, gap: 2 }}>
        <Stack direction="row" spacing={0.5} sx={{ flexWrap: "wrap", gap: 0.5 }}>
        {breadcrumb.map((node, i) => {
          const isLast = i === breadcrumb.length - 1;
          return (
            <Button
              key={node.id}
              size="small"
              disabled={isLast}
              onClick={() => setZoomPathIds(zoomPathIds.slice(0, i))}
              sx={{
                bgcolor: LEVEL_COLORS[node.icon] ?? "#546e7a",
                color: "white",
                opacity: isLast ? 1 : 0.65,
                "&:hover": {
                  bgcolor: LEVEL_COLORS[node.icon] ?? "#546e7a",
                  opacity: 0.9,
                },
                "&.Mui-disabled": {
                  bgcolor: LEVEL_COLORS[node.icon] ?? "#546e7a",
                  color: "white",
                },
                textTransform: "none",
                fontSize: 13,
                fontWeight: isLast ? 600 : 400,
                minWidth: 0,
              }}
            >
              {node.name}
            </Button>
          );
        })}
        </Stack>
        <Stack direction="row" sx={{ alignItems: "center", gap: 2, flexShrink: 0, minWidth: 200 }}>
          <Typography sx={{ fontSize: 13, color: "text.secondary", whiteSpace: "nowrap" }}>
            Depth: {maxDepth}
          </Typography>
          <Slider
            min={1}
            max={6}
            step={1}
            value={maxDepth}
            onChange={(_, v) => setMaxDepth(v as number)}
            marks
            size="small"
            sx={{ minWidth: 120 }}
          />
        </Stack>
      </Stack>

      <svg
        width={width}
        height={HEIGHT}
        style={{ display: "block" }}
        onMouseLeave={() => setTooltip(null)}
      >
        {tiles.map((tile) => {
          const node = tile.data;
          const x = tile.x0;
          const y = tile.y0;
          const w = tile.x1 - tile.x0;
          const h = tile.y1 - tile.y0;
          const isTrueLeaf = trueLeafIds.has(node.id);
          const fill = isTrueLeaf
            ? (STATUS_COLORS[node.status ?? ""] ?? LEVEL_COLORS[node.icon] ?? "#546e7a")
            : (LEVEL_COLORS[node.icon] ?? "#546e7a");
          const clickable = !isTrueLeaf;
          const maxChars = Math.max(2, Math.floor(w / 7));
          const label =
            node.name.length > maxChars
              ? node.name.slice(0, maxChars) + "…"
              : node.name;

          return (
            <g key={node.id}>
              <rect
                x={x}
                y={y}
                width={w}
                height={h}
                fill={fill}
                stroke="rgba(255,255,255,0.2)"
                strokeWidth={1}
                onClick={() => clickable && handleClick(node)}
                onMouseMove={(e) => handleMouseMove(e, node)}
                style={{ cursor: clickable ? "pointer" : "default" }}
              />
              {w > 28 && h > 16 && (
                <text
                  x={x + 4}
                  y={y + 14}
                  fontSize={11}
                  fill="rgba(255,255,255,0.92)"
                  style={{ pointerEvents: "none", userSelect: "none" }}
                >
                  {label}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {tooltip && (
        <Box
          sx={{
            position: "absolute",
            left: tooltip.x,
            top: tooltip.y,
            bgcolor: "rgba(18,18,18,0.96)",
            color: "white",
            p: "8px 12px",
            borderRadius: 1.5,
            fontSize: 13,
            pointerEvents: "none",
            zIndex: 200,
            maxWidth: 280,
            boxShadow: "0 4px 20px rgba(0,0,0,0.55)",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <Typography sx={{ fontWeight: 600, fontSize: 13, mb: 0.5 }}>
            {tooltip.node.name}
          </Typography>
          {tooltip.node.friendlyId && (
            <Typography sx={{ fontSize: 12, color: "#999" }}>
              {tooltip.node.friendlyId}
            </Typography>
          )}
          {tooltip.node.status && (
            <Typography
              sx={{
                fontSize: 12,
                color: STATUS_COLORS[tooltip.node.status] ?? "#fff",
                fontWeight: 500,
              }}
            >
              {tooltip.node.status}
            </Typography>
          )}
          {tooltip.node.className && (
            <Typography sx={{ fontSize: 12, color: "#bbb" }}>
              {tooltip.node.className}
            </Typography>
          )}
          {tooltip.node.description && (
            <Typography sx={{ fontSize: 11, color: "#ccc", mt: 0.5 }}>
              {tooltip.node.description}
            </Typography>
          )}
          {tooltip.node.children.length > 0 && (
            <Typography sx={{ fontSize: 11, color: "#555", mt: 0.5 }}>
              Click to zoom in
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
};
