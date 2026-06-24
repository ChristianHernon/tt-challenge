const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

// ─── Deterministic RNG (mulberry32) ─────────────────────────────────────────
const SEED = 20260624; // fixed seed for reproducibility; override with SEED env var
function mulberry32(seed) {
  let s = seed | 0;
  return function () {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = mulberry32(Number(process.env.SEED) || SEED);

function pick(arr) { return arr[Math.floor(rng() * arr.length)]; }
function pickN(arr, n) {
  const copy = [...arr];
  const result = [];
  for (let i = 0; i < n && copy.length; i++) {
    const idx = Math.floor(rng() * copy.length);
    result.push(copy.splice(idx, 1)[0]);
  }
  return result;
}
function weightedPick(options) {
  const total = options.reduce((s, o) => s + o.weight, 0);
  let r = rng() * total;
  for (const o of options) { r -= o.weight; if (r <= 0) return o.value; }
  return options[options.length - 1].value;
}
function randInt(min, max) { return min + Math.floor(rng() * (max - min + 1)); }

// ─── Vocabulary: Pet Food Manufacturing ─────────────────────────────────────
const STATUSES = [
  { id: 1, name: 'Normal' },
  { id: 2, name: 'Warning' },
  { id: 3, name: 'Critical' },
];

const CLASS_DEFS = [
  { id: 1, name: 'Centrifugal Pump', description: 'Fluid transfer pump', icon: 'pump' },
  { id: 2, name: 'Positive Displacement Pump', description: 'High viscosity pump', icon: 'pump' },
  { id: 3, name: 'AC Induction Motor', description: 'Standard 3-phase motor', icon: 'motor' },
  { id: 4, name: 'Servo Motor', description: 'Precision servo drive', icon: 'motor' },
  { id: 5, name: 'Helical Gearbox', description: 'Speed reduction gearbox', icon: 'gearbox' },
  { id: 6, name: 'Planetary Gearbox', description: 'Compact reduction gearbox', icon: 'gearbox' },
  { id: 7, name: 'Ball Valve', description: 'Quarter-turn shutoff valve', icon: 'valve' },
  { id: 8, name: 'Butterfly Valve', description: 'Flow regulation valve', icon: 'valve' },
  { id: 9, name: 'Globe Valve', description: 'Throttling control valve', icon: 'valve' },
  { id: 10, name: 'Belt Conveyor', description: 'Flat belt transport conveyor', icon: 'conveyor' },
  { id: 11, name: 'Screw Conveyor', description: 'Auger-style material mover', icon: 'conveyor' },
  { id: 12, name: 'Bucket Elevator', description: 'Vertical material lift', icon: 'conveyor' },
  { id: 13, name: 'RTD Sensor', description: 'Resistance temperature detector', icon: 'sensor' },
  { id: 14, name: 'Thermocouple', description: 'Type-K temperature sensor', icon: 'sensor' },
  { id: 15, name: 'Pressure Transmitter', description: '4-20mA pressure sensor', icon: 'sensor' },
  { id: 16, name: 'Vibration Sensor', description: 'Accelerometer vibration monitor', icon: 'sensor' },
  { id: 17, name: 'Flow Meter', description: 'Volumetric flow measurement', icon: 'sensor' },
  { id: 18, name: 'Load Cell', description: 'Strain gauge weight sensor', icon: 'sensor' },
  { id: 19, name: 'VFD', description: 'Variable frequency drive', icon: 'drive' },
  { id: 20, name: 'Soft Starter', description: 'Reduced voltage motor starter', icon: 'drive' },
  { id: 21, name: 'PLC Module', description: 'Programmable logic controller I/O', icon: 'controller' },
  { id: 22, name: 'HMI Panel', description: 'Operator interface touchscreen', icon: 'controller' },
  { id: 23, name: 'Pneumatic Cylinder', description: 'Linear pneumatic actuator', icon: 'actuator' },
  { id: 24, name: 'Solenoid Valve', description: 'Electrically actuated valve', icon: 'valve' },
];

// ISA-95 hierarchy vocabulary ─────────────────────────────────────────────────
// L1: Enterprise (root)
const ENTERPRISE = { name: 'Acme Pet Nutrition', icon: 'enterprise' };

// L2: Sites
const SITES = [
  { name: 'Topeka Plant', code: 'TPK', icon: 'site' },
  { name: 'Lincoln Plant', code: 'LNK', icon: 'site' },
  { name: 'Bentonville Plant', code: 'BNV', icon: 'site' },
];

// L3: Areas (per site)
const AREAS = [
  { name: 'Raw Receiving', code: 'RCV', icon: 'area' },
  { name: 'Grain Milling', code: 'MIL', icon: 'area' },
  { name: 'Batching & Mixing', code: 'MIX', icon: 'area' },
  { name: 'Extrusion', code: 'EXT', icon: 'area' },
  { name: 'Drying', code: 'DRY', icon: 'area' },
  { name: 'Coating & Enrobing', code: 'COT', icon: 'area' },
  { name: 'Packaging', code: 'PKG', icon: 'area' },
  { name: 'Palletizing & Warehouse', code: 'WHR', icon: 'area' },
];

// L4: Production Lines
const LINE_TEMPLATES = [
  { name: 'Kibble Line', code: 'KBL', icon: 'line' },
  { name: 'Treat Line', code: 'TRT', icon: 'line' },
  { name: 'Wet Food Line', code: 'WET', icon: 'line' },
  { name: 'Dental Chew Line', code: 'DCH', icon: 'line' },
];

// L5: Equipment (pools per area type)
const EQUIPMENT_POOLS = {
  RCV: ['Intake Hopper', 'Magnetic Separator', 'Vibrating Screen', 'Bucket Elevator', 'Weighbridge'],
  MIL: ['Hammer Mill', 'Roller Mill', 'Aspirator', 'Cyclone Separator', 'Sifter'],
  MIX: ['Ribbon Blender', 'Paddle Mixer', 'Batch Scale', 'Liquid Dosing System', 'Pre-Conditioner'],
  EXT: ['Twin Screw Extruder', 'Single Screw Extruder', 'Die Head Assembly', 'Face Cutter', 'Steam Injector'],
  DRY: ['Fluid Bed Dryer', 'Rotary Dryer', 'Belt Dryer', 'Cooling Conveyor', 'Moisture Analyzer'],
  COT: ['Coating Drum', 'Fat Sprayer', 'Flavor Applicator', 'Digest Pump', 'Enrobing Conveyor'],
  PKG: ['Vertical Form Fill Seal', 'Multi-Head Weigher', 'Checkweigher', 'Metal Detector', 'Bag Sealer', 'Labeler'],
  WHR: ['Palletizer', 'Stretch Wrapper', 'Case Erector', 'Conveyor Sorter', 'AGV Charger'],
};

// L6: Sub-assemblies
const SUBASSEMBLY_NAMES = [
  'Drive Assembly', 'Feed System', 'Discharge System', 'Lubrication Unit',
  'Control Panel', 'Hydraulic Power Unit', 'Cooling System', 'Guard Assembly',
];

// L7: Components (intentionally small pool → duplicates)
const COMPONENT_NAMES = [
  'Motor', 'Gearbox', 'Pump', 'Blower', 'Conveyor Belt',
  'Coupling', 'Bearing Housing', 'Drive Shaft', 'Impeller',
];

// L8: Instruments (intentionally small → lots of duplicates)
const INSTRUMENT_NAMES = [
  'Temperature Sensor', 'Pressure Sensor', 'Vibration Sensor',
  'Flow Sensor', 'Level Sensor', 'Speed Sensor', 'Load Cell',
  'Proximity Switch', 'Limit Switch',
];

// Map component/instrument names to class ids for instance assignment
const NAME_TO_CLASS = {
  'Motor': [3, 4],
  'Gearbox': [5, 6],
  'Pump': [1, 2],
  'Blower': [3],
  'Coupling': null,
  'Bearing Housing': null,
  'Drive Shaft': null,
  'Impeller': null,
  'Conveyor Belt': [10, 11],
  'Temperature Sensor': [13, 14],
  'Pressure Sensor': [15],
  'Vibration Sensor': [16],
  'Flow Sensor': [17],
  'Level Sensor': [18],
  'Speed Sensor': [16],
  'Load Cell': [18],
  'Proximity Switch': null,
  'Limit Switch': null,
};

// ─── Generator ──────────────────────────────────────────────────────────────
let nextId = 1;
let nextFriendlySeq = 1;
const assets = [];

function makeStatus() {
  return weightedPick([
    { value: 1, weight: 80 },
    { value: 2, weight: 15 },
    { value: 3, weight: 5 },
  ]);
}

function makeFriendlyId(parts) {
  const seq = String(nextFriendlySeq++).padStart(5, '0');
  return [...parts, seq].join('-');
}

function addAsset(name, description, icon, parentId, friendlyParts, classId) {
  const id = nextId++;
  const friendlyId = makeFriendlyId(friendlyParts);
  assets.push({
    id,
    name,
    description,
    friendlyId,
    parentId,
    statusId: makeStatus(),
    icon,
    classId: classId || null,
  });
  return id;
}

function generateInstruments(parentId, friendlyParts, count) {
  const chosen = pickN(INSTRUMENT_NAMES, count);
  for (const name of chosen) {
    const classIds = NAME_TO_CLASS[name];
    const classId = classIds ? pick(classIds) : null;
    const code = name.substring(0, 3).toUpperCase();
    addAsset(name, `${name} monitoring`, 'sensor', parentId, [...friendlyParts, code], classId);
  }
}

function generateComponents(parentId, friendlyParts, count) {
  const chosen = pickN(COMPONENT_NAMES, count);
  for (const name of chosen) {
    const classIds = NAME_TO_CLASS[name];
    const classId = classIds ? pick(classIds) : null;
    const code = name.substring(0, 3).toUpperCase();
    const id = addAsset(name, `${name} component`, 'component', parentId, [...friendlyParts, code], classId);
    // L8 instruments on some components
    if (rng() < 0.5) {
      const instrCount = randInt(1, 4);
      generateInstruments(id, [...friendlyParts, code], instrCount);
    }
  }
}

function generateSubassemblies(parentId, friendlyParts, count) {
  const chosen = pickN(SUBASSEMBLY_NAMES, count);
  for (const name of chosen) {
    const code = name.substring(0, 3).toUpperCase();
    const id = addAsset(name, `${name} sub-assembly`, 'subassembly', parentId, [...friendlyParts, code]);
    // L7 components
    const compCount = randInt(1, 5);
    generateComponents(id, [...friendlyParts, code], compCount);
  }
}

function generateEquipment(parentId, areaCode, friendlyParts) {
  const pool = EQUIPMENT_POOLS[areaCode] || EQUIPMENT_POOLS.MIX;
  const count = randInt(2, 6);
  const chosen = pickN(pool, count);
  for (const name of chosen) {
    const code = name.substring(0, 4).toUpperCase().replace(/\s/g, '');
    const id = addAsset(name, `${name} equipment unit`, 'equipment', parentId, [...friendlyParts, code]);
    // L6 sub-assemblies (0-4, but at least sometimes 0 for varying depth)
    const subCount = rng() < 0.15 ? 0 : randInt(1, 4);
    if (subCount > 0) {
      generateSubassemblies(id, [...friendlyParts, code], subCount);
    } else {
      // Leaf equipment might still have instruments directly
      if (rng() < 0.6) {
        generateInstruments(id, [...friendlyParts, code], randInt(1, 3));
      }
    }
  }
}

function generateLines(parentId, areaCode, friendlyParts) {
  const lineCount = randInt(1, 4);
  const templates = pickN(LINE_TEMPLATES, lineCount);
  for (let i = 0; i < templates.length; i++) {
    const tmpl = templates[i];
    const num = String(i + 1).padStart(2, '0');
    const name = `${tmpl.name} ${num}`;
    const code = `${tmpl.code}${num}`;
    const id = addAsset(name, `${tmpl.name} production line`, tmpl.icon, parentId, [...friendlyParts, code]);
    generateEquipment(id, areaCode, [...friendlyParts, code]);
  }
}

function generateAreas(parentId, siteCode) {
  // Each site gets 4-8 areas
  const areaCount = randInt(4, 8);
  const chosen = pickN(AREAS, areaCount);
  for (const area of chosen) {
    const id = addAsset(area.name, `${area.name} processing area`, area.icon, parentId, [siteCode, area.code]);
    // Some areas have production lines (L4→L5); others go directly to equipment (L5)
    if (['EXT', 'DRY', 'COT', 'PKG'].includes(area.code)) {
      generateLines(id, area.code, [siteCode, area.code]);
    } else {
      generateEquipment(id, area.code, [siteCode, area.code]);
    }
  }
}

function generateHierarchy() {
  // L1: Enterprise root
  const rootId = addAsset(ENTERPRISE.name, 'Global pet food manufacturing enterprise', ENTERPRISE.icon, null, ['ACME']);

  // L2: Sites
  for (const site of SITES) {
    const siteId = addAsset(site.name, `${site.name} manufacturing facility`, site.icon, rootId, [site.code]);
    generateAreas(siteId, site.code);
  }
}

// ─── Database creation ──────────────────────────────────────────────────────
const dbPath = path.resolve(__dirname, 'assets.db');

// Clean slate
if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
}

const db = new DatabaseSync(dbPath);

console.log('Creating database schema...');

db.exec(`CREATE TABLE asset_statuses (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL
)`);

db.exec(`CREATE TABLE classes (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT
)`);

db.exec(`CREATE TABLE assets (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  friendlyId TEXT NOT NULL UNIQUE,
  parentId INTEGER,
  statusId INTEGER NOT NULL,
  icon TEXT,
  classId INTEGER,
  FOREIGN KEY(parentId) REFERENCES assets(id),
  FOREIGN KEY(statusId) REFERENCES asset_statuses(id),
  FOREIGN KEY(classId) REFERENCES classes(id)
)`);

db.exec(`CREATE INDEX idx_assets_name ON assets(name)`);
db.exec(`CREATE INDEX idx_assets_parentId ON assets(parentId)`);
db.exec(`CREATE INDEX idx_assets_classId ON assets(classId)`);
db.exec(`CREATE INDEX idx_classes_name ON classes(name)`);

// ─── Seed statuses ──────────────────────────────────────────────────────────
console.log('Seeding statuses...');
const stmtStatus = db.prepare('INSERT INTO asset_statuses (id, name) VALUES (?, ?)');
for (const s of STATUSES) {
  stmtStatus.run(s.id, s.name);
}

// ─── Seed classes ───────────────────────────────────────────────────────────
console.log(`Seeding ${CLASS_DEFS.length} class definitions...`);
const stmtClass = db.prepare('INSERT INTO classes (id, name, description, icon) VALUES (?, ?, ?, ?)');
for (const c of CLASS_DEFS) {
  stmtClass.run(c.id, c.name, c.description, c.icon);
}

// ─── Generate and seed assets ───────────────────────────────────────────────
console.log('Generating asset hierarchy...');
generateHierarchy();

console.log(`Seeding ${assets.length} assets...`);
const stmtAsset = db.prepare(
  'INSERT INTO assets (id, name, description, friendlyId, parentId, statusId, icon, classId) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
);
for (const a of assets) {
  stmtAsset.run(a.id, a.name, a.description, a.friendlyId, a.parentId, a.statusId, a.icon, a.classId);
}

// ─── Summary ────────────────────────────────────────────────────────────────
const distinctNames = new Set(assets.map(a => a.name)).size;
const instances = assets.filter(a => a.classId !== null).length;
console.log(`\nDone! Summary:`);
console.log(`  Total assets: ${assets.length}`);
console.log(`  Distinct names: ${distinctNames} (duplicate factor: ${(assets.length / distinctNames).toFixed(1)}x)`);
console.log(`  Class instances: ${instances}`);
console.log(`  Class definitions: ${CLASS_DEFS.length}`);
console.log(`  Max depth: 8 tiers (Enterprise → Instrument)`);

db.close();
