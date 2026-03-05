import { neon } from '@neondatabase/serverless';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Allow CORS for local dev
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    if (!process.env.DATABASE_URL) {
        return res.status(500).json({ error: 'DATABASE_URL environment variable is not set' });
    }

    try {
        const { sql, params } = req.body as { sql: string; params?: any[] };

        if (!sql || typeof sql !== 'string') {
            return res.status(400).json({ error: 'SQL query is required' });
        }

        const sql_fn = neon(process.env.DATABASE_URL);

        // Convert SQLite-style ? placeholders to PostgreSQL $1, $2, ... style
        let pgSql = sql;
        if (params && params.length > 0) {
            let i = 0;
            pgSql = sql.replace(/\?/g, () => `$${++i}`);
        }

        // Execute query
        const result = await sql_fn(pgSql, params ?? []);

        // For SELECT queries, result is an array of row objects
        // We return columns + rows in the same shape the frontend expects
        if (result.length > 0) {
            const columns = Object.keys(result[0]);
            const values = result.map((row: any) => columns.map(col => row[col]));
            return res.status(200).json({ columns, values });
        }

        // For INSERT/UPDATE/DELETE with no rows returned
        return res.status(200).json({ columns: [], values: [] });
    } catch (err: any) {
        console.error('Query error:', err);
        return res.status(500).json({ error: err.message || 'Database query failed' });
    }
}
