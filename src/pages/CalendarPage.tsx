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
    const [selectedDate, setSelectedDate] = useState<string | null>(null);

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

        for (let i = 0; i < (startDay === 0 ? 6 : startDay - 1); i++) {
            days.push(<div key={`empty-${i}`} className="h-14 opacity-5" />);
        }

        for (let d = 1; d <= numDays; d++) {
            const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const hasEvent = store.events.some(e => e.date === dateStr);
            const isToday = new Date().toISOString().split('T')[0] === dateStr;

            days.push(
                <div
                    key={d}
                    className="h-14 flex flex-col items-center justify-center relative group cursor-pointer"
                    onClick={() => setSelectedDate(selectedDate === dateStr ? null : dateStr)}
                >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${selectedDate === dateStr
                            ? 'bg-blue-500 text-white shadow-[0_0_12px_rgba(59,130,246,0.5)]'
                            : isToday
                                ? 'bg-[var(--text-primary)] text-[var(--bg-primary)]'
                                : 'hover:bg-[var(--bg-elevated)]'
                        }`}>
                        <span className="text-xs font-semibold">{d}</span>
                    </div>
                    {hasEvent && <div className={`absolute bottom-1 w-1 h-1 rounded-full transition-colors ${selectedDate === dateStr ? 'bg-white' : 'bg-blue-500'}`} />}
                </div>
            );
        }
        return days;
    };

    const displayedEvents = selectedDate
        ? store.events
            .filter(e => e.date === selectedDate)
            .sort((a, b) => a.time.localeCompare(b.time))
        : [...store.events]
            .filter(e => new Date(e.date).getTime() >= new Date().setHours(0, 0, 0, 0))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .slice(0, 5);

    return (
        <div className="flex flex-col gap-10 max-w-2xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <span className="text-[11px] uppercase tracking-[0.4em] font-bold text-[var(--text-secondary)]">Chronicle</span>
                    <h1 className="text-3xl font-bold mt-2">Timeline.</h1>
                </div>
                <button
                    onClick={() => {
                        setIsAdding(true);
                        setDate(selectedDate || new Date().toISOString().split('T')[0]);
                    }}
                    className="w-14 h-14 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] flex items-center justify-center shadow-lg active:scale-90 transition-transform"
                >
                    <Plus size={24} />
                </button>
            </div>

            <section className="flex flex-col gap-10">
                {/* Calendar Grid */}
                <div className="card">
                    <div className="flex items-center justify-between mb-8">
                        <span className="text-lg font-semibold capitalize">
                            {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                        </span>
                        <div className="flex gap-2">
                            <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))} className="p-2 hover:bg-[var(--bg-elevated)] rounded-full transition-colors">
                                <ChevronLeft size={20} />
                            </button>
                            <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))} className="p-2 hover:bg-[var(--bg-elevated)] rounded-full transition-colors">
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>
                    <div className="grid grid-cols-7 gap-y-2 mb-4">
                        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                            <div key={`${d}-${i}`} className="text-center text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">{d}</div>
                        ))}
                    </div>
                    <div className="grid grid-cols-7 gap-y-4">
                        {renderCalendar()}
                    </div>
                </div>

                {/* Events List */}
                <div>
                    <span className="section-label">
                        {selectedDate
                            ? `Events for ${new Date(selectedDate).toLocaleString('default', { month: 'short', day: 'numeric', year: 'numeric' })}`
                            : 'Upcoming'}
                    </span>
                    <div className="flex flex-col gap-4">
                        {displayedEvents.length > 0 ? displayedEvents.map(e => (
                            <div key={e.id} className="card flex items-center justify-between group interactive-card" onClick={() => openEdit(e)}>
                                <div className="flex items-center gap-6">
                                    <div className="flex flex-col items-center justify-center w-12 h-12 bg-[var(--bg-elevated)] rounded-2xl border border-[var(--border)]">
                                        <span className="text-[10px] uppercase font-bold text-[var(--text-secondary)] leading-none mb-1">{new Date(e.date).toLocaleString('default', { month: 'short' })}</span>
                                        <span className="text-lg font-bold leading-none">{new Date(e.date).getDate()}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-base font-semibold">{e.title}</span>
                                        <div className="flex items-center gap-1.5 mt-1">
                                            <Clock size={10} className="text-[var(--text-secondary)]" />
                                            <span className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider font-bold">{e.time}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={(ev) => { ev.stopPropagation(); deleteEvent(e.id); }} className="p-2 hover:text-red-500 transition-colors">
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            </div>
                        )) : (
                            <div className="p-16 text-center text-[var(--text-secondary)] italic text-lg border-2 border-dashed border-[var(--border)] rounded-3xl cursor-pointer hover:bg-[var(--bg-elevated)] transition-colors" onClick={() => {
                                setIsAdding(true);
                                setDate(selectedDate || new Date().toISOString().split('T')[0]);
                            }}>
                                {selectedDate ? 'No events for this date. Click to add one.' : 'No upcoming events.'}
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {isAdding && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-card" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-semibold mb-6">Add Event</h3>
                        <div className="flex flex-col gap-4">
                            <input
                                placeholder="Event name"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                autoFocus
                            />
                            <div className="flex gap-4">
                                <div className="flex-1 flex flex-col gap-1.5">
                                    <span className="text-xs text-[var(--text-secondary)] font-medium px-1">Date</span>
                                    <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                                </div>
                                <div className="flex-1 flex flex-col gap-1.5">
                                    <span className="text-xs text-[var(--text-secondary)] font-medium px-1">Time</span>
                                    <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
                                </div>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button className="flex-1 h-12 bg-[var(--text-primary)] text-[var(--bg-primary)] rounded-xl font-semibold active:scale-95 transition-transform" onClick={handleSave}>
                                    Save
                                </button>
                                <button className="h-12 px-6 bg-[var(--bg-elevated)] rounded-xl font-semibold active:scale-95 transition-transform" onClick={closeModal}>
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
