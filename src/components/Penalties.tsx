import { useState, useEffect, useCallback } from 'react';
import { useDatabase, useRefreshTick } from '../db/DatabaseContext';
import { Plus, Search, Edit2, Trash2, X, Database, IndianRupee } from 'lucide-react';

const QUERY = `SELECT p.*, h.owner_name FROM penalties p JOIN households h ON p.household_id = h.id ORDER BY p.issued_date DESC`;

export default function Penalties() {
  const { execSQL, runSQL, toObjects } = useDatabase();
  const [data, setData] = useState<any[]>([]);
  const [households, setHouseholds] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [stats, setStats] = useState({ pending: 0, overdue: 0, paid: 0 });
  const [form, setForm] = useState({ household_id: '', violation: 'Improper Segregation', description: '', amount: 500, issued_date: new Date().toISOString().split('T')[0], due_date: '', status: 'Pending' });

  const refreshTick = useRefreshTick();

  const loadData = useCallback(async () => {
    try {
      const r = await execSQL(QUERY); setData(r.length ? toObjects(r[0]) : []);
      const rh = await execSQL("SELECT id, owner_name FROM households ORDER BY owner_name");
      setHouseholds(rh.length ? toObjects(rh[0]) : []);
      const sp = await execSQL("SELECT COALESCE(SUM(amount),0) as t FROM penalties WHERE status='Pending'");
      const so = await execSQL("SELECT COALESCE(SUM(amount),0) as t FROM penalties WHERE status='Overdue'");
      const sc = await execSQL("SELECT COALESCE(SUM(amount),0) as t FROM penalties WHERE status='Paid'");
      setStats({ pending: sp[0]?.values[0][0] || 0, overdue: so[0]?.values[0][0] || 0, paid: sc[0]?.values[0][0] || 0 });
    } catch (e) { console.error(e); }
  }, [execSQL, toObjects]);

  useEffect(() => { loadData(); }, [loadData, refreshTick]);

  const filtered = data.filter(p => {
    const q = search.toLowerCase();
    return p.violation?.toLowerCase().includes(q) || p.owner_name?.toLowerCase().includes(q) || p.status?.toLowerCase().includes(q);
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        await runSQL("UPDATE penalties SET household_id=?, violation=?, description=?, amount=?, issued_date=?, due_date=?, status=? WHERE id=?",
          [+form.household_id, form.violation, form.description, form.amount, form.issued_date, form.due_date, form.status, editing.id]);
      } else {
        await runSQL("INSERT INTO penalties (household_id, violation, description, amount, issued_date, due_date, status) VALUES (?,?,?,?,?,?,?)",
          [+form.household_id, form.violation, form.description, form.amount, form.issued_date, form.due_date, form.status]);
      }
      loadData(); closeModal();
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this penalty?')) return;
    try { await runSQL("DELETE FROM penalties WHERE id=?", [id]); loadData(); } catch (err) { console.error(err); }
  };

  const openEdit = (p: any) => {
    setEditing(p);
    setForm({ household_id: String(p.household_id), violation: p.violation, description: p.description || '', amount: p.amount, issued_date: p.issued_date, due_date: p.due_date || '', status: p.status });
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setEditing(null); setForm({ household_id: '', violation: 'Improper Segregation', description: '', amount: 500, issued_date: new Date().toISOString().split('T')[0], due_date: '', status: 'Pending' }); };

  const statusColors: Record<string, string> = { Pending: 'bg-yellow-500/15 text-yellow-400', Overdue: 'bg-red-500/15 text-red-400', Paid: 'bg-green-500/15 text-green-400' };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Penalties</h1>
          <p className="text-sm text-gray-400 mt-1 font-mono">SELECT p.*, h.owner_name ... JOIN</p>
        </div>
        <button onClick={() => { closeModal(); setShowModal(true); }} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> Issue Penalty
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Pending', value: stats.pending, color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' },
          { label: 'Overdue', value: stats.overdue, color: 'text-red-400 bg-red-500/10 border-red-500/20' },
          { label: 'Collected', value: stats.paid, color: 'text-green-400 bg-green-500/10 border-green-500/20' },
        ].map(s => (
          <div key={s.label} className={`rounded-xl border p-4 ${s.color}`}>
            <p className="text-xs font-medium opacity-70">{s.label}</p>
            <p className="text-2xl font-bold mt-1 flex items-center gap-1"><IndianRupee className="w-5 h-5" />{Number(s.value).toLocaleString()}</p>
            <p className="text-[10px] font-mono mt-1 opacity-50">SUM(amount) WHERE status='{s.label}'</p>
          </div>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input type="text" placeholder="Search penalties..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-sm text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none" />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left px-4 py-3 text-gray-400 font-medium text-xs uppercase">ID</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium text-xs uppercase">Household</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium text-xs uppercase">Violation</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium text-xs uppercase hidden md:table-cell">Amount</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium text-xs uppercase hidden lg:table-cell">Issued</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium text-xs uppercase hidden lg:table-cell">Due</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium text-xs uppercase">Status</th>
                <th className="text-right px-4 py-3 text-gray-400 font-medium text-xs uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{p.id}</td>
                  <td className="px-4 py-3 text-white font-medium">{p.owner_name}</td>
                  <td className="px-4 py-3">
                    <p className="text-gray-300">{p.violation}</p>
                    <p className="text-xs text-gray-500 line-clamp-1">{p.description}</p>
                  </td>
                  <td className="px-4 py-3 text-emerald-400 font-mono font-medium hidden md:table-cell">₹{Number(p.amount).toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs hidden lg:table-cell">{p.issued_date}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs hidden lg:table-cell">{p.due_date}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${statusColors[p.status] || ''}`}>{p.status}</span></td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-500">No penalties found</td></tr>}
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
              <h2 className="text-lg font-bold text-white">{editing ? 'UPDATE penalty' : 'INSERT INTO penalties'}</h2>
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-400 mb-1 block">Violation</label>
                  <select value={form.violation} onChange={e => setForm({ ...form, violation: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:border-emerald-500 focus:outline-none">
                    {['Improper Segregation', 'Illegal Dumping', 'Hazardous Violation', 'Missed Schedule'].map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-400 mb-1 block">Amount (₹)</label>
                  <input type="number" min={0} step={50} value={form.amount} onChange={e => setForm({ ...form, amount: +e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:border-emerald-500 focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-400 mb-1 block">Description</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:border-emerald-500 focus:outline-none resize-none" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-400 mb-1 block">Issued Date</label>
                  <input type="date" value={form.issued_date} onChange={e => setForm({ ...form, issued_date: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:border-emerald-500 focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-400 mb-1 block">Due Date</label>
                  <input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:border-emerald-500 focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-400 mb-1 block">Status</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:border-emerald-500 focus:outline-none">
                    {['Pending', 'Overdue', 'Paid'].map(s => <option key={s} value={s}>{s}</option>)}
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
