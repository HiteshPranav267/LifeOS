import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import type { Store, Task, Event, Habit, BrainDump, WeeklyFocus, Transaction, Birthday } from '../types';
import { supabase, SYNC_TABLE } from '../lib/supabase';
import type { Session } from '@supabase/supabase-js';

const DEFAULT_STORE: Store = {
    tasks: [],
    events: [],
    habits: [],
    brainDumps: [],
    weeklyFocus: [],
    transactions: [],
    birthdays: [],
    settings: {
        theme: 'dark',
    },
    nutrition: {
        metrics: { height: 0, weight: 0, age: 0, activityLevel: 'sedentary', lastUpdated: new Date().toISOString() },
        weightHistory: [],
        foodLogs: {},
        waterLogs: {},
        waterGoal: 2500,
        streak: 0
    },
    fitness: {
        sessions: [],
        templates: [],
        prs: [],
        cardioLogs: [],
        streak: 0
    }
};

const getStorageKey = (userId?: string) => userId ? `lifeos_data_${userId}` : 'lifeos_data_guest';

const getLocalStore = (userId?: string): Store => {
    try {
        const data = localStorage.getItem(getStorageKey(userId));
        if (!data) return { ...DEFAULT_STORE };
        const parsed = JSON.parse(data);
        if (!parsed.transactions) parsed.transactions = [];
        if (!parsed.birthdays) parsed.birthdays = [];
        if (!parsed.weeklyFocus) parsed.weeklyFocus = [];
        if (!parsed.brainDumps) parsed.brainDumps = [];
        if (!parsed.habits) parsed.habits = [];
        if (!parsed.events) parsed.events = [];
        if (!parsed.tasks) parsed.tasks = [];
        if (!parsed.nutrition) parsed.nutrition = DEFAULT_STORE.nutrition;
        if (!parsed.fitness) parsed.fitness = DEFAULT_STORE.fitness;
        if (!parsed.settings) parsed.settings = DEFAULT_STORE.settings;
        return parsed;
    } catch {
        return { ...DEFAULT_STORE };
    }
};

const saveLocalStore = (store: Store, userId?: string) => {
    try {
        localStorage.setItem(getStorageKey(userId), JSON.stringify(store));
    } catch (err) {
        console.error('[LifeOS] Local save error', err);
    }
};

// Hydrate missing fields on cloud data
const hydrateStore = (data: any): Store => {
    const store = data as Store;
    if (!store.transactions) store.transactions = [];
    if (!store.birthdays) store.birthdays = [];
    if (!store.weeklyFocus) store.weeklyFocus = [];
    if (!store.brainDumps) store.brainDumps = [];
    if (!store.habits) store.habits = [];
    if (!store.events) store.events = [];
    if (!store.tasks) store.tasks = [];
    if (!store.nutrition) store.nutrition = DEFAULT_STORE.nutrition;
    if (store.nutrition && !store.nutrition.waterGoal) store.nutrition.waterGoal = DEFAULT_STORE.nutrition.waterGoal;
    if (!store.fitness) store.fitness = DEFAULT_STORE.fitness;
    if (store.fitness && !store.fitness.templates) store.fitness.templates = [];
    if (!store.settings) store.settings = { theme: 'dark' };
    return store;
};

interface StoreContextType {
    store: Store;
    session: Session | null;
    isSaving: boolean;
    isCloudSynced: boolean;
    isReady: boolean;
    setTasks: (tasks: Task[]) => void;
    setEvents: (events: Event[]) => void;
    setHabits: (habits: Habit[]) => void;
    setBrainDumps: (brainDumps: BrainDump[]) => void;
    setWeeklyFocus: (weeklyFocus: WeeklyFocus[]) => void;
    setTransactions: (transactions: Transaction[]) => void;
    setBirthdays: (birthdays: Birthday[]) => void;
    setNutrition: (nutrition: Store['nutrition']) => void;
    setFitness: (fitness: Store['fitness']) => void;
    setSettings: (settings: Store['settings']) => void;
    setTheme: (theme: 'light' | 'dark') => void;
    forceCloudPull: () => Promise<void>;
    signOut: () => Promise<void>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [store, setStore] = useState<Store>({ ...DEFAULT_STORE });
    const [session, setSession] = useState<Session | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isCloudSynced, setIsCloudSynced] = useState(false);
    const [isReady, setIsReady] = useState(false);
    const hasBooted = useRef(false);
    const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const currentUserId = useRef<string | undefined>(undefined);

    // Helper: Load data from cloud for a user
    const loadCloudData = useCallback(async (userId: string): Promise<Store | null> => {
        try {
            const { data, error } = await supabase
                .from(SYNC_TABLE)
                .select('data')
                .eq('id', userId)
                .single();

            if (data && data.data) {
                return hydrateStore(data.data);
            }

            // No row found — new user
            if (!error || error.code === 'PGRST116') {
                return null; // Signals "new user"
            }

            return null;
        } catch (e) {
            console.error('[LifeOS] Cloud load error:', e);
            return null;
        }
    }, []);

    // Helper: Save data to cloud
    const saveToCloud = useCallback(async (userId: string, data: Store) => {
        try {
            const { error } = await supabase.from(SYNC_TABLE).upsert({
                id: userId,
                data: data,
                updated_at: new Date().toISOString()
            });
            if (error) {
                console.error('[LifeOS] Cloud save error:', error);
                return false;
            }
            return true;
        } catch (e) {
            console.warn('[LifeOS] Cloud save failed:', e);
            return false;
        }
    }, []);

    // 1. Auth — runs ONCE on mount, never triggers data reload
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session: s } }) => {
            setSession(s);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
            setSession(s);
        });

        return () => subscription.unsubscribe();
    }, []);

    // 2. Theme sync
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', store.settings.theme);
    }, [store.settings.theme]);

    const lastLoadedUser = useRef<string | undefined>(undefined);

    // 3. Boot & Sync 
    useEffect(() => {
        const boot = async () => {
            const userId = session?.user?.id;

            // Only run if the user has actually changed since the last run
            if (userId === lastLoadedUser.current && isReady) return;

            lastLoadedUser.current = userId;
            currentUserId.current = userId;

            try {
                if (userId) {
                    const cloudData = await loadCloudData(userId);
                    if (cloudData) {
                        setStore(cloudData);
                        saveLocalStore(cloudData, userId);
                    } else {
                        const localData = getLocalStore(userId);
                        setStore(localData);
                        await saveToCloud(userId, localData);
                    }
                } else {
                    setStore(getLocalStore());
                }
            } catch (e) {
                console.error('[LifeOS] Boot error:', e);
            } finally {
                setIsReady(true);
            }
        };

        boot();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [session]); // ONLY re-run when the actual session changes

    // 4. Persistence Engine — only reacts to STORE changes, never session changes
    useEffect(() => {
        if (!isReady) return;

        const userId = currentUserId.current;

        // Save locally immediately
        saveLocalStore(store, userId);

        // Debounced cloud save
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

        setIsSaving(true);
        saveTimerRef.current = setTimeout(async () => {
            if (userId) {
                const success = await saveToCloud(userId, store);
                if (success) setIsCloudSynced(true);
            }
            setIsSaving(false);
        }, 500);
    }, [store, isReady, saveToCloud]);

    const forceCloudPull = async () => {
        const userId = session?.user?.id;
        if (!userId) return;
        const cloudData = await loadCloudData(userId);
        if (cloudData) {
            setStore(cloudData);
            saveLocalStore(cloudData, userId);
            setIsCloudSynced(true);
        }
    };

    const signOut = async () => {
        await supabase.auth.signOut();
        hasBooted.current = false; // Allow re-boot on next login
        currentUserId.current = undefined;
        window.location.replace('/');
    };

    const setTasks = (tasks: Task[]) => setStore(prev => ({ ...prev, tasks }));
    const setEvents = (events: Event[]) => setStore(prev => ({ ...prev, events }));
    const setHabits = (habits: Habit[]) => setStore(prev => ({ ...prev, habits }));
    const setBrainDumps = (brainDumps: BrainDump[]) => setStore(prev => ({ ...prev, brainDumps }));
    const setWeeklyFocus = (weeklyFocus: WeeklyFocus[]) => setStore(prev => ({ ...prev, weeklyFocus }));
    const setTransactions = (transactions: Transaction[]) => setStore(prev => ({ ...prev, transactions }));
    const setBirthdays = (birthdays: Birthday[]) => setStore(prev => ({ ...prev, birthdays }));
    const setNutrition = (nutrition: Store['nutrition']) => setStore(prev => ({ ...prev, nutrition }));
    const setFitness = (fitness: Store['fitness']) => setStore(prev => ({ ...prev, fitness }));
    const setSettings = (settings: Store['settings']) => setStore(prev => ({ ...prev, settings }));
    const setTheme = (theme: 'light' | 'dark') => setStore(prev => ({ ...prev, settings: { ...prev.settings, theme } }));

    return (
        <StoreContext.Provider value={{
            store, session, isSaving, isCloudSynced, isReady, setTasks, setEvents, setHabits, setBrainDumps, setWeeklyFocus, setTransactions, setBirthdays, setNutrition, setFitness, setSettings, setTheme, forceCloudPull, signOut
        }}>
            {children}
        </StoreContext.Provider>
    );
};

export const useStore = () => {
    const context = useContext(StoreContext);
    if (!context) throw new Error('useStore must be used within a StoreProvider');
    return context;
};
