import { useStore } from '../store/StoreContext.tsx';
import { Sparkles, CheckSquare, Calendar, Target } from 'lucide-react';

const WeeklyPlannerPage = () => {
    const { store, setWeeklyFocus } = useStore();
    const currentWeek = `${new Date().getFullYear()}-${Math.ceil(new Date().getDate() / 7)}`;
    const currentWeeklyFocus = store.weeklyFocus.find(w => w.weekId === currentWeek);

    const availableTasks = store.tasks.filter(t => t.status !== 'completed');
    const focusTasks = store.tasks.filter(t => currentWeeklyFocus?.focusTasks?.includes(t.id));

    const toggleFocus = (taskId: string) => {
        let newFocus: string[] = currentWeeklyFocus?.focusTasks ? [...currentWeeklyFocus.focusTasks] : [];
        if (newFocus.includes(taskId)) {
            newFocus = newFocus.filter(id => id !== taskId);
        } else {
            if (newFocus.length >= 8) { alert("Maximum focal capacity reached."); return; }
            newFocus.push(taskId);
        }
        const updated = store.weeklyFocus.filter(w => w.weekId !== currentWeek);
        updated.push({
            id: currentWeeklyFocus?.id || crypto.randomUUID(),
            weekStart: currentWeeklyFocus?.weekStart || new Date().toISOString(),
            focus: currentWeeklyFocus?.focus || '',
            objectives: currentWeeklyFocus?.objectives || [],
            weekId: currentWeek,
            focusTasks: newFocus
        });
        setWeeklyFocus(updated);
    };

    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    return (
        <div className="flex flex-col gap-10">
            <div className="flex flex-col lg:flex-row gap-10">
                <div className="flex-1">
                    {/* Focal Repository */}
                    <section className="mb-14">
                        <div className="flex items-center gap-3 border-b border-[var(--border)] pb-4 mb-8">
                            <Target size={18} className="text-[var(--text-muted)]" />
                            <span className="section-label lowercase tracking-widest opacity-60 m-0">Repository of Intent</span>
                            <div className="flex-1" />
                            <span className="text-[10px] uppercase font-bold tracking-widest opacity-40">{focusTasks.length} / 8 slots active</span>
                        </div>

                        <div className="flex flex-col rounded-2xl overflow-hidden border border-[var(--border)] shadow-sm">
                            {availableTasks.length > 0 ? availableTasks.map(task => {
                                const isFocus = focusTasks.some(ft => ft.id === task.id);
                                return (
                                    <div key={task.id} className={`flex items-center justify-between px-6 py-5 transition-all duration-300 ${isFocus ? 'bg-[var(--bg-tertiary)] opacity-100' : 'bg-[var(--bg-secondary)] opacity-60 hover:opacity-100'} hover:bg-[var(--bg-tertiary)]`} style={{ borderBottom: '1px solid var(--border)' }}>
                                        <div className="flex items-center gap-4">
                                            <div className={`p-1 rounded-sm border ${isFocus ? 'border-[var(--text-primary)] text-[var(--text-primary)]' : 'border-[var(--text-muted)] text-[var(--text-muted)]'}`}>
                                                <CheckSquare size={12} strokeWidth={3} />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className={`text-sm font-medium ${isFocus ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}>{task.title}</span>
                                                <span className="text-[9px] uppercase tracking-widest font-bold opacity-40">{task.category}</span>
                                            </div>
                                        </div>
                                        <button
                                            className={`btn-pill text-[10px] uppercase py-1.5! px-4! transition-all ${isFocus ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] border-[var(--text-primary)]' : ''}`}
                                            onClick={() => toggleFocus(task.id)}
                                        >
                                            {isFocus ? 'Focalised' : 'Focus'}
                                        </button>
                                    </div>
                                );
                            }) : (
                                <div className="text-center py-24 bg-[var(--bg-secondary)] opacity-30">
                                    <p className="serif italic text-2xl lowercase">The task repository is empty.</p>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Temporal Sequencing Grid */}
                    <section>
                        <div className="flex items-center gap-3 border-b border-[var(--border)] pb-4 mb-8">
                            <Calendar size={18} className="text-[var(--text-muted)]" />
                            <span className="section-label lowercase tracking-widest opacity-60 m-0">Temporal Sequence</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-7 gap-px rounded-2xl overflow-hidden border border-[var(--border)] shadow-sm bg-[var(--border)]">
                            {dayNames.map((day, idx) => {
                                const dayTasks = focusTasks.slice(idx, idx + Math.ceil(focusTasks.length / 7) + 1);
                                return (
                                    <div key={day} className="bg-[var(--bg-secondary)] p-4 min-h-[180px] flex flex-col gap-4 group hover:bg-[var(--bg-tertiary)] transition-colors">
                                        <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest opacity-60">{day}</span>
                                        <div className="flex flex-col gap-2">
                                            {dayTasks.length > 0 ? dayTasks.map(t => (
                                                <div key={t.id} className="text-[10px] p-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border)] border-l-2 border-l-[var(--text-primary)] text-gray-300 line-clamp-2 leading-relaxed opacity-80 group-hover:opacity-100 transition-opacity">
                                                    {t.title}
                                                </div>
                                            )) : (
                                                <span className="serif italic text-xs text-[var(--text-muted)] opacity-30 py-4">— Void</span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                </div>

                {/* System Analysis Sidebar */}
                <div className="w-full lg:w-72 flex flex-col gap-8">
                    <div className="card bg-[var(--bg-tertiary)]! border-none shadow-xl" style={{ borderStyle: 'dashed', borderWidth: '1px', borderColor: 'var(--border)' }}>
                        <div className="flex items-center gap-3 border-b border-[var(--border)]/10 pb-4 mb-6">
                            <Sparkles size={16} strokeWidth={2.5} className="text-[var(--text-primary)]" />
                            <span className="section-label lowercase tracking-widest m-0 opacity-60">System Synthesis</span>
                        </div>
                        <p className="serif italic text-[var(--text-secondary)] text-lg leading-relaxed lowercase">
                            "{focusTasks.length > 6
                                ? "Critical Load Detected. High probability of intention fragmentation. Simplify the sequence."
                                : focusTasks.length === 0
                                    ? "Define your focus to receive system synthesis. Clarity proceeds action."
                                    : "Balanced Sequence. Your focal intensity is within optimal parameters."}"
                        </p>
                    </div>

                    <div className="card border-none bg-[var(--bg-secondary)] p-6">
                        <span className="section-label lowercase tracking-widest block mb-4 opacity-60">Focal Distribution</span>
                        <div className="flex flex-col gap-3">
                            {['Work', 'Personal', 'Growth'].map(cat => {
                                const count = focusTasks.filter(t => t.category === cat).length;
                                const pct = focusTasks.length > 0 ? (count / focusTasks.length) * 100 : 0;
                                return (
                                    <div key={cat} className="flex flex-col gap-1.5">
                                        <div className="flex justify-between text-[9px] uppercase font-bold tracking-widest">
                                            <span className="opacity-60">{cat}</span>
                                            <span className="opacity-100">{count}</span>
                                        </div>
                                        <div className="w-full h-1 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
                                            <div className="h-full bg-[var(--text-primary)] transition-all duration-1000" style={{ width: `${pct}%` }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WeeklyPlannerPage;
