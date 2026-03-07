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
        return hydrateStore(parsed);
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

const hydrateStore = (data: any): Store => {
    const store = { ...DEFAULT_STORE, ...data };
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
    rescueData: (jsonString: string) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [store, setStore] = useState<Store>({ ...DEFAULT_STORE });
    const [session, setSession] = useState<Session | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isCloudSynced, setIsCloudSynced] = useState(false);
    const [isReady, setIsReady] = useState(false);

    // Low-level refs for sync safety
    const currentUserId = useRef<string | undefined>(undefined);
    const hasSyncedWithCloud = useRef<string | null>(null);
    const lastPulledDataHash = useRef<string | null>(null);
    const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Helper: Load data from cloud
    type CloudResult = { status: 'found'; data: Store } | { status: 'new_user' } | { status: 'error'; error: any };

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
            if (error && error.code === 'PGRST116') return { status: 'new_user' };
            if (error) return { status: 'error', error };
            return { status: 'new_user' };
        } catch (e) {
            return { status: 'error', error: e };
        }
    }, []);

    const saveToCloud = useCallback(async (userId: string, data: Store) => {
        try {
            const { error } = await supabase.from(SYNC_TABLE).upsert({
                id: userId,
                data: data,
                updated_at: new Date().toISOString()
            });
            return !error;
        } catch (e) {
            return false;
        }
    }, []);

    // 1. Unified Session & Data Fetching Effect
    useEffect(() => {
        let isActive = true;

        const handleAuthSession = async (s: Session | null, trigger: string) => {
            if (!isActive) return;

            const userId = s?.user?.id;

            // Set session early for UI responsiveness
            setSession(s);

            // Handle Logout
            if (!userId) {
                if (currentUserId.current !== undefined) {
                    console.log(`[LifeOS] ${trigger}: Logout detected.`);
                    currentUserId.current = undefined;
                    hasSyncedWithCloud.current = 'guest';
                    lastPulledDataHash.current = null;
                    setStore(getLocalStore());
                }
                setIsReady(true);
                return;
            }

            // If user is already set and synced, just update session and stop
            if (userId === currentUserId.current && hasSyncedWithCloud.current === userId) {
                return;
            }

            // New user session — show loader while we pull
            setIsReady(false);
            console.log(`[LifeOS] ${trigger}: User ${userId} detected. Fetching cloud data...`);
            currentUserId.current = userId;

            try {
                const result = await loadCloudData(userId);
                if (!isActive) return;

                if (result.status === 'found') {
                    console.log('[LifeOS] Cloud data pulled successfully.');
                    lastPulledDataHash.current = JSON.stringify(result.data);
                    setStore(result.data);
                    saveLocalStore(result.data, userId);
                    hasSyncedWithCloud.current = userId; // UNLOCK CLOUD SAVE
                } else if (result.status === 'new_user') {
                    console.log('[LifeOS] New cloud user. Using local data.');
                    const localData = getLocalStore(userId);
                    lastPulledDataHash.current = JSON.stringify(localData);
                    setStore(localData);
                    hasSyncedWithCloud.current = userId; // UNLOCK CLOUD SAVE
                } else {
                    console.warn('[LifeOS] Cloud pull failed. Local-only mode.');
                    const localData = getLocalStore(userId);
                    setStore(localData);
                    // hasSyncedWithCloud stays null, cloud save stays LOCKED
                }
            } catch (e) {
                console.error('[LifeOS] Session handle error:', e);
            } finally {
                if (isActive) setIsReady(true);
            }
        };

        // Safety timeout for hangs
        const timeout = setTimeout(() => {
            if (!isReady && isActive) {
                console.warn('[LifeOS] Safety timeout hit, forcing ready.');
                setIsReady(true);
            }
        }, 6000);

        // Actual auth listeners
        supabase.auth.getSession().then(({ data: { session: s } }) => {
            handleAuthSession(s, 'INITIAL_BOOT');
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
            handleAuthSession(s, event);
        });

        return () => {
            isActive = false;
            clearTimeout(timeout);
            subscription.unsubscribe();
        };
    }, [loadCloudData]);

    // 2. Persistence Engine (Save)
    useEffect(() => {
        if (!isReady) return;

        const userId = currentUserId.current;
        const currentDataHash = JSON.stringify(store);

        // Always update local cache
        saveLocalStore(store, userId);

        // Check if we should push to cloud
        const syncId = userId || 'guest';
        if (hasSyncedWithCloud.current !== syncId || !userId) return;

        // CRITICAL: If the current store exactly matches what we last pulled, DON'T save.
        // This prevents the "newly logged-in device overwrites cloud with identical data" issue.
        if (currentDataHash === lastPulledDataHash.current) {
            return;
        }

        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        setIsSaving(true);
        saveTimerRef.current = setTimeout(async () => {
            if (currentUserId.current === userId) {
                const success = await saveToCloud(userId, store);
                if (success) {
                    setIsCloudSynced(true);
                    lastPulledDataHash.current = JSON.stringify(store);
                }
            }
            setIsSaving(false);
        }, 1000); // 1s debounce to be extra stable

        return () => {
            if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        };
    }, [store, isReady, saveToCloud]);

    // 3. Real-time Multi-Device Sync
    useEffect(() => {
        const userId = session?.user?.id;
        if (!userId) return;

        const channel = supabase
            .channel(`realtime:${userId}`)
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: SYNC_TABLE,
                filter: `id=eq.${userId}`
            }, (payload) => {
                const remoteStore = payload.new.data as Store;
                if (remoteStore && JSON.stringify(remoteStore) !== JSON.stringify(store)) {
                    console.log('[LifeOS] Real-time merge inward.');
                    lastPulledDataHash.current = JSON.stringify(remoteStore);
                    setStore(remoteStore);
                    saveLocalStore(remoteStore, userId);
                }
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [session?.user?.id, store]);

    // State updaters
    const setTasks = (tasks: Task[]) => setStore(p => ({ ...p, tasks }));
    const setEvents = (events: Event[]) => setStore(p => ({ ...p, events }));
    const setHabits = (habits: Habit[]) => setStore(p => ({ ...p, habits }));
    const setBrainDumps = (brainDumps: BrainDump[]) => setStore(p => ({ ...p, brainDumps }));
    const setWeeklyFocus = (weeklyFocus: WeeklyFocus[]) => setStore(p => ({ ...p, weeklyFocus }));
    const setTransactions = (transactions: Transaction[]) => setStore(p => ({ ...p, transactions }));
    const setBirthdays = (birthdays: Birthday[]) => setStore(p => ({ ...p, birthdays }));
    const setNutrition = (nutrition: Store['nutrition']) => setStore(p => ({ ...p, nutrition }));
    const setFitness = (fitness: Store['fitness']) => setStore(p => ({ ...p, fitness }));
    const setSettings = (settings: Store['settings']) => setStore(p => ({ ...p, settings }));
    const setTheme = (theme: 'light' | 'dark') => setStore(p => ({ ...p, settings: { ...p.settings, theme } }));

    const forceCloudPull = async () => {
        if (!currentUserId.current) return;
        const res = await loadCloudData(currentUserId.current);
        if (res.status === 'found') {
            setStore(res.data);
            lastPulledDataHash.current = JSON.stringify(res.data);
            saveLocalStore(res.data, currentUserId.current);
            setIsCloudSynced(true);
        }
    };

    const signOut = async () => {
        console.log('[LifeOS] Beginning robust signout...');
        setIsReady(false);
        await supabase.auth.signOut();
        // The combined Auth effect above will handle the store reset cleaner than a manual clear
        // but we force a reload to be 100% sure the memory is wiped
        window.location.href = '/';
    };

    const rescueData = (jsonString: string) => {
        try {
            const data = JSON.parse(jsonString);
            const hydrated = hydrateStore(data);
            setStore(hydrated);
            alert("Data injected! Navigate around to confirm, then refresh to see it save.");
        } catch (e) {
            alert("Invalid JSON data.");
        }
    };

    return (
        <StoreContext.Provider value={{
            store, session, isSaving, isCloudSynced, isReady, setTasks, setEvents, setHabits, setBrainDumps, setWeeklyFocus, setTransactions, setBirthdays, setNutrition, setFitness, setSettings, setTheme, forceCloudPull, signOut, rescueData
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
