import { useStore } from '../store/StoreContext.tsx';
import { CheckCircle2, Calendar, Activity, Wallet, Brain, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DashboardPage = () => {
    const { store } = useStore();
    const navigate = useNavigate();

    // Data Aggregates
    const activeTasksCount = store.tasks.filter(t => t.status !== 'completed').length;
    const balance = store.transactions.reduce((acc, t) => t.type === 'income' ? acc + t.amount : acc - t.amount, 0);
    const upcomingEvents = store.events.filter(e => new Date(e.date) >= new Date()).length;

    // Recent Items
    const activeHabits = store.habits.slice(0, 3);
    const recentDumps = store.brainDumps.slice(0, 3);

    const cards = [
        { name: 'Commitments', value: `${activeTasksCount} Active`, icon: CheckCircle2, color: 'text-blue-500', path: '/tasks', desc: 'Focus on what matters.' },
        { name: 'Chronicle', value: `${upcomingEvents} Upcoming`, icon: Calendar, color: 'text-purple-500', path: '/calendar', desc: 'Schedule of intent.' },
        { name: 'Capital', value: `₹${balance.toLocaleString('en-IN')}`, icon: Wallet, color: 'text-green-500', path: '/money', desc: 'Financial health.' },
        { name: 'Thought', value: `${store.brainDumps.length} Captured`, icon: Brain, color: 'text-orange-500', path: '/brain-dump', desc: 'Stream of mind.' },
    ];

    return (
        <div className="flex flex-col gap-14 max-w-2xl mx-auto">
            <div className="flex flex-col gap-2">
                <span className="text-[11px] uppercase tracking-[0.4em] font-bold text-neutral-600">Overview</span>
                <h1 className="serif mt-2">Welcome to your <span className="opacity-50">sanctuary.</span></h1>
            </div>

            {/* Launchpad Grid */}
            <div className="grid grid-cols-2 gap-4">
                {cards.map(card => (
                    <div
                        key={card.path}
                        onClick={() => navigate(card.path)}
                        className="card interactive-card p-6 flex flex-col gap-8 justify-between group"
                    >
                        <div className="flex items-center justify-between">
                            <div className={`w-12 h-12 rounded-2xl bg-neutral-900 flex items-center justify-center transition-transform group-hover:scale-110`}>
                                <card.icon className={card.color} size={24} />
                            </div>
                            <ArrowRight size={16} className="text-neutral-700 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div>
                            <span className="text-xs font-semibold text-neutral-500 block mb-1 uppercase tracking-wider">{card.name}</span>
                            <p className="text-xl font-semibold leading-tight">{card.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Rituals Quick View */}
            <div>
                <div className="flex items-center justify-between mb-6">
                    <span className="section-label m-0">Daily Rituals</span>
                    <button onClick={() => navigate('/habits')} className="text-[10px] uppercase font-bold text-neutral-600 hover:text-white transition-colors">See All</button>
                </div>
                <div className="flex flex-col gap-3">
                    {activeHabits.map(habit => (
                        <div key={habit.id} className="card p-5 py-4 flex items-center justify-between interactive-card" onClick={() => navigate('/habits')}>
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full border border-neutral-900 flex items-center justify-center text-blue-500">
                                    <Activity size={18} />
                                </div>
                                <span className="text-sm font-medium">{habit.title}</span>
                            </div>
                            <div className="flex gap-1.5">
                                {[1, 2, 3, 4, 5].map(i => (
                                    <div key={i} className="w-2.5 h-2.5 rounded-full bg-neutral-900" />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Recent Thoughts */}
            <div>
                <div className="flex items-center justify-between mb-6">
                    <span className="section-label m-0">Recent Stream</span>
                    <button onClick={() => navigate('/brain-dump')} className="text-[10px] uppercase font-bold text-neutral-600 hover:text-white transition-colors">Capture</button>
                </div>
                <div className="grid gap-4">
                    {recentDumps.map(dump => (
                        <div key={dump.id} className="card p-6 py-5 border-l-4 border-l-orange-500/50 interactive-card" onClick={() => navigate('/brain-dump')}>
                            <p className="text-sm text-neutral-400 line-clamp-2 leading-relaxed">
                                {dump.content}
                            </p>
                            <span className="text-[9px] uppercase tracking-widest font-bold text-neutral-600 mt-4 block">
                                {new Date(dump.createdAt).toLocaleDateString()}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;
