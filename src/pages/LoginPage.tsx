import { useState } from 'react';
import { useStore } from '../store/StoreContext.tsx';
import { ShieldCheck, ChevronRight, Key, Globe } from 'lucide-react';

const LoginPage = () => {
    const { setSupabaseConfig } = useStore();
    const [url, setUrl] = useState('');
    const [key, setKey] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleUnlock = () => {
        if (!url || !key) {
            setError('Please provide your private uplink credentials.');
            return;
        }
        setIsLoading(true);
        // Simple delay to feel like a "secure" handshake
        setTimeout(() => {
            setSupabaseConfig(url, key);
            setIsLoading(false);
            window.location.reload(); // Refresh to trigger cloud boot
        }, 1500);
    };

    return (
        <div className="fixed inset-0 bg-black flex flex-col items-center justify-center p-6 z-[9999]">
            <div className="w-full max-w-sm flex flex-col gap-12 text-center">
                <div className="flex flex-col items-center gap-6">
                    <div className="w-20 h-20 rounded-3xl bg-white flex items-center justify-center shadow-2xl transition-transform hover:scale-105">
                        <img src="/logo.png" alt="" className="w-10 h-10 invert" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-semibold mb-2">LifeOS.</h1>
                        <p className="text-neutral-500 text-sm font-medium">Your private chronicle is currently locked.</p>
                    </div>
                </div>

                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                        <div className="relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-600 transition-colors group-focus-within:text-white">
                                <Globe size={18} />
                            </div>
                            <input
                                type="text"
                                placeholder="Supabase Project URL"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                className="pl-12! mb-0! bg-neutral-900 border-none rounded-2xl placeholder:text-neutral-700"
                            />
                        </div>
                        <div className="relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-600 transition-colors group-focus-within:text-white">
                                <Key size={18} />
                            </div>
                            <input
                                type="password"
                                placeholder="Private API Key"
                                value={key}
                                onChange={(e) => setKey(e.target.value)}
                                className="pl-12! mb-0! bg-neutral-900 border-none rounded-2xl placeholder:text-neutral-700"
                            />
                        </div>
                    </div>

                    {error && <p className="text-red-500 text-[11px] font-bold uppercase tracking-widest animate-pulse">{error}</p>}

                    <button
                        onClick={handleUnlock}
                        disabled={isLoading}
                        className="btn-pill justify-center h-[56px] bg-white text-black text-lg border-none shadow-xl transition-all active:scale-95 disabled:opacity-50"
                    >
                        {isLoading ? (
                            <div className="w-6 h-6 border-b-2 border-black rounded-full animate-spin" />
                        ) : (
                            <>Initialize Link <ChevronRight size={20} /></>
                        )}
                    </button>

                    <button
                        onClick={() => window.location.href = '/'}
                        className="text-[10px] uppercase font-bold tracking-[0.25em] text-neutral-600 mt-4 hover:text-neutral-400 transition-colors"
                    >
                        Access Demo Instance (Public)
                    </button>
                </div>

                <div className="flex flex-col gap-6 pt-10 mt-10 border-t border-neutral-900">
                    <div className="flex items-center gap-3 justify-center opacity-40">
                        <ShieldCheck size={14} className="text-blue-500" />
                        <span className="text-[10px] uppercase tracking-widest font-bold">End-to-End Privacy Guaranteed</span>
                    </div>
                    <p className="text-[11px] text-neutral-600 leading-relaxed italic px-8">
                        This is your personal LifeOS endpoint. Only your credentials can unlock the sync engine.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
