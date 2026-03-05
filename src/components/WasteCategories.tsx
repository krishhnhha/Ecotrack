import { useState, useEffect, useCallback } from 'react';
import { useDatabase, useRefreshTick } from '../db/DatabaseContext';
import { Plus, Edit2, Trash2, X, Recycle } from 'lucide-react';

export default function WasteCategories() {
  const { execSQL, runSQL, toObjects } = useDatabase();
  const [data, setData] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: '', type: 'Recyclable', description: '', disposal_method: '', color: '#10b981' });

  const refreshTick = useRefreshTick();

  const loadData = useCallback(async () => {
    try {
      const r = await execSQL("SELECT * FROM waste_categories ORDER BY id");
      setData(r.length ? toObjects(r[0]) : []);
    } catch (e) { console.error(e); }
  }, [execSQL, toObjects]);

  useEffect(() => { loadData(); }, [loadData, refreshTick]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        await runSQL("UPDATE waste_categories SET name=?, type=?, description=?, disposal_method=?, color=? WHERE id=?",
          [form.name, form.type, form.description, form.disposal_method, form.color, editing.id]);
      } else {
        await runSQL("INSERT INTO waste_categories (name, type, description, disposal_method, color) VALUES (?,?,?,?,?)",
          [form.name, form.type, form.description, form.disposal_method, form.color]);
      }
      loadData(); closeModal();
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this waste category?')) return;
    try { await runSQL("DELETE FROM waste_categories WHERE id=?", [id]); loadData(); } catch (err) { console.error(err); }
  };

  const openEdit = (wc: any) => {
    setEditing(wc);
    setForm({ name: wc.name, type: wc.type, description: wc.description || '', disposal_method: wc.disposal_method || '', color: wc.color || '#10b981' });
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setEditing(null); setForm({ name: '', type: 'Recyclable', description: '', disposal_method: '', color: '#10b981' }); };

  const typeColors: Record<string, string> = { Biodegradable: 'bg-green-500/15 text-green-400', Recyclable: 'bg-blue-500/15 text-blue-400', Hazardous: 'bg-red-500/15 text-red-400', 'Non-Recyclable': 'bg-gray-500/15 text-gray-400' };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Waste Categories</h1>
          <p className="text-sm text-gray-400 mt-1 font-mono">SELECT * FROM waste_categories</p>
        </div>
        <button onClick={() => { closeModal(); setShowModal(true); }} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> Add Category
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {data.map(wc => (
          <div key={wc.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 hover:border-gray-700 transition-colors group">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${wc.color}20` }}>
                <Recycle className="w-5 h-5" style={{ color: wc.color }} />
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openEdit(wc)} className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white"><Edit2 className="w-3.5 h-3.5" /></button>
                <button onClick={() => handleDelete(wc.id)} className="p-1.5 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
            <h3 className="text-white font-semibold text-sm">{wc.name}</h3>
            <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${typeColors[wc.type] || 'bg-gray-500/15 text-gray-400'}`}>{wc.type}</span>
            <p className="text-xs text-gray-500 mt-2 line-clamp-2">{wc.description}</p>
            <div className="mt-3 pt-3 border-t border-gray-800">
              <p className="text-[10px] text-gray-500">Disposal: <span className="text-gray-300">{wc.disposal_method}</span></p>
              <p className="text-[10px] text-gray-600 font-mono mt-1">id: {wc.id}</p>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={closeModal}>
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white">{editing ? 'UPDATE waste_categories' : 'INSERT INTO waste_categories'}</h2>
              <button onClick={closeModal} className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-400 mb-1 block">Name</label>
                <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:border-emerald-500 focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-400 mb-1 block">Type</label>
                  <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:border-emerald-500 focus:outline-none">
                    {['Biodegradable', 'Recyclable', 'Hazardous', 'Non-Recyclable'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-400 mb-1 block">Color</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} className="w-10 h-10 rounded-lg border-0 bg-transparent cursor-pointer" />
                    <input type="text" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm font-mono focus:border-emerald-500 focus:outline-none" />
                  </div>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-400 mb-1 block">Description</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:border-emerald-500 focus:outline-none resize-none" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-400 mb-1 block">Disposal Method</label>
                <input type="text" value={form.disposal_method} onChange={e => setForm({ ...form, disposal_method: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:border-emerald-500 focus:outline-none" />
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
