import { useStore } from '../store/StoreContext.tsx';
import { CheckCircle2, Calendar, Activity, Wallet, Brain, ArrowRight, Gift, Apple, Dumbbell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DashboardPage = () => {
    const { store } = useStore();
    const navigate = useNavigate();

    const activeTasksCount = store.tasks.filter(t => t.status !== 'completed').length;
    const balance = store.transactions.reduce((acc, t) => t.type === 'income' ? acc + t.amount : acc - t.amount, 0);
    const upcomingEvents = store.events.filter(e => new Date(e.date) >= new Date()).length;

    const activeHabits = store.habits.slice(0, 3);
    const recentDumps = store.brainDumps.slice(0, 3);

    const todaysBirthdays = (store.birthdays || [])
        .map(b => {
            const bDay = new Date(b.date);
            const today = new Date();
            const age = today.getFullYear() - bDay.getFullYear();
            return {
                ...b,
                age,
                isToday: bDay.getMonth() === today.getMonth() && bDay.getDate() === today.getDate()
            };
        })
        .filter(b => b.isToday);

    const today = new Date().toISOString().split('T')[0];
    const todayCals = (store.nutrition?.foodLogs?.[today] || []).reduce((acc, curr) => acc + curr.calories, 0);
    const todayWorkout = (store.fitness?.sessions || []).find(s => s.date === today && !s.isTemplate);

    const cards = [
        { name: 'Tasks', value: `${activeTasksCount} Active`, icon: CheckCircle2, color: 'text-blue-500', bg: 'bg-blue-500/10', path: '/app/tasks' },
        { name: 'Nutrition', value: `${todayCals} kcal`, icon: Apple, color: 'text-orange-500', bg: 'bg-orange-500/10', path: '/app/nutrition' },
        { name: 'Fitness', value: todayWorkout ? `${todayWorkout.exercises.length} Exercises` : 'No Workout', icon: Dumbbell, color: 'text-red-500', bg: 'bg-red-500/10', path: '/app/fitness' },
        { name: 'Money', value: `₹${balance.toLocaleString('en-IN')}`, icon: Wallet, color: 'text-green-500', bg: 'bg-green-500/10', path: '/app/money' },
        { name: 'Brain', value: `${store.brainDumps.length} Captured`, icon: Brain, color: 'text-blue-500', bg: 'bg-blue-500/10', path: '/app/brain-dump' },
        { name: 'Calendar', value: `${upcomingEvents} Upcoming`, icon: Calendar, color: 'text-purple-500', bg: 'bg-purple-500/10', path: '/app/calendar' },
    ];

    return (
        <div className="flex flex-col gap-12 max-w-2xl mx-auto">
            <div className="flex flex-col gap-2">
                <span className="text-[11px] uppercase tracking-[0.4em] font-bold text-[var(--text-secondary)]">Overview</span>
                <h1 className="text-3xl font-bold mt-1">Welcome back.</h1>
            </div>

            {/* Today's Birthdays Banner */}
            {todaysBirthdays.length > 0 && (
                <div
                    onClick={() => navigate('/app/birthdays')}
                    className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-3xl p-6 border border-blue-500/20 interactive-card relative overflow-hidden group"
                >
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-500">
                        <Gift size={100} />
                    </div>
                    <div className="flex flex-col md:flex-row md:items-center gap-4 relative z-10">
                        <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                            <Gift size={24} />
                        </div>
                        <div>
                            <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-blue-400 block mb-1">Today's Birthdays</span>
                            <div className="flex flex-col gap-1">
                                {todaysBirthdays.map(b => (
                                    <span key={b.id} className="text-lg font-bold leading-tight">
                                        {b.person} is turning {b.age}! 🎉
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Launchpad Grid */}
            <div className="grid grid-cols-2 gap-4">
                {cards.map(card => (
                    <div
                        key={card.path}
                        onClick={() => navigate(card.path)}
                        className="card interactive-card flex flex-col gap-6 justify-between group"
                    >
                        <div className="flex items-center justify-between">
                            <div className={`w-11 h-11 rounded-2xl ${card.bg} flex items-center justify-center transition-transform group-hover:scale-110`}>
                                <card.icon className={card.color} size={20} />
                            </div>
                            <ArrowRight size={14} className="text-[var(--text-secondary)] opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div>
                            <span className="text-xs font-semibold text-[var(--text-secondary)] block mb-1 uppercase tracking-wider">{card.name}</span>
                            <p className="text-lg font-semibold leading-tight">{card.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Habits */}
            {activeHabits.length > 0 && (
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <span className="section-label !mb-0">Habits</span>
                        <button onClick={() => navigate('/app/habits')} className="text-[10px] uppercase font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">See All</button>
                    </div>
                    <div className="flex flex-col gap-3">
                        {activeHabits.map(habit => (
                            <div key={habit.id} className="card flex items-center justify-between interactive-card" onClick={() => navigate('/app/habits')}>
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center justify-center text-blue-500">
                                        <Activity size={18} />
                                    </div>
                                    <span className="text-sm font-medium">{habit.title}</span>
                                </div>
                                <div className="flex gap-1.5">
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <div key={i} className="w-2.5 h-2.5 rounded-full bg-[var(--bg-elevated)] border border-[var(--border)]" />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Recent Brain Dumps */}
            {recentDumps.length > 0 && (
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <span className="section-label !mb-0">Recent Thoughts</span>
                        <button onClick={() => navigate('/app/brain-dump')} className="text-[10px] uppercase font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Capture</button>
                    </div>
                    <div className="grid gap-4">
                        {recentDumps.map(dump => (
                            <div key={dump.id} className="card border-l-4 border-l-orange-500/50 interactive-card" onClick={() => navigate('/app/brain-dump')}>
                                <p className="text-sm text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                                    {dump.content}
                                </p>
                                <span className="text-[9px] uppercase tracking-widest font-bold text-[var(--text-secondary)] mt-3 block">
                                    {new Date(dump.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default DashboardPage;
