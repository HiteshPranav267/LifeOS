import { useState } from 'react';
import { useStore } from '../store/StoreContext';
import { Plus, Trash2, CalendarHeart } from 'lucide-react';
import type { Birthday } from '../types';

const BirthdaysPage = () => {
    const { store, setBirthdays } = useStore();
    const [isAdding, setIsAdding] = useState(false);
    const [person, setPerson] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    const handleSave = () => {
        if (!person.trim()) return;

        const newBirthday: Birthday = {
            id: crypto.randomUUID(),
            person,
            date,
        };
        setBirthdays([...(store.birthdays || []), newBirthday]);

        setIsAdding(false);
        setPerson('');
        setDate(new Date().toISOString().split('T')[0]);
    };

    const deleteBirthday = (id: string) => {
        setBirthdays((store.birthdays || []).filter(b => b.id !== id));
    };

    // Calculate next birthday occurrences
    const sortedBirthdays = [...(store.birthdays || [])].map(birthday => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const bDay = new Date(birthday.date);

        // Find next occurrence
        let nextOccur = new Date(today.getFullYear(), bDay.getMonth(), bDay.getDate());
        if (nextOccur.getTime() < today.getTime()) {
            nextOccur.setFullYear(today.getFullYear() + 1);
        }

        const daysUntil = Math.ceil((nextOccur.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        const age = nextOccur.getFullYear() - bDay.getFullYear();

        return {
            ...birthday,
            nextOccur,
            daysUntil,
            age
        };
    }).sort((a, b) => a.daysUntil - b.daysUntil);

    return (
        <div className="flex flex-col gap-10 max-w-2xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <span className="text-[11px] uppercase tracking-[0.4em] font-bold text-[var(--text-secondary)]">People</span>
                    <h1 className="text-3xl font-bold mt-2">Birthdays.</h1>
                </div>
                <button
                    onClick={() => setIsAdding(true)}
                    className="w-14 h-14 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] flex items-center justify-center shadow-lg active:scale-90 transition-transform"
                >
                    <Plus size={24} />
                </button>
            </div>

            <section>
                <div className="flex flex-col gap-4">
                    {sortedBirthdays.length > 0 ? sortedBirthdays.map((b) => (
                        <div key={b.id} className="card flex items-center justify-between group">
                            <div className="flex items-center gap-6">
                                <div className="flex flex-col items-center justify-center w-14 h-14 bg-[var(--bg-elevated)] rounded-2xl border border-[var(--border)] relative overflow-hidden">
                                    {b.daysUntil === 0 && <div className="absolute inset-0 bg-blue-500/20" />}
                                    <span className="text-[10px] uppercase font-bold text-[var(--text-secondary)] leading-none mb-1">
                                        {b.nextOccur.toLocaleString('default', { month: 'short' })}
                                    </span>
                                    <span className="text-lg font-bold leading-none">{b.nextOccur.getDate()}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-base font-semibold">{b.person}</span>
                                    <div className="flex items-center gap-1.5 mt-1">
                                        <CalendarHeart size={12} className={b.daysUntil === 0 ? "text-blue-500" : "text-[var(--text-secondary)]"} />
                                        <span className={`text-xs font-medium ${b.daysUntil <= 14 ? 'text-blue-400' : 'text-[var(--text-secondary)]'}`}>
                                            {b.daysUntil === 0
                                                ? `Today! Turning ${b.age}`
                                                : b.daysUntil === 1
                                                    ? `Tomorrow (Turning ${b.age})`
                                                    : `In ${b.daysUntil} days (Turning ${b.age})`}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => deleteBirthday(b.id)} className="p-2 text-[var(--text-secondary)] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                                <Trash2 size={20} />
                            </button>
                        </div>
                    )) : (
                        <div className="p-16 text-center text-[var(--text-secondary)] italic text-lg border-2 border-dashed border-[var(--border)] rounded-3xl cursor-pointer hover:bg-[var(--bg-elevated)] transition-colors" onClick={() => setIsAdding(true)}>
                            No birthdays tracked yet. Click to add one.
                        </div>
                    )}
                </div>
            </section>

            {/* Add Modal */}
            {isAdding && (
                <div className="modal-overlay" onClick={() => setIsAdding(false)}>
                    <div className="modal-card" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-semibold mb-6">Add Birthday</h3>
                        <div className="flex flex-col gap-4">
                            <input
                                placeholder="Person's name"
                                value={person}
                                onChange={(e) => setPerson(e.target.value)}
                                autoFocus
                            />
                            <div className="flex flex-col gap-1.5">
                                <span className="text-xs text-[var(--text-secondary)] font-medium px-1">Birth Date (Year helps calculate age)</span>
                                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button className="flex-1 h-12 bg-[var(--text-primary)] text-[var(--bg-primary)] rounded-xl font-semibold active:scale-95 transition-transform" onClick={handleSave}>
                                    Save
                                </button>
                                <button className="h-12 px-6 bg-[var(--bg-elevated)] rounded-xl font-semibold active:scale-95 transition-transform" onClick={() => setIsAdding(false)}>
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

export default BirthdaysPage;
