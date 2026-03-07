import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Navigate, useNavigate } from 'react-router-dom';
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
  Apple,
  Dumbbell
} from 'lucide-react';
import { nativeHaptic } from './utils/native';
import { App as CapApp } from '@capacitor/app';
import { supabase } from './lib/supabase';

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
import NutritionPage from './pages/NutritionPage';
import FitnessPage from './pages/FitnessPage';

import { StoreProvider, useStore } from './store/StoreContext.tsx';

// Error Boundary to prevent blank screens if React crashes
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any, info: any) {
    console.error('[LifeOS] React Error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      // Simple fallback — NO hooks, NO router, NO context
      return (
        <div style={{
          minHeight: '100vh', background: '#050505', color: '#fff',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', fontFamily: "'Inter', sans-serif", textAlign: 'center',
          padding: '2rem'
        }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '1rem' }}>lifeos.</h1>
          <p style={{ color: '#888', marginBottom: '2rem' }}>Something went wrong. Please refresh the page.</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '12px 32px', background: '#fff', color: '#000',
              border: 'none', borderRadius: '12px', fontWeight: 600,
              cursor: 'pointer', fontSize: '14px'
            }}
          >
            Refresh
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const BottomNav = () => {
  const navItems = [
    { name: 'Home', path: '/app', icon: LayoutDashboard },
    { name: 'Tasks', path: '/app/tasks', icon: ListTodo },
    { name: 'Calendar', path: '/app/calendar', icon: Calendar },
    { name: 'Nutrition', path: '/app/nutrition', icon: Apple },
    { name: 'Fitness', path: '/app/fitness', icon: Dumbbell },
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
          onClick={() => nativeHaptic()}
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

  // Not logged in? Redirect to landing page at /
  if (!session) {
    return <Navigate to="/" replace />;
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

const AuthHandler = () => {
  const navigate = useNavigate();

  React.useEffect(() => {
    const handleDeepLink = async (event: any) => {
      const url = new URL(event.url);
      if (url.hash) {
        const params = new URLSearchParams(url.hash.substring(1));
        const access_token = params.get('access_token');
        const refresh_token = params.get('refresh_token');

        if (access_token && refresh_token) {
          const { error } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });
          if (!error) {
            navigate('/app');
          }
        }
      }
    };

    const sub = CapApp.addListener('appUrlOpen', handleDeepLink);
    return () => {
      sub.then(s => s.remove());
    };
  }, [navigate]);

  return null;
};

function App() {

  return (
    <ErrorBoundary>
      <StoreProvider>
        <Router>
          <AuthHandler />
          <Routes>
            {/* Landing page - always accessible, no store dependency */}
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
                  <Route path="/nutrition" element={<NutritionPage />} />
                  <Route path="/fitness" element={<FitnessPage />} />
                  <Route path="*" element={<DashboardPage />} />
                </Routes>
              </AppLayout>
            } />

            {/* 404 for everything else */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Router>
      </StoreProvider>
    </ErrorBoundary>
  );
}

export default App;
