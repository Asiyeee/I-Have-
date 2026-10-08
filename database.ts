import Database from 'better-sqlite3';
import path from 'path';

const db = new Database('food_waste.db');

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS entities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT CHECK(type IN ('restaurant', 'charity')) NOT NULL,
    lat REAL NOT NULL,
    lng REAL NOT NULL,
    contact TEXT
  );

  CREATE TABLE IF NOT EXISTS listings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entity_id INTEGER NOT NULL,
    type TEXT CHECK(type IN ('supply', 'demand')) NOT NULL,
    quantity INTEGER NOT NULL,
    available_time TEXT,
    urgency INTEGER DEFAULT 1,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(entity_id) REFERENCES entities(id)
  );

  CREATE TABLE IF NOT EXISTS matches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    supply_id INTEGER NOT NULL,
    demand_id INTEGER NOT NULL,
    pickup_time TEXT,
    status TEXT DEFAULT 'proposed',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(supply_id) REFERENCES listings(id),
    FOREIGN KEY(demand_id) REFERENCES listings(id)
  );
`);

// Seed some initial data if empty
const entityCount = db.prepare('SELECT COUNT(*) as count FROM entities').get() as { count: number };
if (entityCount.count === 0) {
  const insertEntity = db.prepare('INSERT INTO entities (name, type, lat, lng, contact) VALUES (?, ?, ?, ?, ?)');
  
  // Sample data around a central point (e.g., Downtown San Francisco)
  insertEntity.run('The Gourmet Bistro', 'restaurant', 37.7749, -122.4194, '555-0101');
  insertEntity.run('Green Garden Salads', 'restaurant', 37.7833, -122.4167, '555-0102');
  insertEntity.run('Hope House Shelter', 'charity', 37.7785, -122.4056, '555-0201');
  insertEntity.run('City Food Bank', 'charity', 37.7694, -122.4862, '555-0202');
  insertEntity.run('St. Jude Community Kitchen', 'charity', 37.7510, -122.4183, '555-0203');
}

export default db;
