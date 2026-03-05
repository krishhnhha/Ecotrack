import type { Plugin } from 'vite';
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';

export function localDbPlugin(): Plugin {
    let db: DatabaseSync;

    return {
        name: 'vite-plugin-local-db',
        configureServer(server) {
            server.middlewares.use(async (req, res, next) => {
                // Only intercept API calls if DATABASE_URL is NOT set
                if (process.env.DATABASE_URL) {
                    return next();
                }

                if (req.url === '/api/init' && req.method === 'GET') {
                    try {
                        if (!db) db = new DatabaseSync('local.db');

                        // SQLite schema
                        db.exec(`
              CREATE TABLE IF NOT EXISTS households (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                owner_name TEXT NOT NULL,
                address TEXT NOT NULL,
                ward TEXT NOT NULL,
                members INTEGER DEFAULT 1,
                phone TEXT,
                registration_date TEXT,
                is_active INTEGER DEFAULT 1
              );
              CREATE TABLE IF NOT EXISTS waste_categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                type TEXT NOT NULL,
                description TEXT,
                disposal_method TEXT,
                color TEXT DEFAULT '#10b981'
              );
              CREATE TABLE IF NOT EXISTS collection_schedules (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                household_id INTEGER NOT NULL REFERENCES households(id) ON DELETE CASCADE,
                waste_category_id INTEGER NOT NULL REFERENCES waste_categories(id),
                day_of_week TEXT NOT NULL,
                time_slot TEXT,
                collector_team TEXT,
                schedule_date TEXT,
                status TEXT DEFAULT 'Scheduled'
              );
              CREATE TABLE IF NOT EXISTS complaints (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                household_id INTEGER NOT NULL REFERENCES households(id),
                subject TEXT NOT NULL,
                description TEXT,
                category TEXT,
                priority TEXT DEFAULT 'Medium',
                status TEXT DEFAULT 'Open',
                filed_date TEXT,
                resolved_date TEXT
              );
              CREATE TABLE IF NOT EXISTS penalties (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                household_id INTEGER NOT NULL REFERENCES households(id),
                violation TEXT NOT NULL,
                description TEXT,
                amount REAL DEFAULT 0,
                issued_date TEXT,
                due_date TEXT,
                status TEXT DEFAULT 'Pending'
              );
              CREATE TABLE IF NOT EXISTS recycling_units (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                location TEXT,
                capacity_tons REAL DEFAULT 0,
                current_load_tons REAL DEFAULT 0,
                waste_category_id INTEGER REFERENCES waste_categories(id),
                operational_status TEXT DEFAULT 'Active',
                contact TEXT
              );
            `);

                        // Seed only if empty
                        const householdsCount = db.prepare('SELECT COUNT(*) as count FROM households').get() as any;
                        if (householdsCount.count === 0) {
                            const seedSql = fs.readFileSync('./src/db/schema.ts', 'utf-8');
                            const seedMatch = seedSql.match(/export const SEED_SQL = `([\s\S]*?)`;/);
                            if (seedMatch && seedMatch[1]) {
                                const lines = seedMatch[1].split(';').filter(l => l.trim().length > 0);
                                for (const line of lines) {
                                    db.exec(line + ';');
                                }
                            }
                        }

                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify({ success: true, message: 'Local SQLite DB initialized' }));
                        return;
                    } catch (err: any) {
                        console.error('Local DB init error:', err);
                        res.statusCode = 500;
                        res.end(JSON.stringify({ error: err.message }));
                        return;
                    }
                }

                if (req.url === '/api/query' && req.method === 'POST') {
                    let body = '';
                    req.on('data', chunk => { body += chunk; });
                    req.on('end', () => {
                        try {
                            if (!db) db = new DatabaseSync('local.db');
                            const { sql, params } = JSON.parse(body);

                            // SQLite handles ? natively, no need for $1 conversion
                            const stmt = db.prepare(sql);

                            if (sql.trim().toUpperCase().startsWith('SELECT')) {
                                const rows = stmt.all(...(params || []));
                                const columns = rows.length > 0 ? Object.keys(rows[0]) : [];
                                const values = rows.map(r => columns.map(c => (r as any)[c]));
                                res.setHeader('Content-Type', 'application/json');
                                res.end(JSON.stringify({ columns, values }));
                            } else {
                                stmt.run(...(params || []));
                                res.setHeader('Content-Type', 'application/json');
                                res.end(JSON.stringify({ columns: [], values: [] }));
                            }
                        } catch (err: any) {
                            console.error('Local DB query error:', err);
                            res.statusCode = 500;
                            res.end(JSON.stringify({ error: err.message }));
                        }
                    });
                    return;
                }

                next();
            });
        }
    };
}
