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
  Layers,
  Gift,
} from 'lucide-react';

import DashboardPage from './pages/DashboardPage';
import TasksPage from './pages/TasksPage';
import CalendarPage from './pages/CalendarPage';
import HabitsPage from './pages/HabitsPage';
import MoneyPage from './pages/MoneyPage';
import BrainDumpPage from './pages/BrainDumpPage';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/LoginPage';
import LandingPage from './pages/LandingPage';
import NotFoundPage from './pages/NotFoundPage';
import BirthdaysPage from './pages/BirthdaysPage';

import { StoreProvider, useStore } from './store/StoreContext.tsx';

const BottomNav = () => {
  const navItems = [
    { name: 'Home', path: '/app', icon: LayoutDashboard },
    { name: 'Tasks', path: '/app/tasks', icon: ListTodo },
    { name: 'Calendar', path: '/app/calendar', icon: Calendar },
    { name: 'Money', path: '/app/money', icon: Wallet },
    { name: 'Brain', path: '/app/brain-dump', icon: Brain },
    { name: 'Birthdays', path: '/app/birthdays', icon: Gift },
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
        <div className="w-8 h-8 rounded-lg bg-[var(--text-primary)] flex items-center justify-center -ml-1 transition-transform hover:scale-105">
          <Layers size={18} className="text-[var(--bg-primary)]" />
        </div>
        <span className="text-lg font-semibold lowercase tracking-tight">lifeos.</span>
      </div>

      <div className="flex items-center gap-4">
        <NavLink to="/app/settings" className={({ isActive }) => `p-2 rounded-full transition-all ${isActive ? 'bg-[var(--bg-elevated)]' : ''}`}>
          <Settings size={20} strokeWidth={2} />
        </NavLink>
        <button
          onClick={() => setTheme(store.settings.theme === 'light' ? 'dark' : 'light')}
          className="p-2 rounded-full hover:bg-[var(--bg-elevated)] transition-all"
        >
          {store.settings.theme === 'light' ? <Moon size={20} strokeWidth={2} /> : <Sun size={20} strokeWidth={2} />}
        </button>
      </div>
    </header>
  );
};

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const { isReady, session } = useStore();

  if (!isReady) {
    return (
      <div className="fixed inset-0 bg-[#050505] flex flex-col items-center justify-center z-[9999]">
        <div className="w-12 h-12 rounded-full border-t-2 border-white animate-spin opacity-30" />
        <span className="mt-6 text-[10px] uppercase tracking-[0.4em] font-bold text-neutral-500 animate-pulse">
          Loading...
        </span>
      </div>
    );
  }

  if (!session) {
    return <LandingPage />;
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
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Protected App Routes */}
          <Route path="/app/*" element={
            <AppLayout>
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/tasks" element={<TasksPage />} />
                <Route path="/calendar" element={<CalendarPage />} />
                <Route path="/habits" element={<HabitsPage />} />
                <Route path="/money" element={<MoneyPage />} />
                <Route path="/brain-dump" element={<BrainDumpPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/birthdays" element={<BirthdaysPage />} />
                <Route path="*" element={<DashboardPage />} />
              </Routes>
            </AppLayout>
          } />

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Router>
    </StoreProvider>
  );
}

export default App;
