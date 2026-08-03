const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'history.db');
const db = new Database(dbPath);

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS presentations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    slides_json TEXT NOT NULL,
    theme TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

function savePresentation(title, slidesJson, theme) {
    const stmt = db.prepare('INSERT INTO presentations (title, slides_json, theme) VALUES (?, ?, ?)');
    const result = stmt.run(title, JSON.stringify(slidesJson), theme);
    return result.lastInsertRowid;
}

function getPresentations() {
    const stmt = db.prepare('SELECT id, title, theme, created_at FROM presentations ORDER BY created_at DESC');
    return stmt.all();
}

function getPresentationById(id) {
    const stmt = db.prepare('SELECT * FROM presentations WHERE id = ?');
    const row = stmt.get(id);
    if (row) {
        row.slides_json = JSON.parse(row.slides_json);
    }
    return row;
}

function deletePresentation(id) {
    const stmt = db.prepare('DELETE FROM presentations WHERE id = ?');
    stmt.run(id);
}

module.exports = {
    savePresentation,
    getPresentations,
    getPresentationById,
    deletePresentation
};
