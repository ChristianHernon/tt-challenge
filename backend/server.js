const express = require("express");
const cors = require("cors");
const { dbAll, dbGet } = require("./database");

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

const ancestorMap = (() => {
  const rows = dbAll(`
    WITH RECURSIVE anc(leaf_id, anc_id, anc_name, anc_icon, anc_parent, depth) AS (
      SELECT a.id, p.id, p.name, p.icon, p.parentId, 1
      FROM assets a
      JOIN assets p ON p.id = a.parentId
      UNION ALL
      SELECT anc.leaf_id, p.id, p.name, p.icon, p.parentId, anc.depth + 1
      FROM anc
      JOIN assets p ON p.id = anc.anc_parent
    )
    SELECT
      leaf_id,
      json_group_array(
        json_object('id', anc_id, 'name', anc_name, 'icon', anc_icon)
        ORDER BY depth DESC
      ) as ancestors
    FROM anc
    GROUP BY leaf_id
  `);
  const map = new Map();
  for (const row of rows) {
    map.set(row.leaf_id, JSON.parse(row.ancestors));
  }
  return map;
})();

const hierarchyNodes = dbAll(`
  SELECT id, name, icon, parentId
  FROM assets
  WHERE id IN (SELECT DISTINCT parentId FROM assets WHERE parentId IS NOT NULL)
`);

const hierarchyPaths = (() => {
  const nodeMap = new Map(hierarchyNodes.map((n) => [n.id, n]));

  const getPath = (node) => {
    const parts = [];
    let current = node;
    while (current) {
      if (current.icon !== "enterprise") parts.unshift(current.name);
      current = current.parentId != null ? nodeMap.get(current.parentId) : null;
    }
    return parts.join(" > ");
  };

  return hierarchyNodes
    .filter((n) => n.icon !== "enterprise")
    .map((n) => ({ id: n.id, path: getPath(n) }))
    .sort((a, b) => a.path.localeCompare(b.path));
})();

const descendantMap = (() => {
  const map = new Map();
  for (const [leafId, ancestors] of ancestorMap.entries()) {
    for (const anc of ancestors) {
      if (!map.has(anc.id)) map.set(anc.id, new Set());
      map.get(anc.id).add(leafId);
    }
  }
  return map;
})();

app.get("/api/assets", async (req, res) => {
  const assets = await dbAll(`
    SELECT a.id, a.name, a.description, a.friendlyId, a.parentId,
           b.name as status, a.icon, a.classId,
           c.name as className, c.description as classDescription
    FROM assets a
    JOIN asset_statuses b ON a.statusId = b.id
    LEFT JOIN classes c ON a.classId = c.id
  `);
  const result = assets.map((a) => ({ ...a, ancestors: ancestorMap.get(a.id) ?? [] }));
  res.json(result);
});

app.get("/api/assets/hierarchy", (req, res) => {
  res.json({ paths: hierarchyPaths });
});

app.get("/api/assets/icons", async (req, res) => {
  const icons = await dbAll("SELECT DISTINCT icon FROM assets");
  const iconEnum = icons.reduce((acc, { icon }) => {
    acc[icon] = icon;
    return acc;
  }, {});

  res.json(iconEnum);
});

app.get("/api/classes", async (req, res) => {
  const assetClasses = await dbAll("SELECT DISTINCT * FROM classes");
  res.json({ count: assetClasses.length, classes: assetClasses });
});

app.post("/api/assets/search", async (req, res) => {
  if (Object.keys(req.body ?? {}).length === 0) {
    return res
      .status(400)
      .json({ error: "Please provide at least one filter" });
  }

  const params = [];
  const where = ["WHERE 1=1"];

  if (req.body.name) {
    where.push("AND a.name LIKE ?");

    if (req.body.name.startsWith("*")) {
      params.push(req.body.name.replace(/^\*/, "%"));
    } else if (req.body.name.endsWith("*")) {
      params.push(req.body.name.replace(/\*$/, "%"));
    } else params.push(`%${req.body.name}%`);
  }

  if (req.body.parentId) {
    where.push("AND a.parentId = ?");
    params.push(req.body.parentId);
  }

  if (req.body.statusId) {
    where.push("AND a.statusId = ?");
    params.push(req.body.statusId);
  }

  if (req.body.classId) {
    where.push("AND a.classId = ?");
    params.push(req.body.classId);
  }

  if (req.body.ancestorId) {
    const ancestorId = parseInt(req.body.ancestorId, 10);
    const descendants = !isNaN(ancestorId) ? descendantMap.get(ancestorId) : undefined;
    if (descendants?.size) {
      where.push(`AND a.id IN (${[...descendants].join(",")})`);
    } else {
      where.push("AND 1=0");
    }
  }

  const assets = await dbAll(
    `
    SELECT a.id, a.name, a.description, a.friendlyId, a.parentId,
           b.name as status, a.icon, a.classId,
           c.name as className, c.description as classDescription
    FROM assets a
    JOIN asset_statuses b ON a.statusId = b.id
    LEFT JOIN classes c ON a.classId = c.id
    ${where.join(" ")}
  `,
    params,
  );
  const result = assets.map((a) => ({ ...a, ancestors: ancestorMap.get(a.id) ?? [] }));
  res.status(200).json({ count: result.length, assets: result });
});

app.listen(PORT, () => {
  console.log(
    `Frontend Challenge API Server running on http://localhost:${PORT}`,
  );
});
