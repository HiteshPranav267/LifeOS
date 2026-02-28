import { useState } from 'react';
import { useStore } from '../store/StoreContext.tsx';
import { ChevronLeft, ChevronRight, Plus, Trash2, Sparkles, Pencil } from 'lucide-react';
import type { Event } from '../types';

const CalendarPage = () => {
    const { store, setEvents } = useStore();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [isAdding, setIsAdding] = useState(false);
    const [editingEvent, setEditingEvent] = useState<Event | null>(null);
    const [selectedDay, setSelectedDay] = useState<number | null>(null);
    const [eventForm, setEventForm] = useState({ title: '', start: '09:00', end: '10:00' });
    const [nlpInput, setNlpInput] = useState('');

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const todayStr = new Date().toISOString().split('T')[0];

    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);

    const dateStr = (day: number) => `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const getEventsForDay = (day: number) => store.events.filter(e => e.date === dateStr(day));

    const today = new Date();
    const isToday = (day: number) =>
        day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

    const handleSaveEvent = () => {
        if (!eventForm.title.trim()) return;

        if (editingEvent) {
            const updated = store.events.map(e =>
                e.id === editingEvent.id ? { ...e, ...eventForm } as Event : e
            );
            setEvents(updated);
        } else {
            if (selectedDay === null) return;
            const event: Event = {
                id: crypto.randomUUID(),
                title: eventForm.title,
                date: dateStr(selectedDay),
                start: eventForm.start,
                end: eventForm.end,
                category: 'Other',
            };
            setEvents([...store.events, event]);
        }
        closeModal();
    };

    const closeModal = () => {
        setIsAdding(false);
        setEditingEvent(null);
        setEventForm({ title: '', start: '09:00', end: '10:00' });
    };

    const openEdit = (event: Event) => {
        setEditingEvent(event);
        setEventForm({ title: event.title, start: event.start, end: event.end });
        // Set selectedDay based on event date if it's in the current month view
        const eventDate = new Date(event.date);
        if (eventDate.getMonth() === month && eventDate.getFullYear() === year) {
            setSelectedDay(eventDate.getDate());
        }
        setIsAdding(true);
    };

    const deleteEvent = (id: string) => {
        if (confirm('Delete this chronicle record?')) {
            setEvents(store.events.filter(e => e.id !== id));
        }
    };

    const parseNLP = () => {
        if (!nlpInput.trim()) return;
        const lower = nlpInput.toLowerCase();
        let title = nlpInput;
        let date = todayStr;
        let start = '09:00';

        const dayMap: Record<string, number> = { sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6 };
        for (const [dayName, dayNum] of Object.entries(dayMap)) {
            if (lower.includes(dayName)) {
                const d = new Date();
                const diff = (dayNum + 7 - d.getDay()) % 7 || 7;
                d.setDate(d.getDate() + diff);
                date = d.toISOString().split('T')[0];
                title = title.replace(new RegExp(dayName, 'i'), '').trim();
                break;
            }
        }

        const tmrw = lower.includes('tomorrow');
        if (tmrw) {
            const d = new Date();
            d.setDate(d.getDate() + 1);
            date = d.toISOString().split('T')[0];
            title = title.replace(/tomorrow/i, '').trim();
        }

        const timeMatch = lower.match(/(\d{1,2})\s*(am|pm)/);
        if (timeMatch) {
            let hour = parseInt(timeMatch[1]);
            if (timeMatch[2] === 'pm' && hour < 12) hour += 12;
            if (timeMatch[2] === 'am' && hour === 12) hour = 0;
            start = `${String(hour).padStart(2, '0')}:00`;
            title = title.replace(timeMatch[0], '').trim();
        }

        const endHour = parseInt(start.split(':')[0]) + 1;
        setEvents([...store.events, {
            id: crypto.randomUUID(),
            title: title || 'Untitled Event',
            date,
            start,
            end: `${String(endHour).padStart(2, '0')}:00`,
            category: 'Other'
        }]);
        setNlpInput('');
    };

    const upcoming = store.events
        .filter(e => {
            const d = new Date(e.date);
            const now = new Date(); now.setHours(0, 0, 0, 0);
            const end = new Date(now); end.setDate(now.getDate() + 7);
            return d >= now && d <= end;
        })
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const dayDetail = selectedDay !== null ? getEventsForDay(selectedDay) : [];

    return (
        <div className="flex flex-col lg:flex-row gap-8">
            {/* Calendar Grid */}
            <div className="flex-1">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="serif text-2xl lowercase tracking-tight">
                        {new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(currentDate)}
                    </h2>
                    <div className="flex items-center gap-2">
                        <button className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors" onClick={() => setCurrentDate(new Date(year, month - 1, 1))}>
                            <ChevronLeft size={20} />
                        </button>
                        <button className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors" onClick={() => setCurrentDate(new Date(year, month + 1, 1))}>
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>

                {/* Day Headers */}
                <div className="grid grid-cols-7 mb-1">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                        <div key={i} className="text-center py-2 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">{d}</div>
                    ))}
                </div>

                {/* Day Cells */}
                <div className="grid grid-cols-7 border border-[var(--border)] rounded-xl overflow-hidden" style={{ background: 'var(--border)' }}>
                    {days.map((day, idx) => {
                        const events = day ? getEventsForDay(day) : [];
                        const today_ = day ? isToday(day) : false;
                        const selected = day === selectedDay;
                        return (
                            <div
                                key={idx}
                                onClick={() => day && setSelectedDay(day)}
                                className={`
                  min-h-[100px] p-2 flex flex-col gap-1 cursor-pointer transition-colors
                  ${day ? 'hover:bg-[var(--bg-tertiary)]' : 'pointer-events-none'}
                  ${selected ? 'bg-[var(--bg-tertiary)]!' : 'bg-[var(--bg-primary)]'}
                `}
                            >
                                {day && (
                                    <>
                                        <span className={`
                      text-sm font-medium leading-none
                      ${today_ ? 'text-[var(--text-primary)] font-bold' : 'text-[var(--text-muted)]'}
                      ${today_ ? 'bg-[var(--text-primary)] text-[var(--bg-primary)]! w-6 h-6 rounded-full flex items-center justify-center text-[10px]!' : ''}
                    `}>
                                            {day}
                                        </span>
                                        {events.slice(0, 2).map(e => (
                                            <div key={e.id} className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-tertiary)] text-[var(--text-secondary)] truncate border-l-2 border-[var(--text-primary)] opacity-80">
                                                {e.title}
                                            </div>
                                        ))}
                                        {events.length > 2 && (
                                            <span className="text-[10px] text-[var(--text-muted)] opacity-60">+{events.length - 2} more</span>
                                        )}
                                    </>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Right Panel */}
            <div className="w-full lg:w-72 flex flex-col gap-6">
                {/* NLP Quick Add */}
                <div className="card">
                    <div className="flex items-center gap-2 mb-4">
                        <Sparkles size={14} strokeWidth={2.5} className="text-[var(--text-primary)]" />
                        <span className="section-label" style={{ marginBottom: 0 }}>Natural Capture</span>
                    </div>
                    <input
                        placeholder="e.g. coffee tomorrow 10am"
                        value={nlpInput}
                        onChange={(e) => setNlpInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && parseNLP()}
                        className="serif italic text-lg! p-0 border-none focus:ring-0"
                    />
                    <p className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] mt-2 font-bold font-sans">Press Enter to Commit</p>
                </div>

                {/* Selected Day Detail */}
                {selectedDay !== null && (
                    <div className="card">
                        <div className="flex items-center justify-between mb-4">
                            <span className="section-label" style={{ marginBottom: 0 }}>
                                {new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(year, month, selectedDay))}
                            </span>
                            <button className="btn-pill text-xs! py-1! px-3!" onClick={() => { setEditingEvent(null); setEventForm({ title: '', start: '09:00', end: '10:00' }); setIsAdding(true); }}>
                                <Plus size={12} /> Add
                            </button>
                        </div>
                        {dayDetail.length > 0 ? (
                            <div className="flex flex-col gap-2">
                                {dayDetail.map(e => (
                                    <div key={e.id} className="flex items-start justify-between gap-3 py-3 border-b border-[var(--border)] last:border-none group">
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-sm">{e.title}</span>
                                            <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-bold mt-0.5">{e.start} — {e.end}</span>
                                        </div>
                                        <div className="flex items-center gap-3 opacity-30 group-hover:opacity-100 transition-all duration-300">
                                            <button onClick={() => openEdit(e)} className="hover:text-white transform hover:scale-110 transition-transform">
                                                <Pencil size={12} strokeWidth={2} />
                                            </button>
                                            <button onClick={() => deleteEvent(e.id)} className="hover:text-white transform hover:scale-110 transition-transform">
                                                <Trash2 size={14} strokeWidth={2} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="serif italic text-[var(--text-muted)] text-sm py-4">The chronicle is silent.</p>
                        )}
                    </div>
                )}

                {/* Upcoming */}
                <div>
                    <span className="section-label">Horizon — 7 Days</span>
                    <div className="flex flex-col gap-4 mt-4">
                        {upcoming.length > 0 ? upcoming.map(e => (
                            <div key={e.id} className="group flex items-center justify-between pb-4 border-b border-[var(--border)] last:border-none">
                                <div className="flex flex-col gap-1">
                                    <span className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-[0.2em]">{e.date}</span>
                                    <span className="font-medium text-sm">{e.title}</span>
                                    <span className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider">{e.start} — {e.end}</span>
                                </div>
                                <div className="flex items-center gap-3 opacity-30 group-hover:opacity-100 transition-all duration-300">
                                    <button onClick={() => openEdit(e)} className="hover:text-white transform hover:scale-110 transition-transform">
                                        <Pencil size={11} strokeWidth={2} />
                                    </button>
                                    <button onClick={() => deleteEvent(e.id)} className="hover:text-white transform hover:scale-110 transition-transform">
                                        <Trash2 size={13} strokeWidth={2} />
                                    </button>
                                </div>
                            </div>
                        )) : (
                            <p className="serif italic text-[var(--text-muted)] text-sm opacity-60 px-2">Clear horizon.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal */}
            {isAdding && (
                <div className="modal-overlay">
                    <div className="modal-card">
                        <h3>{editingEvent ? 'Refine Record' : 'Commit to Chronicle'}</h3>
                        <div className="flex flex-col gap-6">
                            <div className="flex flex-col gap-1">
                                <span className="section-label">Label</span>
                                <input placeholder="Event label" value={eventForm.title} onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })} autoFocus className="serif text-lg!" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1">
                                    <span className="section-label">Commencement</span>
                                    <input type="time" value={eventForm.start} onChange={(e) => setEventForm({ ...eventForm, start: e.target.value })} />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="section-label">Conclusion</span>
                                    <input type="time" value={eventForm.end} onChange={(e) => setEventForm({ ...eventForm, end: e.target.value })} />
                                </div>
                            </div>
                            <div className="flex justify-end gap-4 mt-4">
                                <button className="btn-ghost" onClick={closeModal}>Cancel</button>
                                <button className="btn-pill" onClick={handleSaveEvent}>
                                    {editingEvent ? 'Archive Changes' : 'Commit Record'}
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
