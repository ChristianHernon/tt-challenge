const { DatabaseSync } = require("node:sqlite");
const path = require("path");

// ─── CLI argument parsing ───────────────────────────────────────────────────
const args = process.argv.slice(2);
function hasFlag(name) {
  return args.includes(`--${name}`);
}
function getFlagValue(name) {
  const idx = args.indexOf(`--${name}`);
  return idx !== -1 && idx + 1 < args.length ? args[idx + 1] : null;
}

const OPTS = {
  statsOnly: hasFlag("stats-only"),
  maxDepth: getFlagValue("max-depth")
    ? Number(getFlagValue("max-depth"))
    : Infinity,
  rootId: getFlagValue("root"),
  dupesCount: getFlagValue("dupes")
    ? Number(getFlagValue("dupes"))
    : hasFlag("dupes")
      ? 20
      : 0,
  nameFilter: getFlagValue("name"),
  noColor: hasFlag("no-color") || !process.stdout.isTTY,
  mermaid: hasFlag("mermaid"),
  mermaidMaxDepth: getFlagValue("mermaid-depth")
    ? Number(getFlagValue("mermaid-depth"))
    : 4,
};

// ─── ANSI helpers ───────────────────────────────────────────────────────────
const c = OPTS.noColor
  ? {
      reset: "",
      dim: "",
      bold: "",
      red: "",
      yellow: "",
      green: "",
      cyan: "",
      magenta: "",
    }
  : {
      reset: "\x1b[0m",
      dim: "\x1b[2m",
      bold: "\x1b[1m",
      red: "\x1b[31m",
      yellow: "\x1b[33m",
      green: "\x1b[32m",
      cyan: "\x1b[36m",
      magenta: "\x1b[35m",
    };

const STATUS_GLYPH = {
  1: `${c.green}●${c.reset}`,
  2: `${c.yellow}▲${c.reset}`,
  3: `${c.red}✖${c.reset}`,
};

// ─── Load data ──────────────────────────────────────────────────────────────
const dbPath = path.resolve(__dirname, "assets.db");
const db = new DatabaseSync(dbPath);

const allAssets = db.prepare("SELECT * FROM assets").all();
const allClasses = db.prepare("SELECT * FROM classes").all();
db.close();

const classMap = new Map(allClasses.map((cls) => [cls.id, cls]));
const assetMap = new Map(allAssets.map((a) => [a.id, a]));
const childrenMap = new Map(); // parentId -> [asset]

for (const a of allAssets) {
  const pid = a.parentId;
  if (!childrenMap.has(pid)) childrenMap.set(pid, []);
  childrenMap.get(pid).push(a);
}

// ─── Find root(s) ──────────────────────────────────────────────────────────
function findRoot() {
  if (OPTS.rootId) {
    // Try numeric id first, then friendlyId
    const numId = Number(OPTS.rootId);
    if (!isNaN(numId) && assetMap.has(numId)) return assetMap.get(numId);
    const byFriendly = allAssets.find((a) => a.friendlyId === OPTS.rootId);
    if (byFriendly) return byFriendly;
    console.error(`Root not found: ${OPTS.rootId}`);
    process.exit(1);
  }
  // Default: the asset with parentId = null
  const roots = allAssets.filter((a) => a.parentId === null);
  if (roots.length === 0) {
    console.error("No root asset found.");
    process.exit(1);
  }
  return roots[0];
}

// ─── ASCII tree renderer ────────────────────────────────────────────────────
function renderNode(asset) {
  const status = STATUS_GLYPH[asset.statusId] || "?";
  const id = `${c.dim}#${asset.id}${c.reset}`;
  const friendly = `${c.dim}[${asset.friendlyId}]${c.reset}`;
  const cls = asset.classId
    ? `${c.magenta}«${classMap.get(asset.classId)?.name || "?"}»${c.reset}`
    : "";
  return `${status} ${id} ${c.bold}${asset.name}${c.reset} ${friendly}${cls ? " " + cls : ""}`;
}

function printTree(asset, prefix, isLast, depth) {
  if (depth > OPTS.maxDepth) return;
  const connector = depth === 0 ? "" : isLast ? "└── " : "├── ";
  const line = `${prefix}${connector}${renderNode(asset)}`;
  console.log(line);

  const children = childrenMap.get(asset.id) || [];
  const newPrefix = depth === 0 ? "" : prefix + (isLast ? "    " : "│   ");
  for (let i = 0; i < children.length; i++) {
    printTree(children[i], newPrefix, i === children.length - 1, depth + 1);
  }
}

// ─── Stats ──────────────────────────────────────────────────────────────────
function computeStats() {
  const depths = new Map(); // id -> depth
  const depthHistogram = new Map(); // depth -> count
  const childCounts = [];

  // BFS to compute depths
  const root = findRoot();
  const queue = [{ id: root.id, depth: 0 }];
  depths.set(root.id, 0);

  while (queue.length) {
    const { id, depth } = queue.shift();
    depthHistogram.set(depth, (depthHistogram.get(depth) || 0) + 1);
    const children = childrenMap.get(id) || [];
    childCounts.push(children.length);
    for (const child of children) {
      depths.set(child.id, depth + 1);
      queue.push({ id: child.id, depth: depth + 1 });
    }
  }

  const maxDepth = Math.max(...depthHistogram.keys());
  const leaves = childCounts.filter((c) => c === 0).length;
  const nonLeafCounts = childCounts.filter((c) => c > 0);
  const avgChildren = nonLeafCounts.length
    ? (nonLeafCounts.reduce((s, v) => s + v, 0) / nonLeafCounts.length).toFixed(
        1,
      )
    : 0;
  const maxChildren = Math.max(...childCounts);
  const minChildren = Math.min(...nonLeafCounts);

  const distinctNames = new Set(allAssets.map((a) => a.name)).size;
  const instances = allAssets.filter((a) => a.classId !== null).length;

  return {
    total: allAssets.length,
    classes: allClasses.length,
    maxDepth,
    depthHistogram,
    leaves,
    avgChildren,
    maxChildren,
    minChildren,
    distinctNames,
    instances,
  };
}

function printStats() {
  const s = computeStats();
  console.log(`\n${c.bold}═══ Asset Hierarchy Statistics ═══${c.reset}\n`);
  console.log(`  Total assets:       ${s.total}`);
  console.log(`  Class definitions:  ${s.classes}`);
  console.log(
    `  Class instances:    ${s.instances} (${((s.instances / s.total) * 100).toFixed(1)}%)`,
  );
  console.log(`  Regular assets:     ${s.total - s.instances}`);
  console.log(`  Distinct names:     ${s.distinctNames}`);
  console.log(
    `  Duplicate factor:   ${(s.total / s.distinctNames).toFixed(1)}x`,
  );
  console.log(`  Leaf nodes:         ${s.leaves}`);
  console.log(`  Max depth:          ${s.maxDepth}`);
  console.log(
    `  Children (non-leaf): min=${s.minChildren} avg=${s.avgChildren} max=${s.maxChildren}`,
  );
  console.log(`\n  ${c.bold}Depth histogram:${c.reset}`);
  const sorted = [...s.depthHistogram.entries()].sort((a, b) => a[0] - b[0]);
  const maxCount = Math.max(...sorted.map(([, v]) => v));
  for (const [depth, count] of sorted) {
    const bar = "█".repeat(Math.ceil((count / maxCount) * 40));
    console.log(`    L${depth}: ${c.cyan}${bar}${c.reset} ${count}`);
  }
  console.log("");
}

// ─── Duplicates report ──────────────────────────────────────────────────────
function getPath(asset) {
  const parts = [];
  let current = asset;
  while (current) {
    parts.unshift(current.name);
    current = current.parentId ? assetMap.get(current.parentId) : null;
  }
  return parts.join(" → ");
}

function printDupes(limit) {
  // Group by name
  const nameGroups = new Map();
  for (const a of allAssets) {
    if (!nameGroups.has(a.name)) nameGroups.set(a.name, []);
    nameGroups.get(a.name).push(a);
  }

  // Filter to duplicates only, sort by count desc
  const dupes = [...nameGroups.entries()]
    .filter(([, arr]) => arr.length > 1)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, limit);

  console.log(
    `\n${c.bold}═══ Duplicate Names Report (top ${limit}) ═══${c.reset}\n`,
  );
  console.log(`  ${dupes.length} names shown, each appearing 2+ times.\n`);

  for (const [name, assets] of dupes) {
    console.log(
      `  ${c.bold}${c.yellow}"${name}"${c.reset} — ${assets.length} occurrences:`,
    );
    for (const a of assets.slice(0, 8)) {
      // Cap at 8 examples per name
      const status = STATUS_GLYPH[a.statusId] || "?";
      const cls = a.classId
        ? ` ${c.magenta}«${classMap.get(a.classId)?.name}»${c.reset}`
        : "";
      console.log(`    ${status} ${c.dim}${getPath(a)}${c.reset}${cls}`);
      console.log(`      ${c.dim}friendlyId: ${a.friendlyId}${c.reset}`);
    }
    if (assets.length > 8) {
      console.log(`    ${c.dim}... and ${assets.length - 8} more${c.reset}`);
    }
    console.log("");
  }
}

// ─── Name search ────────────────────────────────────────────────────────────
function printNameSearch(query) {
  const lower = query.toLowerCase();
  const matches = allAssets.filter((a) => a.name.toLowerCase().includes(lower));
  console.log(
    `\n${c.bold}═══ Search: "${query}" — ${matches.length} results ═══${c.reset}\n`,
  );
  for (const a of matches.slice(0, 30)) {
    const status = STATUS_GLYPH[a.statusId] || "?";
    const cls = a.classId
      ? ` ${c.magenta}«${classMap.get(a.classId)?.name}»${c.reset}`
      : "";
    console.log(`  ${status} ${c.bold}${a.name}${c.reset}${cls}`);
    console.log(`    ${c.dim}${getPath(a)}${c.reset}`);
    console.log(`    ${c.dim}friendlyId: ${a.friendlyId}${c.reset}`);
  }
  if (matches.length > 30) {
    console.log(
      `\n  ${c.dim}... and ${matches.length - 30} more results${c.reset}`,
    );
  }
  console.log("");
}

// ─── Mermaid diagram ────────────────────────────────────────────────────────
function mermaidEscape(str) {
  return str.replace(/["]/g, "'").replace(/[\[\](){}]/g, " ");
}

function printMermaid() {
  const root = findRoot();
  const maxD = OPTS.mermaidMaxDepth;
  const lines = ["graph TD"];
  const visited = new Set();

  function nodeId(asset) {
    return `N${asset.id}`;
  }

  function statusStyle(asset) {
    if (asset.statusId === 3) return ":::critical";
    if (asset.statusId === 2) return ":::warning";
    return "";
  }

  function walk(asset, depth) {
    if (depth > maxD || visited.has(asset.id)) return;
    visited.add(asset.id);

    const label = mermaidEscape(asset.name);
    const cls = asset.classId
      ? ` - ${mermaidEscape(classMap.get(asset.classId)?.name || "")}`
      : "";
    lines.push(`  ${nodeId(asset)}["${label}${cls}"]${statusStyle(asset)}`);

    const children = childrenMap.get(asset.id) || [];
    for (const child of children) {
      lines.push(`  ${nodeId(asset)} --> ${nodeId(child)}`);
      walk(child, depth + 1);
    }
  }

  walk(root, 0);

  // Add class definitions for styling
  lines.push("");
  lines.push("  classDef critical fill:#fee2e2,stroke:#dc2626,color:#991b1b");
  lines.push("  classDef warning fill:#fef9c3,stroke:#ca8a04,color:#854d0e");

  console.log(lines.join("\n"));
  console.error(
    `\nMermaid diagram generated (${visited.size} nodes, max-depth ${maxD}).`,
  );
  console.error(
    `Tip: Adjust depth with --mermaid-depth N. Pipe to a .mmd file: npm run tree -- --mermaid > tree.mmd`,
  );
}

// ─── Main ───────────────────────────────────────────────────────────────────
function main() {
  if (OPTS.mermaid) {
    printMermaid();
    return;
  }

  if (OPTS.nameFilter) {
    printNameSearch(OPTS.nameFilter);
    return;
  }

  if (!OPTS.statsOnly) {
    const root = findRoot();
    console.log(`\n${c.bold}═══ Asset Hierarchy Tree ═══${c.reset}\n`);
    printTree(root, "", true, 0);
  }

  printStats();

  if (OPTS.dupesCount > 0) {
    printDupes(OPTS.dupesCount);
  } else if (!OPTS.statsOnly) {
    // Always show a brief dupes summary
    const nameGroups = new Map();
    for (const a of allAssets) {
      if (!nameGroups.has(a.name)) nameGroups.set(a.name, []);
      nameGroups.get(a.name).push(a);
    }
    const dupCount = [...nameGroups.values()].filter(
      (arr) => arr.length > 1,
    ).length;
    console.log(
      `  ${c.dim}Tip: ${dupCount} names are duplicated. Run with --dupes 20 for the full report.${c.reset}\n`,
    );
  }
}

main();
