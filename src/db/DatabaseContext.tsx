import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';

export interface SQLLogEntry {
  id: number;
  sql: string;
  timestamp: string;
  error?: string;
}

interface QueryResult {
  columns: string[];
  values: any[][];
}

interface DatabaseContextType {
  db: true | null;
  loading: boolean;
  error: string | null;
  execSQL: (sql: string, params?: any[]) => Promise<QueryResult[]>;
  runSQL: (sql: string, params?: any[]) => Promise<void>;
  toObjects: (result: QueryResult) => Record<string, any>[];
  sqlLog: SQLLogEntry[];
  clearLog: () => void;
  refresh: () => void;
}

const DatabaseContext = createContext<DatabaseContextType | null>(null);

export function useDatabase() {
  const ctx = useContext(DatabaseContext);
  if (!ctx) throw new Error('useDatabase must be used within DatabaseProvider');
  return ctx;
}

// Detect API base URL: in production (Vercel) use relative path; in local dev also relative
const API_BASE = '/api';

async function apiQuery(sql: string, params?: any[]): Promise<QueryResult> {
  const res = await fetch(`${API_BASE}/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sql, params }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || `API error: ${res.status}`);
  }

  return {
    columns: data.columns ?? [],
    values: data.values ?? [],
  };
}

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sqlLog, setSqlLog] = useState<SQLLogEntry[]>([]);
  const [refreshTick, setRefreshTick] = useState(0);
  const logIdRef = useRef(0);

  // Check DB connectivity on mount by running a simple query
  useEffect(() => {
    async function checkConnection() {
      try {
        await apiQuery('SELECT 1 AS ok');
        setLoading(false);
        setError(null);
      } catch (err: any) {
        // If the DB isn't initialized yet, try hitting /api/init
        try {
          const initRes = await fetch(`${API_BASE}/init`);
          if (initRes.ok) {
            setLoading(false);
            setError(null);
          } else {
            const d = await initRes.json();
            throw new Error(d.error || 'Init failed');
          }
        } catch (initErr: any) {
          setError(initErr.message || 'Could not connect to database');
          setLoading(false);
        }
      }
    }
    checkConnection();
  }, []);

  // Auto-refresh every 15 seconds so all users see live data
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshTick(t => t + 1);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const addLog = useCallback((sql: string, error?: string) => {
    const entry: SQLLogEntry = {
      id: ++logIdRef.current,
      sql: sql.trim().substring(0, 500),
      timestamp: new Date().toLocaleTimeString(),
      error,
    };
    setSqlLog(prev => [entry, ...prev].slice(0, 200));
  }, []);

  // execSQL: runs a SELECT and returns [{columns, values}] — same shape as before
  const execSQL = useCallback(async (sql: string, params?: any[]): Promise<QueryResult[]> => {
    try {
      const result = await apiQuery(sql, params);
      addLog(sql);
      // If no data returned, return empty array (mirrors sql.js behavior)
      if (result.columns.length === 0) return [];
      return [result];
    } catch (err: any) {
      addLog(sql, err.message);
      throw err;
    }
  }, [addLog]);

  // runSQL: runs INSERT/UPDATE/DELETE and returns nothing
  const runSQL = useCallback(async (sql: string, params?: any[]): Promise<void> => {
    try {
      await apiQuery(sql, params);
      addLog(sql);
    } catch (err: any) {
      addLog(sql, err.message);
      throw err;
    }
  }, [addLog]);

  const toObjects = useCallback((result: QueryResult): Record<string, any>[] => {
    return result.values.map(row => {
      const obj: Record<string, any> = {};
      result.columns.forEach((col, i) => (obj[col] = row[i]));
      return obj;
    });
  }, []);

  const clearLog = useCallback(() => setSqlLog([]), []);

  const refresh = useCallback(() => setRefreshTick(t => t + 1), []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20"></div>
            <div className="absolute inset-0 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin"></div>
            <div className="absolute inset-3 rounded-full border-4 border-teal-400/20"></div>
            <div className="absolute inset-3 rounded-full border-4 border-teal-400 border-b-transparent animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Connecting to Database</h2>
          <p className="text-gray-400 text-sm">Connecting to PostgreSQL via Neon...</p>
          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-emerald-400 font-mono">
            <span className="inline-block w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
            Checking connection...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="bg-red-950/50 border border-red-500/30 rounded-2xl p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
          </div>
          <h2 className="text-xl font-bold text-red-300 mb-2">Database Connection Error</h2>
          <p className="text-red-400/80 text-sm font-mono mb-2">{error}</p>
          <p className="text-gray-500 text-xs mb-4">Make sure DATABASE_URL is set in your environment variables.</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg text-sm transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <DatabaseContext.Provider value={{ db: true, loading, error, execSQL, runSQL, toObjects, sqlLog, clearLog, refresh }}>
      {/* Pass refreshTick down as key trigger via context consumers' useEffect deps */}
      <RefreshContext.Provider value={refreshTick}>
        {children}
      </RefreshContext.Provider>
    </DatabaseContext.Provider>
  );
}

// Secondary context for triggering re-fetches in all components on the 15s interval
export const RefreshContext = createContext<number>(0);
export function useRefreshTick() {
  return useContext(RefreshContext);
}
