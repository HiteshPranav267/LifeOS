import { useState } from 'react';
import { useStore } from '../store/StoreContext.tsx';
import { Plus, Check, TrendingUp, Pencil, Trash2 } from 'lucide-react';
import type { Habit } from '../types';

const HabitsPage = () => {
    const { store, setHabits } = useStore();
    const [isAdding, setIsAdding] = useState(false);
    const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
    const [habitFormName, setHabitFormName] = useState('');

    const todayStr = new Date().toISOString().split('T')[0];
    const currentDate = new Date();
    const totalDays = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const days = Array.from({ length: totalDays }, (_, i) => i + 1);

    const toggleHabit = (id: string, date: string) => {
        setHabits(store.habits.map(h => {
            if (h.id !== id) return h;
            const completions = h.completions.includes(date)
                ? h.completions.filter(c => c !== date)
                : [...h.completions, date];
            return { ...h, completions } as Habit;
        }));
    };

    const handleSaveHabit = () => {
        if (!habitFormName.trim()) return;

        if (editingHabit) {
            setHabits(store.habits.map(h => (h.id === editingHabit.id ? { ...h, name: habitFormName } : h)));
        } else {
            if (store.habits.length >= 8) { alert("Maximum ritual capacity reached."); return; }
            setHabits([...store.habits, { id: crypto.randomUUID(), name: habitFormName, completions: [] }]);
        }
        closeModal();
    };

    const closeModal = () => {
        setIsAdding(false);
        setEditingHabit(null);
        setHabitFormName('');
    };

    const openEdit = (habit: Habit) => {
        setEditingHabit(habit);
        setHabitFormName(habit.name);
        setIsAdding(true);
    };

    const deleteHabit = (id: string) => {
        setHabits(store.habits.filter(h => h.id !== id));
    };

    return (
        <div className="flex flex-col gap-10">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-6">
                <div className="flex flex-col">
                    <span className="section-label">Rituals of Consistency</span>
                    <span className="serif italic text-[var(--text-muted)]">
                        {new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(currentDate)}
                    </span>
                </div>
                <button className="btn-pill" onClick={() => setIsAdding(true)}>
                    <Plus size={14} /> New Ritual
                </button>
            </div>

            <div className="flex flex-col gap-12">
                {store.habits.map(habit => {
                    const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
                    const monthlyCompletions = habit.completions.filter(c => c.startsWith(currentMonth)).length;
                    const completionRate = Math.round((monthlyCompletions / totalDays) * 100);

                    return (
                        <div key={habit.id} className="group flex flex-col gap-6">
                            <div className="flex justify-between items-end">
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-3">
                                        <h2 className="serif text-3xl lowercase">{habit.name}</h2>
                                        <div className="flex items-center gap-3 opacity-30 group-hover:opacity-100 transition-all duration-300">
                                            <button onClick={() => openEdit(habit)} className="hover:text-white transform hover:scale-110 transition-transform">
                                                <Pencil size={12} strokeWidth={2} />
                                            </button>
                                            <button onClick={() => deleteHabit(habit.id)} className="hover:text-white transform hover:scale-110 transition-transform">
                                                <Trash2 size={14} strokeWidth={2} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 mt-1 text-[var(--text-muted)] text-[10px] uppercase tracking-widest font-bold">
                                        <TrendingUp size={12} />
                                        <span>{habit.completions.length} cycles complete</span>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="serif text-2xl lowercase">{completionRate}% yield</span>
                                    <div className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] font-bold">{monthlyCompletions} / {totalDays} days</div>
                                </div>
                            </div>

                            {/* Grid */}
                            <div className="grid grid-cols-[repeat(auto-fill,minmax(28px,1fr))] gap-1.5">
                                {days.map(day => {
                                    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                    const isCompleted = habit.completions.includes(dateStr);
                                    const isToday = dateStr === todayStr;
                                    return (
                                        <button
                                            key={day}
                                            onClick={() => toggleHabit(habit.id, dateStr)}
                                            className={`aspect-square rounded-md flex items-center justify-center text-[10px] transition-all border
                        ${isCompleted ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] border-[var(--text-primary)]' : 'bg-transparent border-[var(--border)] hover:border-[var(--text-muted)]'}
                        ${isToday ? 'ring-2 ring-[var(--text-primary)] ring-offset-2 ring-offset-[var(--bg-primary)]' : ''}
                      `}
                                        >
                                            {isCompleted ? <Check size={12} strokeWidth={3} /> : <span className="opacity-30">{day}</span>}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Progress bar */}
                            <div className="w-full h-1 bg-[var(--border)] rounded-full overflow-hidden">
                                <div className="h-full bg-[var(--text-primary)] rounded-full transition-all duration-700" style={{ width: `${completionRate}%` }} />
                            </div>
                        </div>
                    );
                })}
                {store.habits.length === 0 && (
                    <div className="text-center py-20 border border-dashed border-[var(--border)] rounded-2xl">
                        <p className="serif italic text-[var(--text-muted)] text-xl opacity-60">No rituals established in this chronicle.</p>
                    </div>
                )}
            </div>

            {/* Modal */}
            {isAdding && (
                <div className="modal-overlay">
                    <div className="modal-card text-center">
                        <h3 className="serif text-2xl">{editingHabit ? 'Refine Ritual' : 'Establish Ritual'}</h3>
                        <div className="mt-8 flex flex-col gap-8">
                            <div className="flex flex-col gap-1">
                                <span className="section-label">Label</span>
                                <input
                                    placeholder="e.g. Deep Reading"
                                    value={habitFormName}
                                    onChange={(e) => setHabitFormName(e.target.value)}
                                    autoFocus
                                    className="text-center serif text-2xl! border-none p-0 focus:ring-0 active:ring-0 bg-transparent underline decoration-dotted decoration-[var(--border)]"
                                />
                            </div>
                            <div className="flex justify-center gap-6">
                                <button className="btn-ghost lowercase" onClick={closeModal}>Stow Away</button>
                                <button className="btn-pill px-10!" onClick={handleSaveHabit}>
                                    {editingHabit ? 'Keep Ritual' : 'Initiate Ritual'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HabitsPage;
