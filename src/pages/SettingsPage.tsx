import { useState } from 'react';
import { useStore } from '../store/StoreContext.tsx';
import { Sun, Moon, Database, RefreshCw, Cloud, Smartphone, Zap, ArrowRight, ShieldCheck, LogOut } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

const SettingsPage = () => {
    const { store, setTheme, setSupabaseConfig } = useStore();
    const [url, setUrl] = useState(store.settings.supabaseUrl || '');
    const [key, setKey] = useState(store.settings.supabaseKey || '');
    const [isSavingConfig, setIsSavingConfig] = useState(false);

    const currentOrigin = window.location.hostname === 'localhost' ? 'http://172.20.10.3:5173' : window.location.origin;
    const magicLink = `${currentOrigin}?sb_url=${encodeURIComponent(url)}&sb_key=${encodeURIComponent(key)}`;

    const handleClearData = () => {
        if (confirm("Disconnect and clear all LifeOS local cache? This will not affect the cloud record.")) {
            localStorage.removeItem('lifeos_data');
            window.location.reload();
        }
    };

    const handleSaveCloudConfig = () => {
        setIsSavingConfig(true);
        setSupabaseConfig(url, key);
        setTimeout(() => {
            setIsSavingConfig(false);
            window.location.reload();
        }, 1200);
    };

    const handleExportData = () => {
        const data = localStorage.getItem('lifeos_data');
        if (!data) return;
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `lifeos_chronicle_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
    };

    const hasConfig = !!(store.settings.supabaseUrl && store.settings.supabaseKey);

    return (
        <div className="flex flex-col gap-10 max-w-2xl mx-auto pb-40">
            <div className="flex items-center justify-between">
                <div>
                    <span className="text-[11px] uppercase tracking-[0.4em] font-bold text-neutral-600">Preferences</span>
                    <h1 className="serif mt-2">Storage.</h1>
                </div>
                <div className="w-10 h-10 rounded-full bg-neutral-900 flex items-center justify-center opacity-40">
                    <Cloud size={20} />
                </div>
            </div>

            {/* Cloud Connection */}
            <div className={`card border-l-4 transition-all duration-500 ${hasConfig ? 'border-l-blue-600 bg-blue-600/5' : 'border-l-neutral-800'}`}>
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-2xl bg-neutral-900 flex items-center justify-center">
                        <Cloud size={20} className={hasConfig ? 'text-blue-500' : 'text-neutral-500'} />
                    </div>
                    <span className="section-label m-0">Global Cloud Uplink</span>
                </div>

                <div className="flex flex-col gap-6">
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-2">
                            <span className="text-[10px] uppercase font-bold text-neutral-600 tracking-widest pl-4">Endpoint URL</span>
                            <input
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                className="bg-neutral-900 border-none rounded-2xl p-6"
                                placeholder="https://xyz.supabase.co"
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <span className="text-[10px] uppercase font-bold text-neutral-600 tracking-widest pl-4">Private API Key (Anon)</span>
                            <input
                                type="password"
                                value={key}
                                onChange={(e) => setKey(e.target.value)}
                                className="bg-neutral-900 border-none rounded-2xl p-6"
                                placeholder="••••••••••••••••"
                            />
                        </div>
                    </div>

                    <button
                        onClick={handleSaveCloudConfig}
                        disabled={isSavingConfig}
                        className={`btn-pill justify-center h-[64px] border-none shadow-xl transition-all active:scale-95 ${hasConfig ? 'bg-neutral-900 text-white' : 'bg-white text-black text-lg'}`}
                    >
                        {isSavingConfig ? <RefreshCw className="animate-spin" /> : hasConfig ? 'Chronicle Linked Sucessfully' : 'Establish Cloud Connection'}
                        {!hasConfig && <ArrowRight size={20} className="ml-2" />}
                    </button>

                    {hasConfig && (
                        <div className="p-4 bg-blue-500/10 rounded-2xl flex items-center gap-3 justify-center">
                            <ShieldCheck size={16} className="text-blue-500" />
                            <span className="text-[10px] uppercase tracking-widest font-bold text-blue-500">Encrypted Pulse Operational</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Apple Style QR Card */}
            {hasConfig && (
                <div className="card border-l-4 border-l-purple-600 bg-purple-600/5 transition-all animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 rounded-2xl bg-neutral-900 flex items-center justify-center">
                            <Smartphone size={20} className="text-purple-500" />
                        </div>
                        <span className="section-label m-0">Magic iPhone Link</span>
                    </div>
                    <div className="flex flex-col md:flex-row items-center gap-10">
                        <div className="p-4 bg-white rounded-3xl shadow-xl flex items-center justify-center border-4 border-neutral-900">
                            <QRCodeSVG value={magicLink} size={160} level="H" includeMargin={false} />
                        </div>
                        <div className="flex-1 flex flex-col gap-4">
                            <div className="flex items-center gap-2">
                                <Zap size={14} className="text-purple-400" />
                                <span className="text-xs font-semibold uppercase tracking-widest text-purple-200">Zero-Handshake Sync</span>
                            </div>
                            <p className="text-[11px] text-neutral-500 italic leading-relaxed pr-6">
                                Scan this seal with your iPhone camera to instantly bridge your private chronicle. No credentials required after scan.
                            </p>
                            <p className="text-[10px] text-purple-400 font-bold opacity-40 uppercase tracking-widest border-t border-purple-500/10 pt-4">
                                Requirement: Same Wi-Fi Link or Hotspot.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Theme & Data */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div onClick={() => setTheme(store.settings.theme === 'light' ? 'dark' : 'light')} className="card interactive-card flex items-center justify-between p-8">
                    <div className="flex flex-col gap-1">
                        <span className="text-sm font-semibold">Visual Theme.</span>
                        <span className="text-[10px] uppercase font-bold text-neutral-600 tracking-widest">{store.settings.theme} appearance</span>
                    </div>
                    {store.settings.theme === 'light' ? <Moon size={24} /> : <Sun size={24} />}
                </div>

                <div onClick={handleExportData} className="card interactive-card flex items-center justify-between p-8 group">
                    <div className="flex flex-col gap-1">
                        <span className="text-sm font-semibold">Native Export.</span>
                        <span className="text-[10px] uppercase font-bold text-neutral-600 tracking-widest">Download JSON</span>
                    </div>
                    <Database size={24} className="group-hover:text-blue-500 transition-colors" />
                </div>
            </div>

            <div onClick={handleClearData} className="card interactive-card border-none bg-red-600/5 group p-8">
                <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                        <span className="text-sm font-semibold text-red-500">Reset Local Instance.</span>
                        <span className="text-[10px] uppercase font-bold text-neutral-600 tracking-widest">Logout and clear browser cache</span>
                    </div>
                    <LogOut size={24} className="text-red-500 transition-transform group-active:scale-90" />
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
