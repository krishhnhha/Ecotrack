import { useState, useEffect, useCallback } from 'react';
import { useDatabase, useRefreshTick } from '../db/DatabaseContext';
import { Plus, Search, Edit2, Trash2, X, Users, Database } from 'lucide-react';

export default function Households() {
  const { execSQL, runSQL, toObjects } = useDatabase();
  const [data, setData] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ owner_name: '', address: '', ward: 'Ward A', members: 1, phone: '', registration_date: new Date().toISOString().split('T')[0], is_active: 1 });

  const refreshTick = useRefreshTick();

  const loadData = useCallback(async () => {
    try {
      const r = await execSQL("SELECT * FROM households ORDER BY id DESC");
      setData(r.length ? toObjects(r[0]) : []);
    } catch (e) { console.error(e); }
  }, [execSQL, toObjects]);

  useEffect(() => { loadData(); }, [loadData, refreshTick]);

  const filtered = data.filter(h => {
    const s = search.toLowerCase();
    return h.owner_name.toLowerCase().includes(s) || h.address.toLowerCase().includes(s) || h.ward.toLowerCase().includes(s) || h.phone?.toLowerCase().includes(s);
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        await runSQL("UPDATE households SET owner_name=?, address=?, ward=?, members=?, phone=?, registration_date=?, is_active=? WHERE id=?",
          [form.owner_name, form.address, form.ward, form.members, form.phone, form.registration_date, form.is_active, editing.id]);
      } else {
        await runSQL("INSERT INTO households (owner_name, address, ward, members, phone, registration_date, is_active) VALUES (?,?,?,?,?,?,?)",
          [form.owner_name, form.address, form.ward, form.members, form.phone, form.registration_date, form.is_active]);
      }
      loadData();
      closeModal();
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this household? Related records may be affected.')) return;
    try {
      await runSQL("DELETE FROM households WHERE id=?", [id]);
      loadData();
    } catch (err) { console.error(err); }
  };

  const openEdit = (h: any) => {
    setEditing(h);
    setForm({ owner_name: h.owner_name, address: h.address, ward: h.ward, members: h.members, phone: h.phone || '', registration_date: h.registration_date, is_active: h.is_active });
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setEditing(null); setForm({ owner_name: '', address: '', ward: 'Ward A', members: 1, phone: '', registration_date: new Date().toISOString().split('T')[0], is_active: 1 }); };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Households</h1>
          <p className="text-sm text-gray-400 mt-1 font-mono">SELECT * FROM households</p>
        </div>
        <button onClick={() => { closeModal(); setShowModal(true); }} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> Add Household
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input type="text" placeholder="Search by name, address, ward, phone..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-sm text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none" />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left px-4 py-3 text-gray-400 font-medium text-xs uppercase">ID</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium text-xs uppercase">Owner</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium text-xs uppercase hidden md:table-cell">Address</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium text-xs uppercase">Ward</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium text-xs uppercase hidden sm:table-cell">Members</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium text-xs uppercase hidden lg:table-cell">Phone</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium text-xs uppercase">Status</th>
                <th className="text-right px-4 py-3 text-gray-400 font-medium text-xs uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(h => (
                <tr key={h.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{h.id}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center"><Users className="w-4 h-4 text-emerald-400" /></div>
                      <div>
                        <p className="text-white font-medium">{h.owner_name}</p>
                        <p className="text-xs text-gray-500 md:hidden">{h.address}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-300 hidden md:table-cell">{h.address}</td>
                  <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-400 text-xs font-medium">{h.ward}</span></td>
                  <td className="px-4 py-3 text-gray-300 hidden sm:table-cell">{h.members}</td>
                  <td className="px-4 py-3 text-gray-400 font-mono text-xs hidden lg:table-cell">{h.phone}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${h.is_active ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
                      {h.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(h)} className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDelete(h.id)} className="p-1.5 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-500">No households found</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-gray-800 flex items-center justify-between">
          <span className="text-xs text-gray-500 font-mono flex items-center gap-1.5"><Database className="w-3 h-3" /> {filtered.length} of {data.length} rows</span>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={closeModal}>
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white">{editing ? 'UPDATE household' : 'INSERT INTO households'}</h2>
              <button onClick={closeModal} className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-xs font-medium text-gray-400 mb-1 block">Owner Name</label>
                  <input type="text" required value={form.owner_name} onChange={e => setForm({ ...form, owner_name: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:border-emerald-500 focus:outline-none" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-medium text-gray-400 mb-1 block">Address</label>
                  <input type="text" required value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:border-emerald-500 focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-400 mb-1 block">Ward</label>
                  <select value={form.ward} onChange={e => setForm({ ...form, ward: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:border-emerald-500 focus:outline-none">
                    {['Ward A', 'Ward B', 'Ward C', 'Ward D', 'Ward E'].map(w => <option key={w} value={w}>{w}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-400 mb-1 block">Members</label>
                  <input type="number" min={1} value={form.members} onChange={e => setForm({ ...form, members: +e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:border-emerald-500 focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-400 mb-1 block">Phone</label>
                  <input type="text" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:border-emerald-500 focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-400 mb-1 block">Registration Date</label>
                  <input type="date" value={form.registration_date} onChange={e => setForm({ ...form, registration_date: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:border-emerald-500 focus:outline-none" />
                </div>
                <div className="col-span-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.is_active === 1} onChange={e => setForm({ ...form, is_active: e.target.checked ? 1 : 0 })} className="w-4 h-4 rounded border-gray-600 text-emerald-500 focus:ring-emerald-500 bg-gray-800" />
                    <span className="text-sm text-gray-300">Active Household</span>
                  </label>
                </div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-2 mt-2">
                <pre className="text-[10px] font-mono text-amber-400 overflow-x-auto">
                  {editing
                    ? `UPDATE households SET owner_name='${form.owner_name}', ward='${form.ward}', ... WHERE id=${editing.id};`
                    : `INSERT INTO households (owner_name, address, ward, ...) VALUES ('${form.owner_name}', '${form.address}', '${form.ward}', ...);`
                  }
                </pre>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={closeModal} className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-lg text-sm font-medium bg-emerald-600 hover:bg-emerald-500 text-white transition-colors">{editing ? 'Update' : 'Insert'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
