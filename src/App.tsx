import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ListTodo,
  Calendar,
  Wallet,
  Brain,
  Settings,
  Moon,
  Sun,
} from 'lucide-react';

import DashboardPage from './pages/DashboardPage';
import TasksPage from './pages/TasksPage';
import CalendarPage from './pages/CalendarPage';
import HabitsPage from './pages/HabitsPage';
import MoneyPage from './pages/MoneyPage';
import BrainDumpPage from './pages/BrainDumpPage';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/LoginPage';

import { StoreProvider, useStore } from './store/StoreContext.tsx';

const BottomNav = () => {
  const navItems = [
    { name: 'Home', path: '/', icon: LayoutDashboard },
    { name: 'Tasks', path: '/tasks', icon: ListTodo },
    { name: 'Calendar', path: '/calendar', icon: Calendar },
    { name: 'Money', path: '/money', icon: Wallet },
    { name: 'Brain', path: '/brain-dump', icon: Brain },
  ];

  return (
    <nav className="bottom-nav">
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          {({ isActive }) => (
            <>
              <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span>{item.name}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
};

const TopBar = () => {
  const { store, setTheme } = useStore();
  return (
    <header className="top-bar">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center -ml-1 transition-transform hover:scale-105">
          <img src="/logo.png" alt="" className="w-5 h-5 invert" />
        </div>
        <span className="text-lg font-semibold lowercase tracking-tight">lifeos.</span>
      </div>

      <div className="flex items-center gap-4">
        <NavLink to="/settings" className={({ isActive }) => `p-2 rounded-full transition-all ${isActive ? 'bg-[var(--bg-tertiary)]' : ''}`}>
          <Settings size={20} strokeWidth={2} />
        </NavLink>
        <button
          onClick={() => setTheme(store.settings.theme === 'light' ? 'dark' : 'light')}
          className="p-2 rounded-full hover:bg-[var(--bg-tertiary)] transition-all"
        >
          {store.settings.theme === 'light' ? <Moon size={20} strokeWidth={2} /> : <Sun size={20} strokeWidth={2} />}
        </button>
      </div>
    </header>
  );
};

const Layout = ({ children }: { children: React.ReactNode }) => {
  const { isReady, store } = useStore();
  const hasConfig = !!(store.settings.supabaseUrl && store.settings.supabaseKey);

  if (!isReady) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-[9999]">
        <div className="w-16 h-16 rounded-full border-t-2 border-white animate-spin opacity-20" />
        <span className="mt-8 text-[10px] uppercase tracking-[0.4em] font-bold text-neutral-500 animate-pulse">
          Hydrating Chronosphere...
        </span>
      </div>
    );
  }

  // Only show login if NOT on localhost (online) AND no keys configured
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  if (!isLocalhost && !hasConfig) {
    return <LoginPage />;
  }

  return (
    <div className="app-wrapper">
      <TopBar />
      <main className="main-content">
        {children}
      </main>
      <BottomNav />
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
