import { useState, useEffect, useCallback } from 'react';
import { useDatabase, useRefreshTick } from '../db/DatabaseContext';
import {
  Home, Trash2, CalendarClock, MessageSquareWarning, BadgeDollarSign, Recycle,
  TrendingUp, AlertTriangle
} from 'lucide-react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';

const CHART_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#6b7280', '#ec4899', '#14b8a6'];

export default function Dashboard() {
  const { execSQL, toObjects } = useDatabase();
  const [stats, setStats] = useState({ households: 0, categories: 0, completed: 0, openComplaints: 0, pendingPenalties: 0, activeUnits: 0 });
  const [scheduleStatus, setScheduleStatus] = useState<any[]>([]);
  const [wasteByType, setWasteByType] = useState<any[]>([]);
  const [complaintPriority, setComplaintPriority] = useState<any[]>([]);
  const [recyclingUtil, setRecyclingUtil] = useState<any[]>([]);
  const [recentComplaints, setRecentComplaints] = useState<any[]>([]);
  const [recentPenalties, setRecentPenalties] = useState<any[]>([]);

  const refreshTick = useRefreshTick();

  const loadData = useCallback(async () => {
    try {
      const r0 = await execSQL("SELECT COUNT(*) as c FROM households WHERE is_active = 1"); setStats(s => ({ ...s, households: r0[0]?.values[0][0] || 0 }));
      const r1 = await execSQL("SELECT COUNT(*) as c FROM waste_categories"); setStats(s => ({ ...s, categories: r1[0]?.values[0][0] || 0 }));
      const r2 = await execSQL("SELECT COUNT(*) as c FROM collection_schedules WHERE status = 'Completed'"); setStats(s => ({ ...s, completed: r2[0]?.values[0][0] || 0 }));
      const r3 = await execSQL("SELECT COUNT(*) as c FROM complaints WHERE status IN ('Open','In Progress')"); setStats(s => ({ ...s, openComplaints: r3[0]?.values[0][0] || 0 }));
      const r4 = await execSQL("SELECT COALESCE(SUM(amount),0) as c FROM penalties WHERE status IN ('Pending','Overdue')"); setStats(s => ({ ...s, pendingPenalties: r4[0]?.values[0][0] || 0 }));
      const r5 = await execSQL("SELECT COUNT(*) as c FROM recycling_units WHERE operational_status = 'Active'"); setStats(s => ({ ...s, activeUnits: r5[0]?.values[0][0] || 0 }));

      const ss = await execSQL("SELECT status, COUNT(*) as count FROM collection_schedules GROUP BY status"); setScheduleStatus(ss.length ? toObjects(ss[0]) : []);
      const wt = await execSQL("SELECT wc.name, COUNT(*) as count FROM collection_schedules cs JOIN waste_categories wc ON cs.waste_category_id = wc.id GROUP BY wc.name"); setWasteByType(wt.length ? toObjects(wt[0]) : []);
      const cp = await execSQL("SELECT priority, COUNT(*) as count FROM complaints GROUP BY priority"); setComplaintPriority(cp.length ? toObjects(cp[0]) : []);
      const ru = await execSQL("SELECT name, capacity_tons, current_load_tons, ROUND(current_load_tons*100.0/capacity_tons,1) as pct FROM recycling_units"); setRecyclingUtil(ru.length ? toObjects(ru[0]) : []);

      const rc = await execSQL("SELECT c.*, h.owner_name FROM complaints c JOIN households h ON c.household_id = h.id ORDER BY c.filed_date DESC LIMIT 5"); setRecentComplaints(rc.length ? toObjects(rc[0]) : []);
      const rp = await execSQL("SELECT p.*, h.owner_name FROM penalties p JOIN households h ON p.household_id = h.id ORDER BY p.issued_date DESC LIMIT 5"); setRecentPenalties(rp.length ? toObjects(rp[0]) : []);
    } catch (e) { console.error(e); }
  }, [execSQL, toObjects]);

  useEffect(() => { loadData(); }, [loadData, refreshTick]);

  const statCards = [
    { label: 'Active Households', value: stats.households, icon: Home, color: 'from-emerald-500 to-green-600', shadow: 'shadow-emerald-500/20' },
    { label: 'Waste Categories', value: stats.categories, icon: Trash2, color: 'from-blue-500 to-indigo-600', shadow: 'shadow-blue-500/20' },
    { label: 'Collections Done', value: stats.completed, icon: CalendarClock, color: 'from-teal-500 to-cyan-600', shadow: 'shadow-teal-500/20' },
    { label: 'Open Complaints', value: stats.openComplaints, icon: MessageSquareWarning, color: 'from-orange-500 to-amber-600', shadow: 'shadow-orange-500/20' },
    { label: 'Pending Fines (₹)', value: `₹${Number(stats.pendingPenalties).toLocaleString()}`, icon: BadgeDollarSign, color: 'from-red-500 to-rose-600', shadow: 'shadow-red-500/20' },
    { label: 'Active Recycling', value: stats.activeUnits, icon: Recycle, color: 'from-purple-500 to-violet-600', shadow: 'shadow-purple-500/20' },
  ];

  const priorityColors: Record<string, string> = { Low: '#3b82f6', Medium: '#f59e0b', High: '#f97316', Critical: '#ef4444' };
  const statusColors: Record<string, string> = { Scheduled: '#3b82f6', Completed: '#10b981', Missed: '#ef4444' };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-extrabold text-white">Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 hover:border-gray-700 transition-colors">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{card.label}</p>
                  <p className="text-3xl font-bold text-white mt-2">{card.value}</p>
                </div>
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${card.color} ${card.shadow} shadow-lg flex items-center justify-center`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Schedule Status Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={scheduleStatus} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={90} label={({ status, count }: any) => `${status}: ${count}`}>
                {scheduleStatus.map((entry: any, i: number) => (
                  <Cell key={i} fill={statusColors[entry.status] || CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px', color: '#fff' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Collections by Waste Type</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={wasteByType}>
              <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 10 }} angle={-20} textAnchor="end" height={60} />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} />
              <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px', color: '#fff' }} />
              <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Complaints by Priority</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={complaintPriority} dataKey="count" nameKey="priority" cx="50%" cy="50%" innerRadius={50} outerRadius={90} label={({ priority, count }: any) => `${priority}: ${count}`}>
                {complaintPriority.map((entry: any, i: number) => (
                  <Cell key={i} fill={priorityColors[entry.priority] || CHART_COLORS[i]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px', color: '#fff' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Recycling Unit Utilization</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={recyclingUtil} layout="vertical">
              <XAxis type="number" domain={[0, 100]} tick={{ fill: '#9ca3af', fontSize: 11 }} unit="%" />
              <YAxis dataKey="name" type="category" tick={{ fill: '#9ca3af', fontSize: 10 }} width={120} />
              <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px', color: '#fff' }} formatter={(v: any) => `${v}%`} />
              <Bar dataKey="pct" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-orange-400" />
            <h3 className="text-sm font-semibold text-white">Recent Complaints</h3>
          </div>
          <div className="space-y-3">
            {recentComplaints.map((c: any, i: number) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                <div>
                  <p className="text-sm text-white font-medium">{c.subject}</p>
                  <p className="text-xs text-gray-500">{c.owner_name} · {c.filed_date}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${c.priority === 'Critical' ? 'bg-red-500/20 text-red-400' :
                      c.priority === 'High' ? 'bg-orange-500/20 text-orange-400' :
                        c.priority === 'Medium' ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'
                    }`}>{c.priority}</span>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${c.status === 'Open' ? 'bg-yellow-500/20 text-yellow-400' :
                      c.status === 'Resolved' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'
                    }`}>{c.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-red-400" />
            <h3 className="text-sm font-semibold text-white">Recent Penalties</h3>
          </div>
          <div className="space-y-3">
            {recentPenalties.map((p: any, i: number) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                <div>
                  <p className="text-sm text-white font-medium">{p.violation}</p>
                  <p className="text-xs text-gray-500">{p.owner_name} · ₹{Number(p.amount).toLocaleString()}</p>
                </div>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${p.status === 'Paid' ? 'bg-green-500/20 text-green-400' :
                    p.status === 'Overdue' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'
                  }`}>{p.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
