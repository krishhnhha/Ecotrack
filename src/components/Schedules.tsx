import { useState, useEffect, useCallback } from 'react';
import { useDatabase, useRefreshTick } from '../db/DatabaseContext';
import { Plus, Search, Edit2, Trash2, X, Database } from 'lucide-react';

const QUERY = `SELECT cs.*, h.owner_name, wc.name as waste_name, wc.color as waste_color
FROM collection_schedules cs
JOIN households h ON cs.household_id = h.id
JOIN waste_categories wc ON cs.waste_category_id = wc.id
ORDER BY cs.schedule_date DESC, cs.id DESC`;

export default function Schedules() {
  const { execSQL, runSQL, toObjects } = useDatabase();
  const [data, setData] = useState<any[]>([]);
  const [households, setHouseholds] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ household_id: '', waste_category_id: '', day_of_week: 'Monday', time_slot: '08:00 - 10:00', collector_team: 'Team Alpha', schedule_date: new Date().toISOString().split('T')[0], status: 'Scheduled' });

  const refreshTick = useRefreshTick();

  const loadData = useCallback(async () => {
    try {
      const r = await execSQL(QUERY);
      setData(r.length ? toObjects(r[0]) : []);
      const rh = await execSQL("SELECT id, owner_name FROM households WHERE is_active=1 ORDER BY owner_name");
      setHouseholds(rh.length ? toObjects(rh[0]) : []);
      const rc = await execSQL("SELECT id, name FROM waste_categories ORDER BY name");
      setCategories(rc.length ? toObjects(rc[0]) : []);
    } catch (e) { console.error(e); }
  }, [execSQL, toObjects]);

  useEffect(() => { loadData(); }, [loadData, refreshTick]);

  const filtered = data.filter(s => {
    const q = search.toLowerCase();
    return s.owner_name?.toLowerCase().includes(q) || s.waste_name?.toLowerCase().includes(q) || s.collector_team?.toLowerCase().includes(q) || s.day_of_week?.toLowerCase().includes(q) || s.status?.toLowerCase().includes(q);
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        await runSQL("UPDATE collection_schedules SET household_id=?, waste_category_id=?, day_of_week=?, time_slot=?, collector_team=?, schedule_date=?, status=? WHERE id=?",
          [+form.household_id, +form.waste_category_id, form.day_of_week, form.time_slot, form.collector_team, form.schedule_date, form.status, editing.id]);
      } else {
        await runSQL("INSERT INTO collection_schedules (household_id, waste_category_id, day_of_week, time_slot, collector_team, schedule_date, status) VALUES (?,?,?,?,?,?,?)",
          [+form.household_id, +form.waste_category_id, form.day_of_week, form.time_slot, form.collector_team, form.schedule_date, form.status]);
      }
      loadData(); closeModal();
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this schedule?')) return;
    try { await runSQL("DELETE FROM collection_schedules WHERE id=?", [id]); loadData(); } catch (err) { console.error(err); }
  };

  const openEdit = (s: any) => {
    setEditing(s);
    setForm({ household_id: String(s.household_id), waste_category_id: String(s.waste_category_id), day_of_week: s.day_of_week, time_slot: s.time_slot, collector_team: s.collector_team, schedule_date: s.schedule_date, status: s.status });
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setEditing(null); setForm({ household_id: '', waste_category_id: '', day_of_week: 'Monday', time_slot: '08:00 - 10:00', collector_team: 'Team Alpha', schedule_date: new Date().toISOString().split('T')[0], status: 'Scheduled' }); };

  const statusColors: Record<string, string> = { Scheduled: 'bg-blue-500/15 text-blue-400', Completed: 'bg-green-500/15 text-green-400', Missed: 'bg-red-500/15 text-red-400' };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Collection Schedules</h1>
          <p className="text-sm text-gray-400 mt-1 font-mono">JOIN households, waste_categories</p>
        </div>
        <button onClick={() => { closeModal(); setShowModal(true); }} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> Add Schedule
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input type="text" placeholder="Search schedules..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-sm text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none" />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left px-4 py-3 text-gray-400 font-medium text-xs uppercase">ID</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium text-xs uppercase">Household</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium text-xs uppercase">Waste Type</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium text-xs uppercase hidden md:table-cell">Day</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium text-xs uppercase hidden lg:table-cell">Time Slot</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium text-xs uppercase hidden lg:table-cell">Team</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium text-xs uppercase hidden md:table-cell">Date</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium text-xs uppercase">Status</th>
                <th className="text-right px-4 py-3 text-gray-400 font-medium text-xs uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{s.id}</td>
                  <td className="px-4 py-3 text-white font-medium">{s.owner_name}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.waste_color }}></span>
                      <span className="text-gray-300 text-xs">{s.waste_name}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-300 hidden md:table-cell">{s.day_of_week}</td>
                  <td className="px-4 py-3 text-gray-400 font-mono text-xs hidden lg:table-cell">{s.time_slot}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs hidden lg:table-cell">{s.collector_team}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs hidden md:table-cell">{s.schedule_date}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${statusColors[s.status] || ''}`}>{s.status}</span></td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(s)} className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDelete(s.id)} className="p-1.5 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={9} className="px-4 py-12 text-center text-gray-500">No schedules found</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-gray-800 flex items-center justify-between">
          <span className="text-xs text-gray-500 font-mono flex items-center gap-1.5"><Database className="w-3 h-3" /> {filtered.length} rows | 3-table JOIN</span>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={closeModal}>
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white">{editing ? 'UPDATE schedule' : 'INSERT INTO collection_schedules'}</h2>
              <button onClick={closeModal} className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-400 mb-1 block">Household (FK)</label>
                  <select required value={form.household_id} onChange={e => setForm({ ...form, household_id: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:border-emerald-500 focus:outline-none">
                    <option value="">Select...</option>
                    {households.map(h => <option key={h.id} value={h.id}>{h.owner_name} (id:{h.id})</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-400 mb-1 block">Waste Category (FK)</label>
                  <select required value={form.waste_category_id} onChange={e => setForm({ ...form, waste_category_id: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:border-emerald-500 focus:outline-none">
                    <option value="">Select...</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name} (id:{c.id})</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-400 mb-1 block">Day of Week</label>
                  <select value={form.day_of_week} onChange={e => setForm({ ...form, day_of_week: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:border-emerald-500 focus:outline-none">
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-400 mb-1 block">Time Slot</label>
                  <select value={form.time_slot} onChange={e => setForm({ ...form, time_slot: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:border-emerald-500 focus:outline-none">
                    {['06:00 - 08:00', '08:00 - 10:00', '10:00 - 12:00', '12:00 - 14:00', '14:00 - 16:00', '16:00 - 18:00'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-400 mb-1 block">Collector Team</label>
                  <select value={form.collector_team} onChange={e => setForm({ ...form, collector_team: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:border-emerald-500 focus:outline-none">
                    {['Team Alpha', 'Team Beta', 'Team Gamma', 'Team Delta'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-400 mb-1 block">Schedule Date</label>
                  <input type="date" value={form.schedule_date} onChange={e => setForm({ ...form, schedule_date: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:border-emerald-500 focus:outline-none" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-medium text-gray-400 mb-1 block">Status</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:border-emerald-500 focus:outline-none">
                    {['Scheduled', 'Completed', 'Missed'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={closeModal} className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-gray-800">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-lg text-sm font-medium bg-emerald-600 hover:bg-emerald-500 text-white">{editing ? 'Update' : 'Insert'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
