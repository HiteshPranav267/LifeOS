import { useState } from 'react';
import { useStore } from '../store/StoreContext.tsx';
import { Plus, Clock, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Event } from '../types';

const CalendarPage = () => {
    const { store, setEvents } = useStore();
    const [isAdding, setIsAdding] = useState(false);
    const [editingEvent, setEditingEvent] = useState<Event | null>(null);
    const [title, setTitle] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [time, setTime] = useState('12:00');
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const handleSave = () => {
        if (!title.trim()) return;

        if (editingEvent) {
            const updated = store.events.map(e =>
                e.id === editingEvent.id ? { ...e, title, date, time } : e
            );
            setEvents(updated);
        } else {
            const newEvent: Event = {
                id: crypto.randomUUID(),
                title,
                date,
                time,
                type: 'event',
                createdAt: new Date().toISOString(),
            };
            setEvents([...store.events, newEvent]);
        }
        closeModal();
    };

    const deleteEvent = (id: string) => {
        setEvents(store.events.filter(e => e.id !== id));
    };

    const openEdit = (event: Event) => {
        setEditingEvent(event);
        setTitle(event.title);
        setDate(event.date);
        setTime(event.time);
        setIsAdding(true);
    };

    const closeModal = () => {
        setIsAdding(false);
        setEditingEvent(null);
        setTitle('');
        setDate(new Date().toISOString().split('T')[0]);
        setTime('12:00');
    };

    // Calendar Helper
    const daysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

    const renderCalendar = () => {
        const days = [];
        const numDays = daysInMonth(currentMonth);
        const startDay = firstDayOfMonth(currentMonth);

        // Padding
        for (let i = 0; i < (startDay === 0 ? 6 : startDay - 1); i++) {
            days.push(<div key={`empty-${i}`} className="h-14 opacity-5" />);
        }

        for (let d = 1; d <= numDays; d++) {
            const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const hasEvent = store.events.some(e => e.date === dateStr);
            const isToday = new Date().toISOString().split('T')[0] === dateStr;

            days.push(
                <div key={d} className="h-14 flex flex-col items-center justify-center relative group">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isToday ? 'bg-white text-black' : 'hover:bg-neutral-800'}`}>
                        <span className="text-xs font-semibold">{d}</span>
                    </div>
                    {hasEvent && <div className="absolute bottom-1 w-1 h-1 rounded-full bg-blue-500" />}
                </div>
            );
        }
        return days;
    };

    const upcoming = [...store.events]
        .filter(e => new Date(e.date) >= new Date())
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 5);

    return (
        <div className="flex flex-col gap-10 max-w-2xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <span className="text-[11px] uppercase tracking-[0.4em] font-bold text-neutral-600">Chronicle</span>
                    <h1 className="serif mt-2">Timeline.</h1>
                </div>
                <button
                    onClick={() => setIsAdding(true)}
                    className="w-14 h-14 rounded-full bg-white text-black flex items-center justify-center shadow-xl active:scale-90 transition-transform"
                >
                    <Plus size={24} />
                </button>
            </div>

            <section className="flex flex-col gap-10">
                {/* Visual Grid */}
                <div className="card p-8 bg-neutral-900/10 border-none shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <span className="text-lg font-semibold capitalize serif">
                            {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                        </span>
                        <div className="flex gap-2">
                            <button onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))} className="p-2 hover:bg-neutral-800 rounded-full">
                                <ChevronLeft size={20} />
                            </button>
                            <button onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))} className="p-2 hover:bg-neutral-800 rounded-full">
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>
                    <div className="grid grid-cols-7 gap-y-2 mb-4">
                        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map(d => (
                            <div key={d} className="text-center text-[10px] font-bold text-neutral-700 uppercase tracking-widest">{d}</div>
                        ))}
                    </div>
                    <div className="grid grid-cols-7 gap-y-4">
                        {renderCalendar()}
                    </div>
                </div>

                {/* Vertical Timeline (iPhone Style) */}
                <div>
                    <span className="section-label m-0 mb-8 opacity-40 uppercase tracking-widest">Horizon List</span>
                    <div className="flex flex-col gap-4">
                        {upcoming.length > 0 ? upcoming.map(e => (
                            <div key={e.id} className="card p-6 py-5 group flex items-center justify-between interactive-card" onClick={() => openEdit(e)}>
                                <div className="flex items-center gap-6">
                                    <div className="flex flex-col items-center justify-center w-12 h-12 bg-neutral-900 rounded-2xl border border-neutral-800">
                                        <span className="text-[10px] uppercase font-bold text-neutral-600 leading-none mb-1">{new Date(e.date).toLocaleString('default', { month: 'short' })}</span>
                                        <span className="text-lg font-bold leading-none">{new Date(e.date).getDate()}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-base font-semibold">{e.title}</span>
                                        <div className="flex items-center gap-1.5 mt-1">
                                            <Clock size={10} className="text-neutral-600" />
                                            <span className="text-[10px] text-neutral-600 uppercase tracking-wider font-bold">{e.time}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={(e_original) => { e_original.stopPropagation(); deleteEvent(e.id); }} className="p-2 hover:text-red-500">
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            </div>
                        )) : (
                            <div className="p-20 text-center opacity-30 italic serif text-xl lowercase border-2 border-dashed border-neutral-800 rounded-3xl">
                                The horizon is clear. No events discovered.
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {isAdding && (
                <div className="modal-overlay">
                    <div className="modal-card">
                        <h3 className="text-2xl font-semibold mb-8">Plot Event.</h3>
                        <div className="flex flex-col gap-6">
                            <input
                                placeholder="What is the occasion?"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="bg-neutral-900 border-none rounded-2xl p-6"
                                autoFocus
                            />

                            <div className="flex gap-4">
                                <div className="flex-1 flex flex-col gap-1.5">
                                    <span className="text-[10px] px-4 uppercase font-bold tracking-widest opacity-40">Date</span>
                                    <input
                                        type="date"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        className="bg-neutral-900 border-none rounded-2xl p-6 mb-0!"
                                    />
                                </div>
                                <div className="flex-1 flex flex-col gap-1.5">
                                    <span className="text-[10px] px-4 uppercase font-bold tracking-widest opacity-40">Time</span>
                                    <input
                                        type="time"
                                        value={time}
                                        onChange={(e) => setTime(e.target.value)}
                                        className="bg-neutral-900 border-none rounded-2xl p-6 mb-0!"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4 border-t border-neutral-900">
                                <button className="btn-pill flex-1 bg-white text-black text-lg" onClick={handleSave}>
                                    Save to Chronicle
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

export default CalendarPage;
