import { useState, useEffect, useCallback } from 'react';
import { useDatabase, useRefreshTick } from '../db/DatabaseContext';
import { Plus, Search, Edit2, Trash2, X, Database } from 'lucide-react';

const QUERY = `SELECT c.*, h.owner_name FROM complaints c JOIN households h ON c.household_id = h.id ORDER BY c.filed_date DESC`;

export default function Complaints() {
  const { execSQL, runSQL, toObjects } = useDatabase();
  const [data, setData] = useState<any[]>([]);
  const [households, setHouseholds] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ household_id: '', subject: '', description: '', category: 'Missed Pickup', priority: 'Medium', status: 'Open', filed_date: new Date().toISOString().split('T')[0], resolved_date: '' });

  const refreshTick = useRefreshTick();

  const loadData = useCallback(async () => {
    try {
      const r = await execSQL(QUERY); setData(r.length ? toObjects(r[0]) : []);
      const rh = await execSQL("SELECT id, owner_name FROM households ORDER BY owner_name");
      setHouseholds(rh.length ? toObjects(rh[0]) : []);
    } catch (e) { console.error(e); }
  }, [execSQL, toObjects]);

  useEffect(() => { loadData(); }, [loadData, refreshTick]);

  const filtered = data.filter(c => {
    const q = search.toLowerCase();
    return c.subject?.toLowerCase().includes(q) || c.owner_name?.toLowerCase().includes(q) || c.category?.toLowerCase().includes(q) || c.status?.toLowerCase().includes(q);
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        await runSQL("UPDATE complaints SET household_id=?, subject=?, description=?, category=?, priority=?, status=?, filed_date=?, resolved_date=? WHERE id=?",
          [+form.household_id, form.subject, form.description, form.category, form.priority, form.status, form.filed_date, form.resolved_date || null, editing.id]);
      } else {
        await runSQL("INSERT INTO complaints (household_id, subject, description, category, priority, status, filed_date, resolved_date) VALUES (?,?,?,?,?,?,?,?)",
          [+form.household_id, form.subject, form.description, form.category, form.priority, form.status, form.filed_date, form.resolved_date || null]);
      }
      loadData(); closeModal();
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this complaint?')) return;
    try { await runSQL("DELETE FROM complaints WHERE id=?", [id]); loadData(); } catch (err) { console.error(err); }
  };

  const openEdit = (c: any) => {
    setEditing(c);
    setForm({ household_id: String(c.household_id), subject: c.subject, description: c.description || '', category: c.category, priority: c.priority, status: c.status, filed_date: c.filed_date, resolved_date: c.resolved_date || '' });
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setEditing(null); setForm({ household_id: '', subject: '', description: '', category: 'Missed Pickup', priority: 'Medium', status: 'Open', filed_date: new Date().toISOString().split('T')[0], resolved_date: '' }); };

  const priorityColors: Record<string, string> = { Low: 'bg-blue-500/15 text-blue-400', Medium: 'bg-amber-500/15 text-amber-400', High: 'bg-orange-500/15 text-orange-400', Critical: 'bg-red-500/15 text-red-400' };
  const statusColors: Record<string, string> = { Open: 'bg-yellow-500/15 text-yellow-400', 'In Progress': 'bg-blue-500/15 text-blue-400', Resolved: 'bg-green-500/15 text-green-400' };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Complaints</h1>
          <p className="text-sm text-gray-400 mt-1 font-mono">SELECT c.*, h.owner_name ... JOIN</p>
        </div>
        <button onClick={() => { closeModal(); setShowModal(true); }} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> File Complaint
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input type="text" placeholder="Search complaints..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-sm text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none" />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left px-4 py-3 text-gray-400 font-medium text-xs uppercase">ID</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium text-xs uppercase">Subject</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium text-xs uppercase hidden md:table-cell">Household</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium text-xs uppercase hidden lg:table-cell">Category</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium text-xs uppercase">Priority</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium text-xs uppercase">Status</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium text-xs uppercase hidden md:table-cell">Filed</th>
                <th className="text-right px-4 py-3 text-gray-400 font-medium text-xs uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{c.id}</td>
                  <td className="px-4 py-3">
                    <p className="text-white font-medium">{c.subject}</p>
                    <p className="text-xs text-gray-500 line-clamp-1">{c.description}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-300 hidden md:table-cell">{c.owner_name}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs hidden lg:table-cell">{c.category}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${priorityColors[c.priority] || ''}`}>{c.priority}</span></td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${statusColors[c.status] || ''}`}>{c.status}</span></td>
                  <td className="px-4 py-3 text-gray-400 text-xs hidden md:table-cell">{c.filed_date}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDelete(c.id)} className="p-1.5 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-500">No complaints found</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-gray-800">
          <span className="text-xs text-gray-500 font-mono flex items-center gap-1.5"><Database className="w-3 h-3" /> {filtered.length} rows | JOIN households</span>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={closeModal}>
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white">{editing ? 'UPDATE complaint' : 'INSERT INTO complaints'}</h2>
              <button onClick={closeModal} className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-400 mb-1 block">Household (FK)</label>
                <select required value={form.household_id} onChange={e => setForm({ ...form, household_id: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:border-emerald-500 focus:outline-none">
                  <option value="">Select household...</option>
                  {households.map(h => <option key={h.id} value={h.id}>{h.owner_name} (id:{h.id})</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-400 mb-1 block">Subject</label>
                <input type="text" required value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:border-emerald-500 focus:outline-none" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-400 mb-1 block">Description</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:border-emerald-500 focus:outline-none resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-400 mb-1 block">Category</label>
                  <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:border-emerald-500 focus:outline-none">
                    {['Missed Pickup', 'Improper Disposal', 'Overflow', 'Smell', 'Other'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-400 mb-1 block">Priority</label>
                  <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:border-emerald-500 focus:outline-none">
                    {['Low', 'Medium', 'High', 'Critical'].map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-400 mb-1 block">Status</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:border-emerald-500 focus:outline-none">
                    {['Open', 'In Progress', 'Resolved'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-400 mb-1 block">Filed Date</label>
                  <input type="date" value={form.filed_date} onChange={e => setForm({ ...form, filed_date: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:border-emerald-500 focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-400 mb-1 block">Resolved Date (optional)</label>
                <input type="date" value={form.resolved_date} onChange={e => setForm({ ...form, resolved_date: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:border-emerald-500 focus:outline-none" />
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
