// Sidebar component
import {
  LayoutDashboard, Home, Trash2, CalendarClock, MessageSquareWarning,
  BadgeDollarSign, Recycle, X, Leaf
} from 'lucide-react';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'households', label: 'Households', icon: Home },
  { id: 'waste-categories', label: 'Waste Categories', icon: Trash2 },
  { id: 'schedules', label: 'Collection Schedules', icon: CalendarClock },
  { id: 'complaints', label: 'Complaints', icon: MessageSquareWarning },
  { id: 'penalties', label: 'Penalties', icon: BadgeDollarSign },
  { id: 'recycling-units', label: 'Recycling Units', icon: Recycle },
];

interface SidebarProps {
  activePage: string;
  onNavigate: (page: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ activePage, onNavigate, isOpen, onClose }: SidebarProps) {
  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={onClose} />
      )}
      <aside className={`fixed top-0 left-0 h-full w-72 bg-gray-950 border-r border-gray-800 z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="p-5 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white tracking-tight">EcoTrack</h1>
              </div>
            </div>
            <button onClick={onClose} className="lg:hidden text-gray-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <nav className="flex-1 p-3 overflow-y-auto">
          <div className="space-y-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => { onNavigate(item.id); onClose(); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-emerald-500/15 text-emerald-300 shadow-inner'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
                  }`}
                >
                  <Icon className={`w-[18px] h-[18px] ${isActive ? 'text-emerald-400' : ''}`} />
                  {item.label}
                </button>
              );
            })}
          </div>
        </nav>

        <div className="p-4 border-t border-gray-800">
          <div className="bg-gray-900/80 rounded-xl p-3 text-center">
            <p className="text-[10px] text-gray-500 font-mono">© Copyright by Krishna</p>
          </div>
        </div>
      </aside>
    </>
  );
}
