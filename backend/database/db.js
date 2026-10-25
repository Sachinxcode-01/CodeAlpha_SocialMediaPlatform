/**
 * Database Module for NovaConnect
 * Powered by Node.js native SQLite (DatabaseSync)
 * Provides automatic schema initialization, referential integrity, and helper methods.
 */

const { DatabaseSync } = require('node:sqlite');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Determine database location: memory mode for tests or file path for persistent dev/prod
const dbPath = process.env.DATABASE_FILE || 
  (process.env.NODE_ENV === 'test' ? ':memory:' : path.resolve(__dirname, '../../database.db'));

// Ensure parent directory exists if using file path
if (dbPath !== ':memory:') {
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

const db = new DatabaseSync(dbPath);

// Always enforce foreign key constraints in SQLite
db.exec('PRAGMA foreign_keys = ON;');
db.exec('PRAGMA journal_mode = WAL;');

// Initialize tables from schema.sql
const schemaPath = path.resolve(__dirname, 'schema.sql');
if (fs.existsSync(schemaPath)) {
  const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schemaSQL);
}

/**
 * Run a SELECT query that returns multiple rows
 * @param {string} sql 
 * @param {Array} params 
 * @returns {Array<Object>}
 */
function query(sql, params = []) {
  const stmt = db.prepare(sql);
  return stmt.all(...params);
}

/**
 * Run a SELECT query that returns a single row (or null)
 * @param {string} sql 
 * @param {Array} params 
 * @returns {Object|null}
 */
function queryOne(sql, params = []) {
  const stmt = db.prepare(sql);
  const rows = stmt.all(...params);
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Execute an INSERT, UPDATE, or DELETE statement
 * @param {string} sql 
 * @param {Array} params 
 * @returns {{ changes: number, lastInsertRowid: number|bigint }}
 */
function execute(sql, params = []) {
  const stmt = db.prepare(sql);
  return stmt.run(...params);
}

/**
 * Cleanly reset tables (primarily used during automated test runs)
 */
function resetDatabase() {
  db.exec('PRAGMA foreign_keys = OFF;');
  db.exec(`
    DELETE FROM follows;
    DELETE FROM likes;
    DELETE FROM comments;
    DELETE FROM posts;
    DELETE FROM users;
  `);
  db.exec('PRAGMA foreign_keys = ON;');
}

module.exports = {
  db,
  query,
  queryOne,
  execute,
  resetDatabase
};
