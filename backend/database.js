const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const dbPath = path.resolve(__dirname, 'assets.db');
const db = new DatabaseSync(dbPath);

// Helper function to run a query and return multiple rows
const dbAll = (sql, params = []) => {
    return db.prepare(sql).all(...params);
};

// Helper function to get a single row
const dbGet = (sql, params = []) => {
    return db.prepare(sql).get(...params);
};

module.exports = {
    db,
    dbAll,
    dbGet
};
