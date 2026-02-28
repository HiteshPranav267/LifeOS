import { useStore } from '../store/StoreContext.tsx';
import { CheckSquare, Calendar, Activity, Zap, Wallet, ArrowUpRight, Pencil, Trash2 } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';

const DashboardPage = () => {
    const { store, setTasks, setEvents } = useStore();
    const navigate = useNavigate();

    const today = new Date().toISOString().split('T')[0];
    const activeTasks = store.tasks.filter(t => t.status !== 'completed');
    const todayTasks = activeTasks.filter(t => t.deadline === today);
    const upcomingTasks = activeTasks.filter(t => t.deadline >= today).sort((a, b) => a.deadline.localeCompare(b.deadline)).slice(0, 5);

    const todayEvents = store.events.filter(e => e.date === today);
    const upcomingEvents = store.events.filter(e => e.date >= today).sort((a, b) => a.date.localeCompare(b.date) || a.start.localeCompare(b.start)).slice(0, 3);

    const totalHabits = store.habits.length;
    const completedHabitsToday = store.habits.filter(h => h.completions.includes(today)).length;
    const habitPercentage = totalHabits > 0 ? (completedHabitsToday / totalHabits) * 100 : 0;

    const totalBalance = store.transactions.reduce((acc, t) => t.type === 'income' ? acc + t.amount : acc - t.amount, 0);

    const getAIInsight = () => {
        if (activeTasks.length > 8) return "High volume of open intentions. Focus on your top 3 'High' priority items today.";
        if (habitPercentage < 30 && totalHabits > 0) return "Consistency yields momentum. Pick one ritual to complete now.";
        if (todayEvents.length > 3) return "Temporal density is high. Ensure buffer periods between records.";
        return "The system is in homeostasis. Your current distribution looks sustainable.";
    };

    const deleteEvent = (id: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (confirm('Delete this chronicle record?')) {
            setEvents(store.events.filter(ev => ev.id !== id));
        }
    };

    const deleteTask = (id: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (confirm('Delete this intention record?')) {
            setTasks(store.tasks.filter(t => t.id !== id));
        }
    };

    return (
        <div className="flex flex-col gap-10">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="card shadow-sm border-none bg-neutral-900 overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <CheckSquare size={64} />
                    </div>
                    <span className="section-label lowercase tracking-widest opacity-60">Open Intentions</span>
                    <p className="serif text-4xl mt-2 tracking-tight">{activeTasks.length}</p>
                </div>

                <div className="card shadow-sm border-none bg-neutral-900 overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Calendar size={64} />
                    </div>
                    <span className="section-label lowercase tracking-widest opacity-60">Daily Records</span>
                    <p className="serif text-4xl mt-2 tracking-tight">{todayEvents.length}</p>
                </div>

                <div className="card shadow-sm border-none bg-neutral-900 overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Activity size={64} />
                    </div>
                    <span className="section-label lowercase tracking-widest opacity-60">Ritual Yield</span>
                    <p className="serif text-4xl mt-2 tracking-tight">{Math.round(habitPercentage)}%</p>
                </div>

                <div className="card shadow-sm border-none bg-neutral-900 overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Wallet size={64} />
                    </div>
                    <span className="section-label lowercase tracking-widest opacity-60">Liquid Capital</span>
                    <p className={`serif text-3xl mt-2 tracking-tight ${totalBalance >= 0 ? 'text-white' : 'text-red-400'}`}>
                        ₹{totalBalance.toLocaleString('en-IN')}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2 flex flex-col gap-10">
                    {/* Active Intents */}
                    <section>
                        <div className="flex items-center justify-between border-b border-neutral-800 pb-4 mb-6">
                            <span className="section-label lowercase tracking-widest m-0 opacity-60">Immediate Intentions</span>
                            <NavLink to="/tasks" className="text-[10px] uppercase font-bold tracking-widest hover:text-white transition-colors flex items-center gap-1">
                                Expand Chronicle <ArrowUpRight size={10} />
                            </NavLink>
                        </div>
                        <div className="flex flex-col gap-3">
                            {(todayTasks.length > 0 ? todayTasks : upcomingTasks).length > 0 ? (
                                (todayTasks.length > 0 ? todayTasks : upcomingTasks).map(task => (
                                    <div key={task.id} className="group flex items-center justify-between py-4 px-6 rounded-2xl bg-neutral-900/50 border border-neutral-800 hover:border-neutral-700 transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-1 h-1 rounded-full ${task.priority === 'high' ? 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.5)]' : 'bg-neutral-600'}`} />
                                            <span className="text-sm font-light tracking-wide">{task.title}</span>
                                        </div>
                                        <div className="flex items-center gap-4 opacity-30 group-hover:opacity-100 transition-all">
                                            <button onClick={() => navigate('/tasks')} className="hover:text-white transition-colors">
                                                <Pencil size={12} strokeWidth={2} />
                                            </button>
                                            <button onClick={(e) => deleteTask(task.id, e)} className="hover:text-white transition-colors">
                                                <Trash2 size={14} strokeWidth={2} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="serif italic text-neutral-500 text-xl py-6 opacity-40">The task chronicle is awaiting records.</p>
                            )}
                        </div>
                    </section>

                    {/* Records List */}
                    <section>
                        <div className="flex items-center justify-between border-b border-neutral-800 pb-4 mb-6">
                            <span className="section-label lowercase tracking-widest m-0 opacity-60">Temporal Records</span>
                            <NavLink to="/calendar" className="text-[10px] uppercase font-bold tracking-widest hover:text-white transition-colors flex items-center gap-1">
                                Expand Timeline <ArrowUpRight size={10} />
                            </NavLink>
                        </div>
                        <div className="flex flex-col gap-3">
                            {(todayEvents.length > 0 ? todayEvents : upcomingEvents).length > 0 ? (
                                (todayEvents.length > 0 ? todayEvents : upcomingEvents).map(event => (
                                    <div key={event.id} className="group flex items-center justify-between py-4 px-6 rounded-2xl bg-neutral-900/50 border border-neutral-800">
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-sm font-light">{event.title}</span>
                                            {event.date !== today && <span className="text-[9px] uppercase tracking-widest opacity-40">{event.date}</span>}
                                        </div>
                                        <div className="flex items-center gap-4 opacity-30 group-hover:opacity-100 transition-all">
                                            <span className="text-xs font-bold font-mono opacity-60 mr-2">{event.start} — {event.end}</span>
                                            <button onClick={() => navigate('/calendar')} className="hover:text-white transition-colors">
                                                <Pencil size={12} strokeWidth={2} />
                                            </button>
                                            <button onClick={(e) => deleteEvent(event.id, e)} className="hover:text-white transition-colors">
                                                <Trash2 size={14} strokeWidth={2} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="serif italic text-neutral-500 text-xl py-6 opacity-40">No records found on the horizon.</p>
                            )}
                        </div>
                    </section>
                </div>

                {/* AI Insight */}
                <div>
                    <div className="card bg-neutral-900 border-none shadow-xl sticky top-24" style={{ borderStyle: 'dashed', borderWidth: '1px', borderColor: 'var(--border)' }}>
                        <div className="flex items-center gap-3 border-b border-neutral-800 pb-4 mb-6">
                            <Zap size={16} strokeWidth={2.5} className="text-white" />
                            <span className="section-label lowercase tracking-widest m-0 opacity-60">Cognitive Synthesis</span>
                        </div>
                        <p className="serif italic text-neutral-300 text-lg leading-relaxed lowercase">
                            "{getAIInsight()}"
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;
