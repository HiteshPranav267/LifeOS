import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ListTodo,
  Calendar,
  CheckSquare,
  Activity,
  Wallet,
  Brain,
  Settings,
  Moon,
  Sun,
  ShieldCheck,
  RefreshCw,
  Cloud,
  CloudOff,
} from 'lucide-react';

import DashboardPage from './pages/DashboardPage';
import TasksPage from './pages/TasksPage';
import CalendarPage from './pages/CalendarPage';
import WeeklyPlannerPage from './pages/WeeklyPlannerPage';
import HabitsPage from './pages/HabitsPage';
import MoneyPage from './pages/MoneyPage';
import BrainDumpPage from './pages/BrainDumpPage';
import SettingsPage from './pages/SettingsPage';

import { StoreProvider, useStore } from './store/StoreContext.tsx';

const TopBar = () => {
  const { store, isSaving, isCloudSynced, setTheme } = useStore();
  const [pulse, setPulse] = useState(false);
  const dataSize = Math.round(JSON.stringify(store).length / 1024);

  useEffect(() => {
    if (isSaving) {
      setPulse(true);
      const timer = setTimeout(() => setPulse(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [isSaving]);

  const navItems = [
    { name: 'Index', path: '/', icon: LayoutDashboard },
    { name: 'Commitments', path: '/tasks', icon: ListTodo },
    { name: 'Chronicle', path: '/calendar', icon: Calendar },
    { name: 'Focus', path: '/weekly', icon: CheckSquare },
    { name: 'Rituals', path: '/habits', icon: Activity },
    { name: 'Capital', path: '/money', icon: Wallet },
    { name: 'Thought', path: '/brain-dump', icon: Brain },
    { name: 'Storage', path: '/settings', icon: Settings },
  ];

  const hasCloudConfig = !!(store.settings.supabaseUrl && store.settings.supabaseKey);

  return (
    <header className="top-bar">
      <div className="logo-area flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-[var(--text-primary)] flex items-center justify-center -ml-2 shadow-lg scale-95 transition-transform hover:scale-100">
          <img src="/logo.png" alt="" className="w-5 h-5 invert! opacity-90 shadow-sm" />
        </div>
        <span className="ml-1 tracking-[-0.05em] text-xl lowercase font-light serif opacity-90">lifeos</span>
      </div>

      <nav className="nav-links flex gap-8">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `nav-link group relative py-2 ${isActive ? 'active text-white' : 'text-neutral-500 hover:text-white'}`}
          >
            {({ isActive }) => (
              <div className="flex flex-col items-center gap-1.5 transition-all duration-300">
                <item.icon size={13} strokeWidth={isActive ? 2.5 : 2} className="transition-transform group-hover:scale-110" />
                <span className="text-[9px] tracking-widest uppercase font-bold opacity-0 group-hover:opacity-100 transition-opacity absolute -bottom-3 text-center">
                  {item.name}
                </span>
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="flex items-center gap-8">
        <div className="flex items-center gap-2 group cursor-help transition-opacity">
          <div className={`w-2 h-2 rounded-full transition-all duration-500 ${isSaving || pulse ? 'bg-green-400 shadow-[0_0_12px_rgba(74,222,128,0.5)] scale-110' : 'bg-neutral-800'}`} />
          <span className="text-[8px] uppercase font-bold tracking-[0.25em] text-neutral-500 group-hover:text-neutral-300 transition-colors whitespace-nowrap flex items-center gap-2">
            {isSaving ? <RefreshCw size={8} className="animate-spin" /> : (
              hasCloudConfig ? (isCloudSynced ? <ShieldCheck size={9} className="text-blue-400" /> : <Cloud size={9} />) : <CloudOff size={9} className="opacity-20" />
            )}
            {dataSize} KB Secure • {hasCloudConfig ? 'Global Cloud Sync' : 'Local Disk Sync'}
          </span>
        </div>
        <button
          onClick={() => setTheme(store.settings.theme === 'light' ? 'dark' : 'light')}
          className="p-2 rounded-full hover:bg-[var(--bg-tertiary)] transition-all duration-300 transform active:scale-90"
        >
          {store.settings.theme === 'light' ? <Moon size={15} strokeWidth={1.5} /> : <Sun size={15} strokeWidth={1.5} />}
        </button>
      </div>
    </header>
  );
};

const Layout = ({ children }: { children: React.ReactNode }) => {
  const { isReady } = useStore();

  if (!isReady) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-[9999]">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-t-2 border-white animate-spin opacity-20" />
          <div className="absolute inset-0 flex items-center justify-center">
            <img src="/logo.png" alt="" className="w-6 h-6 invert opacity-80" />
          </div>
        </div>
        <span className="mt-8 text-[10px] uppercase tracking-[0.4em] font-bold text-neutral-500 animate-pulse">
          Hydrating your chronicle...
        </span>
      </div>
    );
  }

  return (
    <div className="app-wrapper">
      <TopBar />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

function App() {
  return (
    <StoreProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/weekly" element={<WeeklyPlannerPage />} />
            <Route path="/habits" element={<HabitsPage />} />
            <Route path="/money" element={<MoneyPage />} />
            <Route path="/brain-dump" element={<BrainDumpPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </Layout>
      </Router>
    </StoreProvider>
  );
}

export default App;
