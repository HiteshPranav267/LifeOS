import { useState, useMemo, useEffect, useRef } from 'react';
import { useStore } from '../store/StoreContext.tsx';
import {
    Dumbbell,
    Search,
    Plus,
    Trash2,
    Check,
    Timer,
    Trophy,
    Calendar,
    ChevronRight,
    Heart,
    Flame,
    Layout,
    ArrowRight
} from 'lucide-react';
import type { LoggedExercise, WorkoutSession, CardioEntry, Exercise, WorkoutSet } from '../types';

const EXERCISEDB_BASE = 'https://exercisedb.dev/api/v1';

const FitnessPage = () => {
    const { store, setFitness } = useStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<Exercise[]>([]);
    const [isAddingCardio, setIsAddingCardio] = useState(false);
    const [isSavingTemplate, setIsSavingTemplate] = useState(false);
    const [templateName, setTemplateName] = useState('');
    const [restTime, setRestTime] = useState<number | null>(null);
    const [cardioForm, setCardioForm] = useState({ type: 'run', duration: 0, distance: 0 });
    const timerRef = useRef<any>(null);

    const fitness = store.fitness;
    const today = new Date().toISOString().split('T')[0];
    const todaySession = fitness.sessions.find(s => s.date === today && !s.isTemplate);
    const cardioLogs = fitness.cardioLogs.filter(c => c.date === today);

    // Rest Timer Logic
    useEffect(() => {
        if (restTime !== null && restTime > 0) {
            timerRef.current = setTimeout(() => setRestTime(restTime - 1), 1000);
        } else if (restTime === 0) {
            setRestTime(null);
            // Optional: Play sound or notification
        }
        return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }, [restTime]);

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;

        // Check cache
        const cache = JSON.parse(localStorage.getItem('lifeos_exercise_cache') || '{}');
        if (cache[searchQuery.toLowerCase()]) {
            setSearchResults(cache[searchQuery.toLowerCase()]);
            return;
        }

        setIsSearching(true);
        try {
            const res = await fetch(`${EXERCISEDB_BASE}/exercises/search?q=${encodeURIComponent(searchQuery)}&limit=20`);
            const json = await res.json();
            if (json.success && Array.isArray(json.data)) {
                const mapped: Exercise[] = json.data.map((ex: any) => ({
                    id: ex.exerciseId,
                    name: ex.name,
                    target: ex.targetMuscles[0] || 'Unknown',
                    bodyPart: ex.bodyParts[0] || 'Full Body',
                    equipment: ex.equipments[0] || 'No Equipment',
                    gifUrl: ex.gifUrl
                }));
                setSearchResults(mapped);
                // Update cache
                cache[searchQuery.toLowerCase()] = mapped;
                localStorage.setItem('lifeos_exercise_cache', JSON.stringify(cache));
            }
        } catch (err) {
            console.error('Exercise search failed', err);
        } finally {
            setIsSearching(false);
        }
    };

    const addExercise = (ex: Exercise) => {
        const newLoggedEx: LoggedExercise = {
            ...ex,
            instanceId: crypto.randomUUID(),
            sets: [{ id: crypto.randomUUID(), reps: 0, weight: 0, completed: false, isPR: false }]
        };

        if (todaySession) {
            const newSessions = fitness.sessions.map(s =>
                s.id === todaySession.id ? { ...s, exercises: [...s.exercises, newLoggedEx] } : s
            );
            setFitness({ ...fitness, sessions: newSessions });
        } else {
            const newSession: WorkoutSession = {
                id: crypto.randomUUID(),
                date: today,
                exercises: [newLoggedEx],
                isTemplate: false
            };
            setFitness({ ...fitness, sessions: [...fitness.sessions, newSession] });
        }
        setSearchResults([]);
        setSearchQuery('');
    };

    const updateSet = (exerciseInstanceId: string, setId: string, updates: Partial<WorkoutSet>) => {
        if (!todaySession) return;

        const newSessions = fitness.sessions.map(s => {
            if (s.id !== todaySession.id) return s;
            return {
                ...s,
                exercises: s.exercises.map(ex => {
                    if (ex.instanceId !== exerciseInstanceId) return ex;
                    return {
                        ...ex,
                        sets: ex.sets.map(set => {
                            if (set.id !== setId) return set;
                            const newSet = { ...set, ...updates };

                            // Check for PR if completing a set
                            if (updates.completed) {
                                setRestTime(60); // Start 60s timer
                                const volume = newSet.weight * newSet.reps;
                                const existingPR = fitness.prs.find(p => p.exerciseId === ex.id);
                                if (!existingPR || volume > (existingPR.maxWeight * existingPR.maxReps)) {
                                    newSet.isPR = true;
                                    // PR update logic handled in final state update for simplicity or separate function
                                }
                            }
                            return newSet;
                        })
                    };
                })
            };
        });

        // If a PR was hit, we need to update the PRs array too
        let updatedPRs = [...fitness.prs];
        newSessions.forEach(s => {
            if (s.id === todaySession.id) {
                s.exercises.forEach(ex => {
                    ex.sets.forEach(set => {
                        if (set.isPR && set.completed) {
                            const volume = set.weight * set.reps;
                            const existingIdx = updatedPRs.findIndex(p => p.exerciseId === ex.id);
                            const newPR = {
                                exerciseId: ex.id,
                                exerciseName: ex.name,
                                maxWeight: set.weight,
                                maxReps: set.reps,
                                oneRepMax: Math.round(set.weight * (1 + set.reps / 30)),
                                date: today
                            };
                            if (existingIdx > -1) {
                                if (volume > (updatedPRs[existingIdx].maxWeight * updatedPRs[existingIdx].maxReps)) {
                                    updatedPRs[existingIdx] = newPR;
                                }
                            } else {
                                updatedPRs.push(newPR);
                            }
                        }
                    });
                });
            }
        });

        setFitness({ ...fitness, sessions: newSessions, prs: updatedPRs });
    };

    const addSet = (exerciseInstanceId: string) => {
        if (!todaySession) return;
        const newSessions = fitness.sessions.map(s => {
            if (s.id !== todaySession.id) return s;
            return {
                ...s,
                exercises: s.exercises.map(ex => {
                    if (ex.instanceId !== exerciseInstanceId) return ex;
                    const lastSet = ex.sets[ex.sets.length - 1];
                    return {
                        ...ex,
                        sets: [...ex.sets, {
                            id: crypto.randomUUID(),
                            reps: lastSet?.reps || 0,
                            weight: lastSet?.weight || 0,
                            completed: false,
                            isPR: false
                        }]
                    };
                })
            };
        });
        setFitness({ ...fitness, sessions: newSessions });
    };

    const removeExercise = (instanceId: string) => {
        if (!todaySession) return;
        const newSessions = fitness.sessions.map(s =>
            s.id === todaySession.id ? { ...s, exercises: s.exercises.filter(ex => ex.instanceId !== instanceId) } : s
        );
        setFitness({ ...fitness, sessions: newSessions });
    };

    const saveAsTemplate = () => {
        if (!todaySession || !templateName) return;
        const template: WorkoutSession = {
            ...todaySession,
            id: crypto.randomUUID(),
            isTemplate: true,
            templateName,
            date: ''
        };
        setFitness({ ...fitness, templates: [...(fitness as any).templates || [], template] });
        setIsSavingTemplate(false);
        setTemplateName('');
    };

    const loadTemplate = (template: WorkoutSession) => {
        const newSession: WorkoutSession = {
            ...template,
            id: crypto.randomUUID(),
            date: today,
            isTemplate: false,
            exercises: template.exercises.map(ex => ({
                ...ex,
                instanceId: crypto.randomUUID(),
                sets: ex.sets.map(s => ({ ...s, id: crypto.randomUUID(), completed: false, isPR: false }))
            }))
        };
        setFitness({ ...fitness, sessions: [...fitness.sessions, newSession] });
    };

    const handleSaveCardio = () => {
        const mets = { run: 10, cycle: 8, swim: 7, walk: 3.5 };
        const weight = store.nutrition.metrics.weight || 70;
        const calories = Math.round(mets[cardioForm.type as keyof typeof mets] * weight * (cardioForm.duration / 60));

        const newEntry: CardioEntry = {
            id: crypto.randomUUID(),
            ...cardioForm,
            type: cardioForm.type as any,
            calories,
            date: today
        };

        setFitness({ ...fitness, cardioLogs: [...fitness.cardioLogs, newEntry] });
        setIsAddingCardio(false);
        setCardioForm({ type: 'run', duration: 0, distance: 0 });
    };

    const deleteCardio = (id: string) => {
        setFitness({ ...fitness, cardioLogs: fitness.cardioLogs.filter(c => c.id !== id) });
    };

    // Stats calculations
    const heatmap = useMemo(() => {
        const history = new Array(84).fill(0).map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (83 - i));
            const dateStr = d.toISOString().split('T')[0];
            const session = fitness.sessions.find(s => s.date === dateStr && !s.isTemplate);
            return session ? session.exercises.length : 0;
        });
        return history;
    }, [fitness.sessions]);

    const volumeByMuscle = useMemo(() => {
        const volume: Record<string, number> = {};
        todaySession?.exercises.forEach(ex => {
            const exVol = ex.sets.reduce((acc, s) => acc + (s.weight * s.reps), 0);
            volume[ex.bodyPart] = (volume[ex.bodyPart] || 0) + exVol;
        });
        return volume;
    }, [todaySession]);

    return (
        <div className="flex flex-col gap-10 max-w-2xl mx-auto pb-32">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <span className="text-[11px] uppercase tracking-[0.4em] font-bold text-[var(--text-secondary)]">Strength & Vitality</span>
                    <h1 className="text-3xl font-bold mt-2">Fitness.</h1>
                </div>
                <div className="flex flex-col items-end">
                    <div className="flex items-center gap-2 text-red-500">
                        <Flame size={18} fill="currentColor" />
                        <span className="font-bold text-xl">{fitness.streak}</span>
                    </div>
                    <span className="text-[10px] uppercase font-bold text-[var(--text-secondary)] tracking-widest">Day Streak</span>
                </div>
            </div>

            {/* Quick Stats / Heatmap */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="card p-6 flex flex-col gap-4">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] uppercase font-bold text-[var(--text-secondary)] tracking-widest">Activity History</span>
                        <Calendar size={14} className="text-[var(--text-secondary)]" />
                    </div>
                    <div className="grid grid-cols-14 gap-1.5">
                        {heatmap.map((val, i) => (
                            <div
                                key={i}
                                className={`aspect-square rounded-[2px] ${val > 0 ? 'bg-red-500' : 'bg-[var(--bg-elevated)]'} transition-colors`}
                                style={{ opacity: val > 0 ? Math.min(0.3 + val * 0.2, 1) : 1 }}
                            />
                        ))}
                    </div>
                    <div className="flex justify-between text-[8px] uppercase font-bold text-[var(--text-secondary)] mt-1">
                        <span>12 Weeks Ago</span>
                        <span>Today</span>
                    </div>
                </div>

                <div className="card p-6 flex flex-col gap-4">
                    <span className="text-[10px] uppercase font-bold text-[var(--text-secondary)] tracking-widest mb-1">Today's Volume</span>
                    <div className="flex flex-col gap-3">
                        {Object.entries(volumeByMuscle).length > 0 ? Object.entries(volumeByMuscle).map(([muscle, vol]) => (
                            <div key={muscle} className="flex flex-col gap-1.5">
                                <div className="flex justify-between text-[10px] font-bold uppercase">
                                    <span>{muscle}</span>
                                    <span>{vol}kg</span>
                                </div>
                                <div className="w-full h-1.5 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
                                    <div className="h-full bg-red-500" style={{ width: `${Math.min(vol / 2000 * 100, 100)}%` }} />
                                </div>
                            </div>
                        )) : (
                            <div className="flex flex-col items-center justify-center py-4 opacity-30 italic text-sm">
                                <span>No volume recorded today.</span>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Rest Timer Banner */}
            {restTime !== null && (
                <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-lg">
                    <div className="bg-red-500 text-white rounded-2xl p-4 shadow-2xl flex items-center justify-between animate-in fade-in slide-in-from-bottom-4">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                                <Timer size={20} />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] uppercase font-bold tracking-widest opacity-80">Rest Interval</span>
                                <span className="text-xl font-black tabular-nums">{restTime}s</span>
                            </div>
                        </div>
                        <button onClick={() => setRestTime(null)} className="px-4 py-2 bg-white/20 rounded-xl font-bold text-xs uppercase hover:bg-white/30 transition-all">
                            Skip
                        </button>
                    </div>
                </div>
            )}

            {/* Saved Templates */}
            {fitness.templates.length > 0 && (
                <section className="flex flex-col gap-6">
                    <span className="section-label m-0">Your Blueprints</span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {fitness.templates.map(template => (
                            <div
                                key={template.id}
                                className="card p-5 interactive-card flex items-center justify-between group"
                                onClick={() => loadTemplate(template)}
                            >
                                <div className="flex flex-col">
                                    <span className="font-bold text-sm">{template.templateName}</span>
                                    <span className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-widest">{template.exercises.length} Exercises</span>
                                </div>
                                <ArrowRight size={16} className="text-[var(--text-secondary)] opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Workout Logger */}
            <section className="flex flex-col gap-6">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <span className="section-label m-0">Dynamic Workout</span>
                        {todaySession && (
                            <button onClick={() => setIsSavingTemplate(true)} className="p-2 text-[var(--text-secondary)] hover:text-red-500 transition-colors">
                                <Layout size={18} />
                            </button>
                        )}
                    </div>
                    <div className="flex gap-2">
                        {/* More actions if needed */}
                    </div>
                </div>

                {/* Exercise Search */}
                <div className="flex flex-col gap-4">
                    <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]">
                            <Search size={20} />
                        </div>
                        <input
                            placeholder="Find exercise... (e.g. 'Bench Press')"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            className="pl-14! pr-20! h-14! mb-0!"
                        />
                        <button
                            disabled={!searchQuery.trim() || isSearching}
                            onClick={handleSearch}
                            className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-[var(--text-primary)] text-[var(--bg-primary)] rounded-lg font-bold text-xs active:scale-95 disabled:opacity-20 transition-all"
                        >
                            {isSearching ? '...' : <ChevronRight size={18} />}
                        </button>
                    </div>

                    {searchResults.length > 0 && (
                        <div className="card p-2 flex flex-col max-h-[300px] overflow-y-auto">
                            {searchResults.map(ex => (
                                <button
                                    key={ex.id}
                                    onClick={() => addExercise(ex)}
                                    className="flex items-center gap-4 p-3 hover:bg-[var(--bg-elevated)] rounded-xl transition-all text-left group"
                                >
                                    <div className="w-12 h-12 rounded-lg bg-[var(--bg-elevated)] overflow-hidden">
                                        <img src={ex.gifUrl} alt={ex.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-sm capitalize">{ex.name}</span>
                                        <span className="text-[10px] text-[var(--text-secondary)] uppercase font-bold">{ex.bodyPart} • {ex.equipment}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Workout List */}
                <div className="flex flex-col gap-6">
                    {todaySession && todaySession.exercises.length > 0 ? todaySession.exercises.map((ex) => (
                        <div key={ex.instanceId} className="card p-6 flex flex-col gap-6 group">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-[var(--bg-elevated)] overflow-hidden border border-[var(--border)]">
                                        <img src={ex.gifUrl} alt={ex.name} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex flex-col">
                                        <h4 className="font-bold text-lg capitalize leading-tight">{ex.name}</h4>
                                        <span className="text-[10px] text-red-500 uppercase font-black tracking-[0.2em]">{ex.bodyPart}</span>
                                    </div>
                                </div>
                                <button onClick={() => removeExercise(ex.instanceId)} className="p-2 text-[var(--text-secondary)] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                                    <Trash2 size={18} />
                                </button>
                            </div>

                            <div className="flex flex-col gap-3">
                                <div className="grid grid-cols-4 gap-4 px-2 text-[8px] uppercase font-black text-[var(--text-secondary)] tracking-widest">
                                    <span className="text-center">Set</span>
                                    <span className="text-center">Prev (kg)</span>
                                    <span className="text-center">Kg × Reps</span>
                                    <span className="text-center">Status</span>
                                </div>
                                {ex.sets.map((set, idx) => (
                                    <div key={set.id} className={`grid grid-cols-4 gap-4 items-center transition-opacity ${set.completed ? 'opacity-40 grayscale' : 'opacity-100'}`}>
                                        <div className="flex items-center justify-center font-black text-xs text-[var(--text-secondary)]">
                                            {idx + 1}
                                        </div>
                                        <div className="text-center text-xs font-bold text-[var(--text-secondary)] italic">
                                            —
                                        </div>
                                        <div className="flex items-center gap-1 justify-center">
                                            <input
                                                type="number"
                                                value={set.weight || ''}
                                                onChange={(e) => updateSet(ex.instanceId, set.id, { weight: Number(e.target.value) })}
                                                className="w-12! h-9! text-center! p-0! text-xs! font-bold! rounded-lg! border-none! bg-[var(--bg-elevated)]! mb-0!"
                                                placeholder="0"
                                            />
                                            <span className="text-[10px] font-bold opacity-30">×</span>
                                            <input
                                                type="number"
                                                value={set.reps || ''}
                                                onChange={(e) => updateSet(ex.instanceId, set.id, { reps: Number(e.target.value) })}
                                                className="w-12! h-9! text-center! p-0! text-xs! font-bold! rounded-lg! border-none! bg-[var(--bg-elevated)]! mb-0!"
                                                placeholder="0"
                                            />
                                        </div>
                                        <div className="flex justify-center relative">
                                            <button
                                                onClick={() => updateSet(ex.instanceId, set.id, { completed: !set.completed })}
                                                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${set.completed ? 'bg-red-500 text-white' : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                                            >
                                                {set.completed ? <Check size={18} /> : <div className="w-2 h-2 rounded-full bg-current opacity-20" />}
                                            </button>
                                            {set.isPR && set.completed && (
                                                <div className="absolute -top-1 -right-1 text-yellow-500 animate-bounce">
                                                    <Trophy size={14} fill="currentColor" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                <button
                                    onClick={() => addSet(ex.instanceId)}
                                    className="mt-2 py-3 bg-[var(--bg-elevated)] text-[var(--text-secondary)] rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:text-[var(--text-primary)] transition-all"
                                >
                                    + Add Set
                                </button>
                            </div>
                        </div>
                    )) : (
                        <div className="p-16 border-2 border-dashed border-[var(--border)] rounded-[2.5rem] flex flex-col items-center gap-4 text-center group cursor-pointer hover:border-red-500/50 transition-all">
                            <div className="w-16 h-16 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center text-[var(--text-secondary)] group-hover:scale-110 group-hover:text-red-500 transition-all duration-500">
                                <Dumbbell size={32} />
                            </div>
                            <div className="flex flex-col gap-1">
                                <p className="font-bold text-lg mb-0 text-[var(--text-primary)]">The forge is cold.</p>
                                <p className="text-sm text-[var(--text-secondary)] italic serif lowercase">Start by searching an exercise or load a template.</p>
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* Cardio Section */}
            <section className="flex flex-col gap-6">
                <div className="flex justify-between items-center">
                    <span className="section-label m-0">Cardiovascular Effort</span>
                    <button onClick={() => setIsAddingCardio(true)} className="w-10 h-10 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center text-red-500 hover:scale-110 active:scale-95 transition-all">
                        <Plus size={20} />
                    </button>
                </div>

                <div className="flex flex-col gap-3">
                    {cardioLogs.length > 0 ? cardioLogs.map(log => (
                        <div key={log.id} className="card p-5 flex items-center justify-between group">
                            <div className="flex items-center gap-4">
                                <div className="w-11 h-11 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 capitalize">
                                    <Heart size={20} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-bold text-sm capitalize">{log.type}</span>
                                    <span className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-widest">{log.duration} mins • {log.distance} km</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="flex flex-col items-end">
                                    <span className="text-sm font-black tracking-tight">{log.calories}</span>
                                    <span className="text-[8px] font-bold text-[var(--text-secondary)] uppercase">Calories</span>
                                </div>
                                <button onClick={() => deleteCardio(log.id)} className="p-2 text-[var(--text-secondary)] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    )) : (
                        <div className="p-10 border border-[var(--border)] rounded-3xl text-center opacity-30 italic text-sm">
                            Heart rate is resting.
                        </div>
                    )}
                </div>
            </section>

            {/* Personal Records History */}
            {fitness.prs.length > 0 && (
                <section className="flex flex-col gap-6">
                    <span className="section-label m-0">Hall of Fame</span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {fitness.prs.slice(0, 4).map(pr => (
                            <div key={pr.exerciseId} className="card p-5 flex items-center gap-4 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 text-yellow-500/10 -rotate-12 scale-150 group-hover:scale-175 transition-transform duration-700">
                                    <Trophy size={60} fill="currentColor" />
                                </div>
                                <div className="w-10 h-10 rounded-lg bg-[var(--bg-elevated)] flex items-center justify-center text-yellow-500 border border-yellow-500/20">
                                    <Trophy size={20} fill="currentColor" />
                                </div>
                                <div className="flex flex-col flex-1 min-w-0">
                                    <span className="font-bold text-xs capitalize truncate mb-1">{pr.exerciseName}</span>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-lg font-black">{pr.maxWeight}kg</span>
                                        <span className="text-[10px] font-bold text-[var(--text-secondary)]">× {pr.maxReps}</span>
                                    </div>
                                    <span className="text-[8px] uppercase font-bold text-[var(--text-secondary)] tracking-widest mt-1">1RM Estimate: {pr.oneRepMax}kg</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Save Template Modal */}
            {isSavingTemplate && (
                <div className="modal-overlay">
                    <div className="modal-card">
                        <h3 className="text-2xl font-semibold mb-8 text-center uppercase tracking-tighter italic">Save Blueprint.</h3>
                        <div className="flex flex-col gap-6">
                            <input
                                placeholder="Template Name (e.g. 'Push Day')"
                                value={templateName}
                                onChange={(e) => setTemplateName(e.target.value)}
                                autoFocus
                                className="h-14!"
                            />
                            <div className="flex gap-4 pt-4">
                                <button
                                    className="flex-1 h-12 bg-[var(--text-primary)] text-[var(--bg-primary)] rounded-xl font-bold active:scale-95 transition-transform"
                                    onClick={saveAsTemplate}
                                >
                                    Save Template
                                </button>
                                <button className="h-12 px-6 bg-[var(--bg-elevated)] rounded-xl font-bold active:scale-95 transition-transform" onClick={() => setIsSavingTemplate(false)}>
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Cardio Modal */}
            {isAddingCardio && (
                <div className="modal-overlay">
                    <div className="modal-card">
                        <h3 className="text-2xl font-semibold mb-8 text-center uppercase tracking-tighter italic">Log Cardio.</h3>
                        <div className="flex flex-col gap-6">
                            <select
                                className="px-5! h-14!"
                                value={cardioForm.type}
                                onChange={(e) => setCardioForm({ ...cardioForm, type: e.target.value })}
                            >
                                <option value="run">Running</option>
                                <option value="cycle">Cycling</option>
                                <option value="walk">Walking</option>
                                <option value="swim">Swimming</option>
                            </select>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="relative">
                                    <input
                                        type="number"
                                        placeholder="Duration"
                                        className="pl-5! pr-12! h-14!"
                                        value={cardioForm.duration || ''}
                                        onChange={(e) => setCardioForm({ ...cardioForm, duration: Number(e.target.value) })}
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] uppercase font-bold text-[var(--text-secondary)]">min</span>
                                </div>
                                <div className="relative">
                                    <input
                                        type="number"
                                        placeholder="Distance"
                                        className="pl-5! pr-12! h-14!"
                                        value={cardioForm.distance || ''}
                                        onChange={(e) => setCardioForm({ ...cardioForm, distance: Number(e.target.value) })}
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] uppercase font-bold text-[var(--text-secondary)]">km</span>
                                </div>
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button
                                    className="flex-1 h-12 bg-red-500 text-white rounded-xl font-bold active:scale-95 transition-transform shadow-lg shadow-red-500/20"
                                    onClick={handleSaveCardio}
                                >
                                    Commit Metric
                                </button>
                                <button className="h-12 px-6 bg-[var(--bg-elevated)] rounded-xl font-bold active:scale-95 transition-transform" onClick={() => setIsAddingCardio(false)}>
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

export default FitnessPage;
