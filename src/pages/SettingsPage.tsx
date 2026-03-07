import { useStore } from '../store/StoreContext.tsx';
import { Sun, Moon, Database, LogOut, User, Mail } from 'lucide-react';

const SettingsPage = () => {
    const { store, setTheme, session, signOut, rescueData } = useStore();
    const isDark = store.settings.theme === 'dark';

    const handleImportData = () => {
        const json = prompt("Paste your LifeOS JSON data here:");
        if (json) {
            rescueData(json);
        }
    };

    const handleClearData = () => {
        if (confirm("Clear local cache and reload? Your cloud data will stay safe.")) {
            const userId = session?.user?.id;
            if (userId) localStorage.removeItem(`lifeos_data_${userId}`);
            localStorage.removeItem('lifeos_data_guest');
            window.location.reload();
        }
    };

    const handleExportData = () => {
        const blob = new Blob([JSON.stringify(store, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `lifeos_backup_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
    };

    return (
        <div className="flex flex-col gap-6 max-w-2xl mx-auto pb-40">
            <div className="mb-2">
                <span className="text-[11px] uppercase tracking-[0.4em] font-bold text-[var(--text-secondary)]">Preferences</span>
                <h1 className="text-3xl font-bold mt-2">Settings</h1>
            </div>

            {/* Account */}
            {session && (
                <div className="card space-y-5">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center justify-center">
                            <User size={22} className="text-[var(--text-secondary)]" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-medium text-[var(--text-secondary)]">Signed in as</span>
                            <span className="text-base font-semibold">{session.user.email}</span>
                        </div>
                    </div>
                    <button
                        onClick={signOut}
                        className="w-full flex items-center justify-center gap-2 h-12 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl font-semibold hover:bg-red-500/20 transition-all active:scale-95 text-sm"
                    >
                        <LogOut size={18} />
                        Sign Out
                    </button>
                </div>
            )}

            {/* Theme */}
            <div
                onClick={() => setTheme(isDark ? 'light' : 'dark')}
                className="card cursor-pointer hover:bg-[var(--bg-elevated)] transition-all active:scale-[0.99] flex items-center justify-between"
            >
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center justify-center">
                        {isDark ? <Sun size={22} className="text-yellow-500" /> : <Moon size={22} className="text-blue-500" />}
                    </div>
                    <div>
                        <span className="text-sm font-semibold block">
                            {isDark ? 'Switch to Light' : 'Switch to Dark'}
                        </span>
                        <span className="text-xs text-[var(--text-secondary)]">Currently: {store.settings.theme}</span>
                    </div>
                </div>
                <div className={`w-11 h-6 rounded-full flex items-center px-0.5 transition-colors shrink-0 ${isDark ? 'bg-yellow-500' : 'bg-blue-500'}`}>
                    <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${isDark ? 'translate-x-5' : 'translate-x-0'}`} />
                </div>
            </div>

            {/* Export */}
            <div
                onClick={handleExportData}
                className="card cursor-pointer hover:bg-[var(--bg-elevated)] transition-all active:scale-[0.99] flex items-center gap-4"
            >
                <div className="w-12 h-12 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center justify-center">
                    <Database size={22} className="text-blue-500" />
                </div>
                <div>
                    <span className="text-sm font-semibold block">Export Data</span>
                    <span className="text-xs text-[var(--text-secondary)]">Download a JSON backup of your data</span>
                </div>
            </div>

            {/* Import */}
            <div
                onClick={handleImportData}
                className="card cursor-pointer hover:bg-[var(--bg-elevated)] transition-all active:scale-[0.99] flex items-center gap-4 border-dashed border-blue-500/20"
            >
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                    <Database size={22} className="text-blue-500 opacity-50" />
                </div>
                <div>
                    <span className="text-sm font-semibold block">Import / Rescue Data</span>
                    <span className="text-xs text-[var(--text-secondary)]">Paste JSON directly into the app</span>
                </div>
            </div>

            {/* Reset */}
            <div
                onClick={handleClearData}
                className="card cursor-pointer hover:bg-[var(--bg-elevated)] transition-all active:scale-[0.99] flex items-center gap-4 border-red-500/10"
            >
                <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                    <LogOut size={22} className="text-red-500" />
                </div>
                <div>
                    <span className="text-sm font-semibold block">Reset Local Cache</span>
                    <span className="text-xs text-[var(--text-secondary)]">Clears browser cache and reloads from cloud</span>
                </div>
            </div>

            {/* Support */}
            <a
                href="mailto:hiteshpranavreddy.d@gmail.com?subject=LifeOS Suggestion"
                className="card cursor-pointer hover:bg-[var(--bg-elevated)] transition-all active:scale-[0.99] flex items-center justify-between group"
            >
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Mail size={22} className="text-blue-500" />
                    </div>
                    <div>
                        <span className="text-sm font-semibold block uppercase tracking-wider">Have a suggestion?</span>
                        <span className="text-xs text-[var(--text-secondary)]">Reach out to the developer</span>
                    </div>
                </div>
                <div className="text-[var(--text-secondary)] text-[10px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                    Mail To
                </div>
            </a>
        </div>
    );
};

export default SettingsPage;
