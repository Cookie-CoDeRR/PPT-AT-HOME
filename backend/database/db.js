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
  );

  CREATE TABLE IF NOT EXISTS media (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    url TEXT NOT NULL,
    type TEXT NOT NULL,
    prompt TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

function savePresentation(title, slidesJson, theme) {
    const stmt = db.prepare('INSERT INTO presentations (title, slides_json, theme) VALUES (?, ?, ?)');
    const result = stmt.run(title, JSON.stringify(slidesJson), theme);
    return result.lastInsertRowid;
}

function getPresentations() {
    const stmt = db.prepare('SELECT id, title, theme, slides_json, created_at FROM presentations ORDER BY created_at DESC');
    return stmt.all().map(row => {
        try {
            row.slides_json = JSON.parse(row.slides_json);
        } catch (e) {
            row.slides_json = [];
        }
        return row;
    });
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

function renamePresentation(id, newTitle) {
    const stmt = db.prepare('UPDATE presentations SET title = ? WHERE id = ?');
    stmt.run(newTitle, id);
}

function duplicatePresentation(id) {
    const source = getPresentationById(id);
    if (!source) throw new Error("Presentation not found");
    const newTitle = source.title + " (Copy)";
    const newId = savePresentation(newTitle, source.slides_json, source.theme);
    const stmt = db.prepare('SELECT id, title, theme, created_at FROM presentations WHERE id = ?');
    return stmt.get(newId);
}

function saveMedia(url, type, prompt) {
    const stmt = db.prepare('INSERT INTO media (url, type, prompt) VALUES (?, ?, ?)');
    const result = stmt.run(url, type, prompt);
    return getMediaById(result.lastInsertRowid);
}

function getMediaItems() {
    const stmt = db.prepare("SELECT id, url, type, strftime('%b %Y', created_at) as date, created_at FROM media ORDER BY created_at DESC");
    return stmt.all().map(item => ({...item, id: String(item.id)}));
}

function getMediaById(id) {
    const stmt = db.prepare("SELECT id, url, type, strftime('%b %Y', created_at) as date, created_at FROM media WHERE id = ?");
    const item = stmt.get(id);
    if (item) item.id = String(item.id);
    return item;
}

module.exports = {
    savePresentation,
    getPresentations,
    getPresentationById,
    deletePresentation,
    renamePresentation,
    duplicatePresentation,
    saveMedia,
    getMediaItems,
    getMediaById
};
