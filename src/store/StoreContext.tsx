import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
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
};

// Per-user localStorage key
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
    const isInitialMount = useRef(true);
    const currentUserId = useRef<string | undefined>(undefined);

    // 1. Auth & Session Management
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    // 2. Theme Synchronization
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', store.settings.theme);
    }, [store.settings.theme]);

    // 3. Boot Logic — pull from cloud on login, fallback to local
    useEffect(() => {
        const boot = async () => {
            setIsReady(false);
            isInitialMount.current = true;

            const { data: { session: currentSession } } = await supabase.auth.getSession();
            const userId = currentSession?.user?.id;
            currentUserId.current = userId;

            let initialData: Store = getLocalStore(userId);

            if (currentSession && userId) {
                try {
                    const { data, error } = await supabase
                        .from(SYNC_TABLE)
                        .select('data')
                        .eq('id', userId)
                        .single();

                    if (data && data.data) {
                        initialData = data.data as Store;
                        // Defensive hydration
                        if (!initialData.transactions) initialData.transactions = [];
                        if (!initialData.birthdays) initialData.birthdays = [];
                        if (!initialData.weeklyFocus) initialData.weeklyFocus = [];
                        if (!initialData.brainDumps) initialData.brainDumps = [];
                        if (!initialData.habits) initialData.habits = [];
                        if (!initialData.events) initialData.events = [];
                        if (!initialData.tasks) initialData.tasks = [];
                        setIsCloudSynced(true);
                    } else if (!error || error.code === 'PGRST116') {
                        // New user — push local/default to cloud
                        await supabase.from(SYNC_TABLE).upsert({
                            id: userId,
                            data: initialData,
                            updated_at: new Date().toISOString()
                        });
                        setIsCloudSynced(true);
                    }
                } catch (e) {
                    console.error('[LifeOS] Cloud pull error:', e);
                    // Keep local data as fallback
                }
            }

            if (!initialData.settings) initialData.settings = { theme: 'dark' };

            setStore(initialData);
            saveLocalStore(initialData, userId);
            setIsReady(true);
        };

        boot();
    }, [session?.user?.id]);

    // 4. Persistence Engine — save locally immediately, push to cloud with debounce
    useEffect(() => {
        if (!isReady) return;

        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }

        const userId = currentUserId.current;

        // Save to localStorage immediately
        saveLocalStore(store, userId);

        // Debounced cloud sync
        setIsSaving(true);
        const timer = setTimeout(async () => {
            if (session && userId) {
                try {
                    const { error } = await supabase.from(SYNC_TABLE).upsert({
                        id: userId,
                        data: store,
                        updated_at: new Date().toISOString()
                    });
                    if (!error) {
                        setIsCloudSynced(true);
                    } else {
                        console.error('[LifeOS] Cloud save error:', error);
                    }
                } catch (e) {
                    console.warn('[LifeOS] Cloud sync failed:', e);
                }
            }
            setIsSaving(false);
        }, 500);

        return () => clearTimeout(timer);
    }, [store, isReady, session]);

    const forceCloudPull = async () => {
        if (!session) return;
        const { data } = await supabase
            .from(SYNC_TABLE)
            .select('data')
            .eq('id', session.user.id)
            .single();
        if (data && data.data) {
            setStore(data.data as Store);
            saveLocalStore(data.data as Store, session.user.id);
            setIsCloudSynced(true);
        }
    };

    const signOut = async () => {
        await supabase.auth.signOut();
        // Hard redirect immediately — don't touch React state,
        // the full page reload will reset everything cleanly.
        window.location.replace('/');
    };

    const setTasks = (tasks: Task[]) => setStore(prev => ({ ...prev, tasks }));
    const setEvents = (events: Event[]) => setStore(prev => ({ ...prev, events }));
    const setHabits = (habits: Habit[]) => setStore(prev => ({ ...prev, habits }));
    const setBrainDumps = (brainDumps: BrainDump[]) => setStore(prev => ({ ...prev, brainDumps }));
    const setWeeklyFocus = (weeklyFocus: WeeklyFocus[]) => setStore(prev => ({ ...prev, weeklyFocus }));
    const setTransactions = (transactions: Transaction[]) => setStore(prev => ({ ...prev, transactions }));
    const setBirthdays = (birthdays: Birthday[]) => setStore(prev => ({ ...prev, birthdays }));
    const setTheme = (theme: 'light' | 'dark') => setStore(prev => ({ ...prev, settings: { ...prev.settings, theme } }));

    return (
        <StoreContext.Provider value={{
            store, session, isSaving, isCloudSynced, isReady, setTasks, setEvents, setHabits, setBrainDumps, setWeeklyFocus, setTransactions, setBirthdays, setTheme, forceCloudPull, signOut
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
