import { useState } from 'react';
import { useStore } from '../store/StoreContext.tsx';
import { Plus, Activity, Trash2, Pencil, Zap } from 'lucide-react';
import type { Habit } from '../types';

const HabitsPage = () => {
    const { store, setHabits } = useStore();
    const [isAdding, setIsAdding] = useState(false);
    const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
    const [title, setTitle] = useState('');
    const [frequency, setFrequency] = useState('daily');

    const handleSave = () => {
        if (!title.trim()) return;

        if (editingHabit) {
            const updated = store.habits.map(h =>
                h.id === editingHabit.id ? { ...h, title, frequency } : h
            );
            setHabits(updated);
        } else {
            const newHabit: Habit = {
                id: crypto.randomUUID(),
                title,
                frequency,
                streak: 0,
                completedDays: [],
            };
            setHabits([...store.habits, newHabit]);
        }
        closeModal();
    };

    const toggleDay = (habitId: string) => {
        const today = new Date().toISOString().split('T')[0];
        setHabits(store.habits.map(h => {
            if (h.id === habitId) {
                const completed = h.completedDays.includes(today)
                    ? h.completedDays.filter(d => d !== today)
                    : [...h.completedDays, today];
                return { ...h, completedDays: completed, streak: completed.length };
            }
            return h;
        }));
    };

    const deleteHabit = (id: string) => {
        setHabits(store.habits.filter(h => h.id !== id));
    };

    const openEdit = (habit: Habit) => {
        setEditingHabit(habit);
        setTitle(habit.title);
        setFrequency(habit.frequency);
        setIsAdding(true);
    };

    const closeModal = () => {
        setIsAdding(false);
        setEditingHabit(null);
        setTitle('');
        setFrequency('daily');
    };

    const todayStr = new Date().toISOString().split('T')[0];

    return (
        <div className="flex flex-col gap-10 max-w-2xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <span className="text-[11px] uppercase tracking-[0.4em] font-bold text-neutral-600">Evolution</span>
                    <h1 className="serif mt-2">Rituals.</h1>
                </div>
                <button
                    onClick={() => setIsAdding(true)}
                    className="w-14 h-14 rounded-full bg-white text-black flex items-center justify-center shadow-xl active:scale-90 transition-transform"
                >
                    <Plus size={24} />
                </button>
            </div>

            <section className="flex flex-col gap-8">
                <div>
                    <span className="section-label m-0 mb-6 opacity-40">Today's Sequence</span>
                    <div className="flex flex-col gap-4">
                        {store.habits.length > 0 ? store.habits.map(habit => {
                            const completedToday = habit.completedDays.includes(todayStr);
                            return (
                                <div key={habit.id} className="card p-6 py-5 group flex items-center justify-between">
                                    <div className="flex items-center gap-6 flex-1" onClick={() => toggleDay(habit.id)}>
                                        <div className={`w-14 h-14 rounded-2xl border-2 transition-all flex items-center justify-center ${completedToday ? 'bg-blue-600 border-blue-600 shadow-lg' : 'bg-neutral-900 border-neutral-800 opacity-60'}`}>
                                            <Activity size={24} className={completedToday ? 'text-white' : 'text-neutral-500'} />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className={`text-xl font-semibold leading-tight ${completedToday ? 'text-white' : 'text-neutral-300'}`}>{habit.title}</span>
                                            <div className="flex items-center gap-4 mt-2">
                                                <div className="flex items-center gap-1.5 px-3 py-1 bg-neutral-900 rounded-full">
                                                    <Zap size={10} className="text-orange-500" />
                                                    <span className="text-[10px] font-bold tracking-widest text-orange-500/80 uppercase">{habit.streak} Day Pulse</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => openEdit(habit)} className="p-2 hover:text-blue-500 transition-colors">
                                            <Pencil size={20} />
                                        </button>
                                        <button onClick={() => deleteHabit(habit.id)} className="p-2 hover:text-red-500 transition-colors">
                                            <Trash2 size={24} />
                                        </button>
                                    </div>
                                </div>
                            )
                        }) : (
                            <div className="p-20 text-center opacity-30 italic serif text-xl lowercase border-2 border-dashed border-neutral-800 rounded-3xl">
                                No rituals established.
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {isAdding && (
                <div className="modal-overlay">
                    <div className="modal-card">
                        <h3 className="text-2xl font-semibold mb-8">Establish Ritual.</h3>
                        <div className="flex flex-col gap-8">
                            <input
                                placeholder="What is the daily ritual?"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="bg-neutral-900 border-none rounded-2xl p-6"
                                autoFocus
                            />

                            <div className="flex flex-col gap-4">
                                <span className="section-label m-0 text-center">Frequency of Execution</span>
                                <div className="flex gap-4">
                                    {['daily', 'weekly', 'growth'].map(f => (
                                        <button
                                            key={f}
                                            onClick={() => setFrequency(f)}
                                            className={`flex-1 py-4 rounded-xl text-[10px] uppercase font-bold tracking-widest border-2 transition-all ${frequency === f ? 'bg-white text-black border-white' : 'bg-neutral-900 border-transparent opacity-60'}`}
                                        >
                                            {f}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4 border-t border-neutral-900">
                                <button className="btn-pill flex-1 bg-white text-black text-lg" onClick={handleSave}>
                                    Save Ritual
                                </button>
                                <button className="btn-pill bg-neutral-800 text-white" onClick={closeModal}>
                                    Cancel
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
