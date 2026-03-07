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
    const hasSyncedWithCloud = useRef<string | null>(null); // Tracks if we've pulled for the CURRENT user

    // Helper: Load data from cloud for a user
    // Returns a discriminated result so we can tell apart "no data" from "error"
    type CloudResult =
        | { status: 'found'; data: Store }
        | { status: 'new_user' }
        | { status: 'error'; error: any };

    const loadCloudData = useCallback(async (userId: string): Promise<CloudResult> => {
        try {
            const { data, error } = await supabase
                .from(SYNC_TABLE)
                .select('data')
                .eq('id', userId)
                .single();

            if (data && data.data) {
                return { status: 'found', data: hydrateStore(data.data) };
            }

            // PGRST116 = "no rows returned" = genuinely new user
            if (error && error.code === 'PGRST116') {
                return { status: 'new_user' };
            }

            // Any other error = something went wrong, do NOT treat as new user
            if (error) {
                console.error('[LifeOS] Cloud load error:', error);
                return { status: 'error', error };
            }

            // Data row exists but data field is empty/null
            return { status: 'new_user' };
        } catch (e) {
            console.error('[LifeOS] Cloud load exception:', e);
            return { status: 'error', error: e };
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

    // 1. Auth + Session listener
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session: s } }) => {
            setSession(s);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, s) => {
            setSession(s);

            // When a user signs in (e.g. OAuth redirect), reload their data
            if (event === 'SIGNED_IN' && s?.user?.id && s.user.id !== currentUserId.current) {
                currentUserId.current = s.user.id;
                try {
                    const result = await loadCloudData(s.user.id);
                    if (result.status === 'found') {
                        setStore(result.data);
                        saveLocalStore(result.data, s.user.id);
                        hasSyncedWithCloud.current = s.user.id;
                    } else if (result.status === 'new_user') {
                        const localData = getLocalStore(s.user.id);
                        setStore(localData);
                        hasSyncedWithCloud.current = s.user.id;
                    } else {
                        // Error — load local data but do NOT unlock cloud saving
                        const localData = getLocalStore(s.user.id);
                        setStore(localData);
                        console.warn('[LifeOS] Post-login cloud fetch failed, cloud saving is LOCKED');
                    }
                } catch (e) {
                    console.error('[LifeOS] Post-login load error:', e);
                }
                setIsReady(true);
            }

            // When a user signs out, reset to guest state
            if (event === 'SIGNED_OUT') {
                currentUserId.current = undefined;
                setStore(getLocalStore());
                setIsCloudSynced(false);
                setIsReady(true);
            }
        });

        return () => subscription.unsubscribe();
    }, [loadCloudData, saveToCloud]);

    // 2. Theme sync
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', store.settings.theme);
    }, [store.settings.theme]);

    // 3. Boot — runs ONCE on mount
    useEffect(() => {
        if (hasBooted.current) return;
        hasBooted.current = true;

        const boot = async () => {
            let bootDone = false;
            const safetyTimeout = setTimeout(() => {
                if (!bootDone) {
                    console.warn('[LifeOS] Boot taking too long, forcing ready state');
                    setIsReady(true);
                }
            }, 5000);

            try {
                const { data: { session: currentSession } } = await supabase.auth.getSession();
                const userId = currentSession?.user?.id;
                currentUserId.current = userId;

                if (userId) {
                    const result = await loadCloudData(userId);

                    if (result.status === 'found') {
                        // Cloud data exists — use it
                        setStore(result.data);
                        saveLocalStore(result.data, userId);
                        hasSyncedWithCloud.current = userId; // UNLOCK saving
                    } else if (result.status === 'new_user') {
                        // Genuinely new user — safe to use local data and save to cloud
                        const localData = getLocalStore(userId);
                        setStore(localData);
                        hasSyncedWithCloud.current = userId; // UNLOCK saving
                    } else {
                        // ERROR — load local data but keep cloud saving LOCKED
                        const localData = getLocalStore(userId);
                        setStore(localData);
                        console.warn('[LifeOS] Cloud fetch failed during boot, cloud saving is LOCKED');
                        // hasSyncedWithCloud stays null — saving stays blocked
                    }
                } else {
                    // Guest user - always allowed to save locally
                    setStore(getLocalStore());
                    hasSyncedWithCloud.current = 'guest';
                }
            } catch (e) {
                console.error('[LifeOS] Boot error:', e);
                setStore({ ...DEFAULT_STORE });
            } finally {
                bootDone = true;
                clearTimeout(safetyTimeout);
                setIsReady(true);
            }
        };

        boot();
    }, [loadCloudData, saveToCloud]);

    // 4. Persistence Engine
    useEffect(() => {
        if (!isReady) return;

        const userId = currentUserId.current;

        // CRITICAL: Prevent over-writing cloud data before we've verified what's up there
        const syncId = userId || 'guest';
        if (hasSyncedWithCloud.current !== syncId) {
            console.log('[LifeOS] Save blocked: Cloud pull not verified for this user');
            return;
        }

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
        const result = await loadCloudData(userId);
        if (result.status === 'found') {
            setStore(result.data);
            saveLocalStore(result.data, userId);
            setIsCloudSynced(true);
            hasSyncedWithCloud.current = userId;
        }
    };

    const signOut = async () => {
        try {
            await supabase.auth.signOut();
        } catch (e) {
            console.error('[LifeOS] Signout error:', e);
        }
        currentUserId.current = undefined;
        hasBooted.current = false;
        setStore(getLocalStore());
        // Force a clean redirect to the home page
        window.location.href = '/';
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
