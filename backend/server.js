const express = require("express");
const cors = require("cors");
const { dbAll, dbGet } = require("./database");

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

app.get("/api/assets", async (req, res) => {
  const assets = await dbAll(`
    SELECT a.id, a.name, a.description, a.friendlyId, a.parentId,
           b.name as status, a.icon, a.classId,
           c.name as className, c.description as classDescription
    FROM assets a
    JOIN asset_statuses b ON a.statusId = b.id
    LEFT JOIN classes c ON a.classId = c.id
  `);
  res.json(assets);
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
  const assetClasses = await dbAll("SELECT * FROM classes");
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

  const assets = await dbAll(`
    SELECT a.id, a.name, a.description, a.friendlyId, a.parentId,
           b.name as status, a.icon, a.classId,
           c.name as className, c.description as classDescription
    FROM assets a
    JOIN asset_statuses b ON a.statusId = b.id
    LEFT JOIN classes c ON a.classId = c.id
    ${where.join(" ")}
  `, params);
  res.status(200).json({ count: assets.length, assets });
});

app.listen(PORT, () => {
  console.log(
    `Frontend Challenge API Server running on http://localhost:${PORT}`,
  );
});
