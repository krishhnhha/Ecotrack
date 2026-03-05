import { useState } from 'react';
import { useDatabase } from '../db/DatabaseContext';
import { Play, Trash2, BookOpen, Clock, AlertCircle, CheckCircle, ChevronDown, ChevronUp, Copy } from 'lucide-react';

const EXAMPLE_QUERIES = [
  { label: 'All Households', sql: 'SELECT * FROM households;' },
  { label: 'All Waste Categories', sql: 'SELECT * FROM waste_categories;' },
  { label: 'Active Households Count by Ward', sql: "SELECT ward, COUNT(*) as household_count, SUM(members) as total_members\nFROM households\nWHERE is_active = 1\nGROUP BY ward\nORDER BY ward;" },
  { label: 'Collection Schedules (3-table JOIN)', sql: "SELECT cs.id, h.owner_name, wc.name as waste_type,\n  cs.day_of_week, cs.time_slot, cs.collector_team, cs.status\nFROM collection_schedules cs\nJOIN households h ON cs.household_id = h.id\nJOIN waste_categories wc ON cs.waste_category_id = wc.id\nORDER BY cs.schedule_date;" },
  { label: 'Schedule Status Summary', sql: "SELECT status, COUNT(*) as count,\n  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM collection_schedules), 1) as percentage\nFROM collection_schedules\nGROUP BY status;" },
  { label: 'Complaints with Household Info', sql: "SELECT c.id, c.subject, c.priority, c.status, c.category,\n  h.owner_name, h.ward, c.filed_date\nFROM complaints c\nJOIN households h ON c.household_id = h.id\nORDER BY c.filed_date DESC;" },
  { label: 'Open/Critical Complaints', sql: "SELECT c.subject, c.priority, h.owner_name, h.ward\nFROM complaints c\nJOIN households h ON c.household_id = h.id\nWHERE c.status != 'Resolved' AND c.priority IN ('High', 'Critical')\nORDER BY\n  CASE c.priority WHEN 'Critical' THEN 1 WHEN 'High' THEN 2 END;" },
  { label: 'Penalty Summary by Status', sql: "SELECT status, COUNT(*) as count,\n  SUM(amount) as total_amount,\n  AVG(amount) as avg_amount\nFROM penalties\nGROUP BY status;" },
  { label: 'Households with Most Penalties', sql: "SELECT h.owner_name, h.ward, COUNT(p.id) as penalty_count,\n  SUM(p.amount) as total_fines\nFROM penalties p\nJOIN households h ON p.household_id = h.id\nGROUP BY p.household_id\nORDER BY total_fines DESC;" },
  { label: 'Recycling Unit Utilization', sql: "SELECT ru.name, wc.name as waste_type,\n  ru.capacity_tons, ru.current_load_tons,\n  ROUND(ru.current_load_tons * 100.0 / ru.capacity_tons, 1) as utilization_pct,\n  ru.operational_status\nFROM recycling_units ru\nJOIN waste_categories wc ON ru.waste_category_id = wc.id\nORDER BY utilization_pct DESC;" },
  { label: 'Full Database Statistics', sql: "SELECT 'households' as tbl, COUNT(*) as rows FROM households\nUNION ALL\nSELECT 'waste_categories', COUNT(*) FROM waste_categories\nUNION ALL\nSELECT 'collection_schedules', COUNT(*) FROM collection_schedules\nUNION ALL\nSELECT 'complaints', COUNT(*) FROM complaints\nUNION ALL\nSELECT 'penalties', COUNT(*) FROM penalties\nUNION ALL\nSELECT 'recycling_units', COUNT(*) FROM recycling_units;" },
  { label: 'Table Info (PostgreSQL)', sql: "SELECT table_name, column_name, data_type FROM information_schema.columns WHERE table_schema = 'public' ORDER BY table_name, ordinal_position;" },
];

export default function SQLConsole() {
  const { execSQL, sqlLog, clearLog } = useDatabase();
  const [query, setQuery] = useState("SELECT * FROM households;");
  const [results, setResults] = useState<{ columns: string[]; values: any[][] }[] | null>(null);
  const [error, setError] = useState('');
  const [execTime, setExecTime] = useState(0);
  const [showExamples, setShowExamples] = useState(true);
  const [showLog, setShowLog] = useState(false);
  const [showSchema, setShowSchema] = useState(false);

  const handleExecute = async () => {
    if (!query.trim()) return;
    setError('');
    setResults(null);
    const start = performance.now();
    try {
      const r = await execSQL(query);
      setExecTime(performance.now() - start);
      setResults(r);
    } catch (err: any) {
      setExecTime(performance.now() - start);
      setError(err.message || 'Unknown error');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleExecute();
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard?.writeText(text);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">SQL Console</h1>
        <p className="text-sm text-gray-400 mt-1">Execute raw SQL queries against PostgreSQL (Neon)</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main query area */}
        <div className="lg:col-span-3 space-y-4">
          {/* Query editor */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800 bg-gray-950">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/70"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500/70"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500/70"></div>
                </div>
                <span className="text-xs text-gray-500 font-mono ml-2">PostgreSQL Console</span>
              </div>
              <span className="text-[10px] text-gray-600 font-mono">Ctrl+Enter to execute</span>
            </div>
            <textarea
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={6}
              className="w-full px-4 py-3 bg-gray-950 text-emerald-300 font-mono text-sm focus:outline-none resize-y placeholder-gray-600"
              placeholder="Enter your SQL query here..."
              spellCheck={false}
            />
            <div className="flex items-center justify-between px-4 py-2 border-t border-gray-800 bg-gray-950">
              <div className="flex items-center gap-2">
                {execTime > 0 && (
                  <span className="text-[10px] text-gray-500 font-mono flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {execTime.toFixed(2)}ms
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setQuery('')} className="px-3 py-1.5 text-xs text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors">Clear</button>
                <button onClick={handleExecute} className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium transition-colors">
                  <Play className="w-3.5 h-3.5" /> Execute
                </button>
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-950/50 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-300">Query Error</p>
                <p className="text-xs text-red-400/80 font-mono mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Results */}
          {results && results.length === 0 && !error && (
            <div className="bg-green-950/30 border border-green-500/20 rounded-xl p-4 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <div>
                <p className="text-sm font-medium text-green-300">Query executed successfully</p>
                <p className="text-xs text-green-400/60 font-mono">No rows returned (statement executed in {execTime.toFixed(2)}ms)</p>
              </div>
            </div>
          )}

          {results && results.map((result, ri) => (
            <div key={ri} className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
              <div className="px-4 py-2 border-b border-gray-800 flex items-center justify-between">
                <span className="text-xs text-gray-400 font-mono">Result Set {ri + 1} — {result.values.length} row{result.values.length !== 1 ? 's' : ''} × {result.columns.length} column{result.columns.length !== 1 ? 's' : ''}</span>
                <button onClick={() => {
                  const csv = [result.columns.join(','), ...result.values.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
                  copyToClipboard(csv);
                }} className="text-xs text-gray-500 hover:text-white flex items-center gap-1 transition-colors">
                  <Copy className="w-3 h-3" /> Copy CSV
                </button>
              </div>
              <div className="overflow-x-auto max-h-96">
                <table className="w-full text-sm">
                  <thead className="sticky top-0">
                    <tr className="bg-gray-800/80">
                      {result.columns.map((col, ci) => (
                        <th key={ci} className="text-left px-3 py-2 text-xs text-amber-400 font-mono font-medium whitespace-nowrap">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.values.map((row, vi) => (
                      <tr key={vi} className="border-t border-gray-800/50 hover:bg-gray-800/30">
                        {row.map((val, ci) => (
                          <td key={ci} className="px-3 py-2 text-xs font-mono whitespace-nowrap">
                            {val === null ? <span className="text-gray-600 italic">NULL</span> :
                              typeof val === 'number' ? <span className="text-cyan-400">{val}</span> :
                                <span className="text-gray-300">{String(val)}</span>}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Example queries */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
            <button onClick={() => setShowExamples(!showExamples)} className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-800/50 transition-colors">
              <span className="flex items-center gap-2 text-sm font-medium text-white"><BookOpen className="w-4 h-4 text-amber-400" /> Example Queries</span>
              {showExamples ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>
            {showExamples && (
              <div className="px-2 pb-2 max-h-80 overflow-y-auto">
                {EXAMPLE_QUERIES.map((eq, i) => (
                  <button key={i} onClick={() => setQuery(eq.sql)} className="w-full text-left px-3 py-2 rounded-lg text-xs text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">
                    {eq.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Schema */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
            <button onClick={() => setShowSchema(!showSchema)} className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-800/50 transition-colors">
              <span className="flex items-center gap-2 text-sm font-medium text-white">📋 Database Schema</span>
              {showSchema ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>
            {showSchema && (
              <div className="px-3 pb-3 space-y-2 max-h-72 overflow-y-auto">
                {['households', 'waste_categories', 'collection_schedules', 'complaints', 'penalties', 'recycling_units'].map(t => (
                  <div key={t} className="bg-gray-950 rounded-lg p-2">
                    <p className="text-[10px] font-mono text-emerald-400 font-bold">{t}</p>
                    <button onClick={() => setQuery(`SELECT * FROM ${t};`)} className="text-[9px] text-gray-500 hover:text-amber-400 font-mono mt-0.5 transition-colors">
                      → SELECT *
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Query Log */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
            <button onClick={() => setShowLog(!showLog)} className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-800/50 transition-colors">
              <span className="flex items-center gap-2 text-sm font-medium text-white"><Clock className="w-4 h-4 text-blue-400" /> Query Log <span className="text-[10px] text-gray-500">({sqlLog.length})</span></span>
              {showLog ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>
            {showLog && (
              <div className="px-3 pb-3">
                {sqlLog.length > 0 && (
                  <button onClick={clearLog} className="text-[10px] text-gray-500 hover:text-red-400 flex items-center gap-1 mb-2 transition-colors">
                    <Trash2 className="w-3 h-3" /> Clear log
                  </button>
                )}
                <div className="space-y-1.5 max-h-60 overflow-y-auto">
                  {sqlLog.slice(0, 50).map(entry => (
                    <button key={entry.id} onClick={() => setQuery(entry.sql)} className="w-full text-left bg-gray-950 rounded-lg p-2 hover:bg-gray-800 transition-colors">
                      <p className={`text-[10px] font-mono truncate ${entry.error ? 'text-red-400' : 'text-gray-400'}`}>{entry.sql}</p>
                      <p className="text-[9px] text-gray-600 mt-0.5">{entry.timestamp}{entry.error && ` · ❌ ${entry.error}`}</p>
                    </button>
                  ))}
                  {sqlLog.length === 0 && <p className="text-xs text-gray-600 text-center py-2">No queries yet</p>}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
