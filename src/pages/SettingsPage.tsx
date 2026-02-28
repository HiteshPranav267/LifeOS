import { useState } from 'react';
import { useStore } from '../store/StoreContext.tsx';
import { Sun, Moon, Database, Trash2, Laptop, RefreshCw, Cloud, Save, Smartphone, Zap } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

const SettingsPage = () => {
    const { store, setTheme, setSupabaseConfig } = useStore();
    const [url, setUrl] = useState(store.settings.supabaseUrl || '');
    const [key, setKey] = useState(store.settings.supabaseKey || '');
    const [isSavingConfig, setIsSavingConfig] = useState(false);

    // If on localhost (laptop), the origin might need to be resolved to the local IP for the phone to reach it.
    // We'll use the IP we found earlier (172.20.10.3) as a context-aware fallback.
    const currentOrigin = window.location.hostname === 'localhost' ? 'http://172.20.10.3:5173' : window.location.origin;
    const magicLink = `${currentOrigin}?sb_url=${encodeURIComponent(url)}&sb_key=${encodeURIComponent(key)}`;

    const handleClearData = () => {
        if (confirm("Clear all LifeOS data? This cannot be undone.")) {
            localStorage.removeItem('lifeos_data');
            window.location.reload();
        }
    };

    const handleSyncFromLaptop = async () => {
        try {
            const response = await fetch('/api/load-data');
            if (response.ok) {
                const data = await response.json();
                if (data && data.settings) {
                    localStorage.setItem('lifeos_data', JSON.stringify(data));
                    window.location.reload();
                } else {
                    alert("No valid chronicle record found in folder.");
                }
            } else {
                alert("Communication failure with Laptop Project folder.");
            }
        } catch (e) {
            alert("Sync failed: The local background process is not responding.");
        }
    };

    const handleSaveCloudConfig = () => {
        setIsSavingConfig(true);
        setSupabaseConfig(url, key);
        setTimeout(() => {
            setIsSavingConfig(false);
            alert("Cloud Uplink parameters established. Pulse established.");
        }, 1500);
    };

    const handleExportData = () => {
        const data = localStorage.getItem('lifeos_data');
        if (!data) return;
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'lifeos_export.json';
        a.click();
    };

    const sqlSnippet = `
-- Run this in your Supabase SQL Editor to initialize the sync table:
CREATE TABLE IF NOT EXISTS public.lifeos_sync (
    id TEXT PRIMARY KEY,
    data JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for security
ALTER TABLE public.lifeos_sync ENABLE ROW LEVEL SECURITY;

-- Simple policy: All authenticated access allowed (or simplify for private use)
CREATE POLICY "Authenticated users can sync"
ON public.lifeos_sync FOR ALL
TO public
USING (true)
WITH CHECK (true);
    `.trim();

    return (
        <div className="flex flex-col gap-8 max-w-xl pb-20">
            {/* Appearance */}
            <div className="card">
                <span className="section-label">Appearance</span>
                <div className="flex items-center justify-between mt-4">
                    <div>
                        <span className="font-medium text-sm">Theme Selection</span>
                        <p className="text-[10px] text-[var(--text-muted)] mt-0.5 uppercase tracking-widest font-bold">Choosing the visual spectrum.</p>
                    </div>
                    <div className="flex rounded-full overflow-hidden border border-[var(--border)] p-1 bg-[var(--bg-tertiary)]">
                        <button
                            onClick={() => setTheme('light')}
                            className={`flex items-center gap-2 px-6 py-2 text-[10px] uppercase tracking-widest font-bold rounded-full transition-all ${store.settings.theme === 'light' ? 'bg-[var(--bg-primary)] text-[var(--text-primary)] shadow-md' : 'text-[var(--text-muted)]'}`}
                        >
                            <Sun size={10} /> Light
                        </button>
                        <button
                            onClick={() => setTheme('dark')}
                            className={`flex items-center gap-2 px-6 py-2 text-[10px] uppercase tracking-widest font-bold rounded-full transition-all ${store.settings.theme === 'dark' ? 'bg-[var(--bg-primary)] text-[var(--text-primary)] shadow-md' : 'text-[var(--text-muted)]'}`}
                        >
                            <Moon size={10} /> Dark
                        </button>
                    </div>
                </div>
            </div>

            {/* Cloud Backend (NEW) */}
            <div className="card border-l-2 border-l-blue-500">
                <div className="flex items-center gap-3 border-b border-[var(--border)] pb-4 mb-6">
                    <Cloud size={16} className="text-blue-400" />
                    <span className="section-label m-0">Private Cloud Uplink (Phone ↔ Laptop)</span>
                </div>

                <div className="flex flex-col gap-6">
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed italic">
                        The ultimate backend. Connect your own private cloud storage to access LifeOS records from any device, anywhere in the world.
                    </p>

                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-1">
                            <span className="text-[9px] uppercase tracking-[0.2em] text-[var(--text-muted)] font-bold">Supabase API URL</span>
                            <input
                                placeholder="https://xyz.supabase.co"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                className="text-sm! py-3 border-b border-[var(--border)] bg-transparent focus:border-blue-500 transition-colors"
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-[9px] uppercase tracking-[0.2em] text-[var(--text-muted)] font-bold">Supabase API Key (Anon)</span>
                            <input
                                type="password"
                                placeholder="Paste your private key here"
                                value={key}
                                onChange={(e) => setKey(e.target.value)}
                                className="text-sm! py-3 border-b border-[var(--border)] bg-transparent focus:border-blue-500 transition-colors"
                            />
                        </div>
                        <button
                            className={`btn-pill justify-center mt-2 ${isSavingConfig ? 'opacity-50 pointer-events-none' : ''}`}
                            onClick={handleSaveCloudConfig}
                        >
                            {isSavingConfig ? <RefreshCw size={12} className="animate-spin" /> : <Save size={12} />}
                            {isSavingConfig ? 'Establishing Uplink...' : 'Establish Cloud Connection'}
                        </button>
                    </div>

                    <div className="mt-4 pt-6 border-t border-[var(--border)]">
                        <span className="text-[9px] uppercase tracking-[0.2em] text-[var(--text-muted)] font-bold mb-4 block">Setup Quick Guide</span>
                        <ol className="text-[10px] text-[var(--text-muted)] flex flex-col gap-2 list-decimal ml-4 italic">
                            <li>Create a free project at <a href="https://supabase.com" target="_blank" className="text-blue-400 underline">Supabase.com</a></li>
                            <li>Navigate to the **SQL Editor** in your dashboard.</li>
                            <li>Copy and run the code block below to initialize the table.</li>
                            <li>Paste the **Project URL** and **Anon Key** from Project Settings here.</li>
                        </ol>

                        <div className="mt-4 bg-neutral-900 rounded-xl p-4 relative group">
                            <pre className="text-[8px] text-neutral-500 overflow-x-auto whitespace-pre-wrap leading-tight">
                                {sqlSnippet}
                            </pre>
                            <button
                                onClick={() => { navigator.clipboard.writeText(sqlSnippet); alert("SQL Snippet copied to scroll."); }}
                                className="absolute top-2 right-2 p-2 rounded-full bg-neutral-800 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <RefreshCw size={10} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Magic Device Link (QR Code) */}
            {url && key && (
                <div className="card border-l-2 border-l-purple-500 bg-purple-500/5 transition-all animate-in fade-in slide-in-from-bottom-4">
                    <div className="flex items-center gap-3 border-b border-purple-500/20 pb-4 mb-6">
                        <Smartphone size={16} className="text-purple-400" />
                        <span className="section-label m-0">iPhone Magic Handshake</span>
                    </div>
                    <div className="flex flex-col md:flex-row gap-8 items-center">
                        <div className="p-4 bg-white rounded-3xl shadow-2xl border-4 border-white/20">
                            <QRCodeSVG value={magicLink} size={180} level="H" includeMargin={false} />
                        </div>
                        <div className="flex flex-col gap-4 flex-1">
                            <div className="flex items-center gap-2">
                                <Zap size={14} className="text-purple-400" strokeWidth={2.5} />
                                <span className="text-sm font-semibold italic text-purple-200">Global Synchronicity Ready</span>
                            </div>
                            <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed italic pr-4">
                                Scan this unique seal with your <strong className="text-white">iPhone Camera</strong>. It will instantly bridge your private cloud credentials to your mobile app.
                                No keyboards, no errors, just pure convergence.
                            </p>
                            <div className="text-[9px] text-purple-400/60 uppercase tracking-[0.2em] font-bold border-t border-purple-500/10 pt-4">
                                Requirement: Initial scan requires both devices on the same Wi-Fi / Hotspot.
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Laptop Storage */}
            <div className="card border-l-2 border-l-white/20">
                <div className="flex items-center gap-3 border-b border-[var(--border)] pb-4 mb-6">
                    <Laptop size={16} className="text-[var(--text-muted)]" />
                    <span className="section-label m-0">Laptop Project Folder Backup</span>
                </div>
                <div className="flex flex-col gap-6">
                    <div className="flex items-center gap-4 group">
                        <button
                            className="btn-pill px-8! py-2! text-[10px] uppercase font-bold tracking-widest bg-neutral-800 text-white"
                            onClick={handleSyncFromLaptop}
                        >
                            <RefreshCw size={10} className="mr-2" /> Force Pull from Local Folder
                        </button>
                    </div>
                </div>
            </div>

            {/* Data Management */}
            <div className="card">
                <span className="section-label">General Data Control</span>
                <div className="flex flex-col gap-6 mt-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 group cursor-pointer" onClick={handleExportData}>
                            <div className="w-10 h-10 rounded-full border border-[var(--border)] flex items-center justify-center group-hover:bg-[var(--bg-tertiary)] transition-colors">
                                <Database size={16} className="text-[var(--text-muted)]" />
                            </div>
                            <div className="text-left">
                                <span className="font-medium text-sm">Download Chronicle (.json)</span>
                                <p className="text-[9px] uppercase tracking-widest font-bold text-[var(--text-muted)] mt-0.5">Offline binary of all records.</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 group cursor-pointer" onClick={handleClearData}>
                            <div className="w-10 h-10 rounded-full border border-[var(--border)] flex items-center justify-center group-hover:bg-red-500/10 transition-colors">
                                <Trash2 size={16} className="text-[var(--text-muted)] group-hover:text-red-500" />
                            </div>
                            <div className="text-left">
                                <span className="font-medium text-sm text-red-500">Purge Storage</span>
                                <p className="text-[9px] uppercase tracking-widest font-bold text-[var(--text-muted)] mt-0.5">Wipe all local browser cache.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
