import { useState } from 'react';
import { DatabaseProvider } from './db/DatabaseContext';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Households from './components/Households';
import WasteCategories from './components/WasteCategories';
import Schedules from './components/Schedules';
import Complaints from './components/Complaints';
import Penalties from './components/Penalties';
import RecyclingUnits from './components/RecyclingUnits';

import { Menu, Bell } from 'lucide-react';

function AppContent() {
  const [activePage, setActivePage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard': return <Dashboard />;
      case 'households': return <Households />;
      case 'waste-categories': return <WasteCategories />;
      case 'schedules': return <Schedules />;
      case 'complaints': return <Complaints />;
      case 'penalties': return <Penalties />;
      case 'recycling-units': return <RecyclingUnits />;

      default: return <Dashboard />;
    }
  };

  const pageTitle = (p: string) => {
    const titles: Record<string, string> = {
      dashboard: 'Dashboard', households: 'Households', 'waste-categories': 'Waste Categories',
      schedules: 'Collection Schedules', complaints: 'Complaints', penalties: 'Penalties',
      'recycling-units': 'Recycling Units'
    };
    return titles[p] || 'Dashboard';
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Sidebar activePage={activePage} onNavigate={setActivePage} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="lg:ml-72">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-gray-950/80 backdrop-blur-xl border-b border-gray-800">
          <div className="flex items-center justify-between px-4 sm:px-6 py-3">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-gray-800 text-gray-400">
                <Menu className="w-5 h-5" />
              </button>
              <div>
                <h2 className="text-sm font-semibold text-white">{pageTitle(activePage)}</h2>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="p-2 rounded-lg hover:bg-gray-800 text-gray-400 relative">
                <Bell className="w-4.5 h-4.5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full"></span>
              </button>
              <img
                src="https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=80&h=80&fit=crop&crop=face"
                alt="Profile"
                className="w-9 h-9 rounded-full border-2 border-emerald-500/50 object-cover shadow-lg shadow-emerald-500/10"
              />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-4 sm:p-6 lg:p-8">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <DatabaseProvider>
      <AppContent />
    </DatabaseProvider>
  );
}
