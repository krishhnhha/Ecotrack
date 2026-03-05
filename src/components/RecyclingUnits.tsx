import { useState, useEffect, useCallback } from 'react';
import { useDatabase, useRefreshTick } from '../db/DatabaseContext';
import { Plus, Edit2, Trash2, X, Recycle, MapPin, Phone } from 'lucide-react';

const QUERY = `SELECT ru.*, wc.name as waste_name, wc.color as waste_color
FROM recycling_units ru
LEFT JOIN waste_categories wc ON ru.waste_category_id = wc.id
ORDER BY ru.name`;

export default function RecyclingUnits() {
  const { execSQL, runSQL, toObjects } = useDatabase();
  const [data, setData] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: '', location: '', capacity_tons: 50, current_load_tons: 0, waste_category_id: '', operational_status: 'Active', contact: '' });

  const refreshTick = useRefreshTick();

  const loadData = useCallback(async () => {
    try {
      const r = await execSQL(QUERY); setData(r.length ? toObjects(r[0]) : []);
      const rc = await execSQL("SELECT id, name FROM waste_categories ORDER BY name");
      setCategories(rc.length ? toObjects(rc[0]) : []);
    } catch (e) { console.error(e); }
  }, [execSQL, toObjects]);

  useEffect(() => { loadData(); }, [loadData, refreshTick]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        await runSQL("UPDATE recycling_units SET name=?, location=?, capacity_tons=?, current_load_tons=?, waste_category_id=?, operational_status=?, contact=? WHERE id=?",
          [form.name, form.location, form.capacity_tons, form.current_load_tons, +form.waste_category_id, form.operational_status, form.contact, editing.id]);
      } else {
        await runSQL("INSERT INTO recycling_units (name, location, capacity_tons, current_load_tons, waste_category_id, operational_status, contact) VALUES (?,?,?,?,?,?,?)",
          [form.name, form.location, form.capacity_tons, form.current_load_tons, +form.waste_category_id, form.operational_status, form.contact]);
      }
      loadData(); closeModal();
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this recycling unit?')) return;
    try { await runSQL("DELETE FROM recycling_units WHERE id=?", [id]); loadData(); } catch (err) { console.error(err); }
  };

  const openEdit = (ru: any) => {
    setEditing(ru);
    setForm({ name: ru.name, location: ru.location || '', capacity_tons: ru.capacity_tons, current_load_tons: ru.current_load_tons, waste_category_id: String(ru.waste_category_id), operational_status: ru.operational_status, contact: ru.contact || '' });
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setEditing(null); setForm({ name: '', location: '', capacity_tons: 50, current_load_tons: 0, waste_category_id: '', operational_status: 'Active', contact: '' }); };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Recycling Units</h1>
          <p className="text-sm text-gray-400 mt-1 font-mono">LEFT JOIN waste_categories</p>
        </div>
        <button onClick={() => { closeModal(); setShowModal(true); }} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> Add Unit
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {data.map(ru => {
          const pct = ru.capacity_tons > 0 ? Math.round((ru.current_load_tons / ru.capacity_tons) * 100) : 0;
          const barColor = pct > 85 ? '#ef4444' : pct > 60 ? '#f59e0b' : '#10b981';
          return (
            <div key={ru.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 hover:border-gray-700 transition-colors group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-purple-500/15 flex items-center justify-center">
                    <Recycle className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-sm">{ru.name}</h3>
                    <span className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-medium ${ru.operational_status === 'Active' ? 'bg-green-500/15 text-green-400' :
                        ru.operational_status === 'Under Maintenance' ? 'bg-amber-500/15 text-amber-400' : 'bg-red-500/15 text-red-400'
                      }`}>{ru.operational_status}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(ru)} className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white"><Edit2 className="w-3.5 h-3.5" /></button>
                  <button onClick={() => handleDelete(ru.id)} className="p-1.5 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-gray-400">Capacity Utilization</span>
                  <span className="font-mono font-medium" style={{ color: barColor }}>{pct}%</span>
                </div>
                <div className="h-2.5 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: barColor }} />
                </div>
                <p className="text-[10px] text-gray-500 mt-1 font-mono">{ru.current_load_tons}t / {ru.capacity_tons}t</p>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-800 space-y-1.5">
                {ru.waste_name && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ru.waste_color }}></span>
                    {ru.waste_name}
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <MapPin className="w-3 h-3" /> {ru.location}
                </div>
                {ru.contact && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Phone className="w-3 h-3" /> {ru.contact}
                  </div>
                )}
                <p className="text-[10px] text-gray-600 font-mono">id: {ru.id} | waste_category_id: {ru.waste_category_id}</p>
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={closeModal}>
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white">{editing ? 'UPDATE recycling_units' : 'INSERT INTO recycling_units'}</h2>
              <button onClick={closeModal} className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-400 mb-1 block">Name</label>
                <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:border-emerald-500 focus:outline-none" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-400 mb-1 block">Location</label>
                <input type="text" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:border-emerald-500 focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-400 mb-1 block">Capacity (tons)</label>
                  <input type="number" min={0} step={0.5} value={form.capacity_tons} onChange={e => setForm({ ...form, capacity_tons: +e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:border-emerald-500 focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-400 mb-1 block">Current Load (tons)</label>
                  <input type="number" min={0} step={0.5} value={form.current_load_tons} onChange={e => setForm({ ...form, current_load_tons: +e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:border-emerald-500 focus:outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-400 mb-1 block">Waste Category (FK)</label>
                  <select required value={form.waste_category_id} onChange={e => setForm({ ...form, waste_category_id: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:border-emerald-500 focus:outline-none">
                    <option value="">Select...</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name} (id:{c.id})</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-400 mb-1 block">Status</label>
                  <select value={form.operational_status} onChange={e => setForm({ ...form, operational_status: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:border-emerald-500 focus:outline-none">
                    {['Active', 'Under Maintenance', 'Inactive'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-400 mb-1 block">Contact</label>
                <input type="text" value={form.contact} onChange={e => setForm({ ...form, contact: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:border-emerald-500 focus:outline-none" />
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
