import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/StoreContext';
import {
    ArrowRight,
    CheckCircle2,
    Wallet,
    Brain,
    Layers,
    Activity,
    Calendar,
    Sparkles
} from 'lucide-react';

const LandingPage: React.FC = () => {
    const navigate = useNavigate();
    const { session, isReady } = useStore();
    const currentYear = new Date().getFullYear();

    // Auto-redirect logged-in users to the app dashboard
    useEffect(() => {
        if (isReady && session) {
            navigate('/app');
        }
    }, [isReady, session, navigate]);

    return (
        <div className="min-h-screen bg-[#050505] text-white selection:bg-white selection:text-black flex flex-col items-center" style={{ fontFamily: "'Inter', -apple-system, sans-serif" }}>

            {/* Navigation — minimal, no sign in button */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-[#050505]/80 backdrop-blur-lg border-b border-white/5 h-16 flex items-center">
                <div className="w-full mx-auto px-8 max-w-6xl flex items-center justify-center">
                    <div className="flex items-center gap-2.5">
                        <Layers size={20} className="text-white" />
                        <span className="text-lg font-semibold tracking-tight lowercase">lifeos.</span>
                    </div>
                </div>
            </nav>

            {/* Hero */}
            <main className="flex-1 flex flex-col items-center justify-center text-center px-6 pt-32 pb-20 relative w-full">
                {/* Subtle glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-to-b from-blue-500/8 to-transparent rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 max-w-3xl mx-auto space-y-8">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-xs text-neutral-400 font-medium">
                        <Sparkles size={14} className="text-yellow-400" />
                        Now in open beta — free forever
                    </div>

                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.1]">
                        Structure for the<br />
                        <span className="bg-gradient-to-r from-white to-neutral-500 bg-clip-text text-transparent">unstructured mind.</span>
                    </h1>

                    <p className="text-lg md:text-xl text-neutral-400 max-w-xl mx-auto leading-relaxed">
                        A minimalist utility to capture thoughts, track finances, build habits, and plan your days. Private. Synced. Yours.
                    </p>

                    <div className="pt-4">
                        <button
                            onClick={() => navigate('/login')}
                            className="inline-flex items-center justify-center gap-3 h-16 px-12 md:px-16 bg-white text-black rounded-2xl font-semibold text-base hover:bg-neutral-200 active:scale-[0.97] transition-all shadow-[0_0_40px_rgba(255,255,255,0.08)]"
                        >
                            Get Started <ArrowRight size={20} />
                        </button>
                        <p className="text-xs text-neutral-600 mt-4 font-medium">No credit card required. Free forever.</p>
                    </div>
                </div>
            </main>

            {/* Features */}
            <section className="px-6 pb-32 w-full">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <p className="text-xs uppercase tracking-[0.3em] text-neutral-600 font-semibold mb-3">What's Inside</p>
                        <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Everything you need.<br /> <span className="text-neutral-500">Nothing you don't.</span></h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {[
                            { title: 'Task Planner', icon: CheckCircle2, desc: 'Create, organize and complete tasks with a visual priority system.', color: 'text-blue-400', bg: 'bg-blue-500/10' },
                            { title: 'Habit Streaks', icon: Activity, desc: 'Build daily streaks and track consistency with a heatmap calendar.', color: 'text-green-400', bg: 'bg-green-500/10' },
                            { title: 'Money Tracker', icon: Wallet, desc: 'Log income and expenses. See your balance at a glance.', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                            { title: 'Brain Dump', icon: Brain, desc: 'Capture raw thoughts instantly. Convert them to tasks later.', color: 'text-purple-400', bg: 'bg-purple-500/10' },
                            { title: 'Calendar', icon: Calendar, desc: 'Plot events on a visual timeline. Never miss a deadline.', color: 'text-orange-400', bg: 'bg-orange-500/10' },
                            { title: 'Cloud Sync', icon: Sparkles, desc: 'Your data syncs securely across all devices. Always backed up.', color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
                        ].map((f, i) => (
                            <div key={i} className="bg-[#0d0d0d] border border-white/[0.06] rounded-3xl p-8 hover:bg-[#111] hover:border-white/10 transition-all duration-300 group">
                                <div className={`w-12 h-12 ${f.bg} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                                    <f.icon className={f.color} size={22} />
                                </div>
                                <h3 className="text-base font-semibold tracking-tight mb-2">{f.title}</h3>
                                <p className="text-sm text-neutral-500 leading-relaxed">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="px-6 pb-32 w-full">
                <div className="max-w-3xl mx-auto text-center space-y-8">
                    <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Ready to take control?</h2>
                    <p className="text-lg text-neutral-500 max-w-lg mx-auto">Join hundreds of people who use LifeOS to bring clarity to their daily life.</p>
                    <button
                        onClick={() => navigate('/login')}
                        className="inline-flex items-center justify-center gap-3 h-16 px-16 bg-white text-black rounded-2xl font-semibold text-base hover:bg-neutral-200 active:scale-[0.97] transition-all"
                    >
                        Start for Free <ArrowRight size={20} />
                    </button>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-white/5 py-8">
                <div className="container mx-auto px-8 max-w-6xl flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-neutral-600 font-medium">
                    <span className="lowercase">lifeos. © {currentYear}</span>
                    <div className="flex gap-6">
                        <a href="https://hitesh-pranav.vercel.app" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors cursor-pointer">Dev</a>
                        <a href="https://github.com/HiteshPranav267/LifeOS" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors cursor-pointer">GitHub</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
