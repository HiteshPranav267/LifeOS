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
        // Data Migration
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
        console.error('[LifeOS] Save Error', err);
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
    const lastCloudSyncStr = useRef<string>('');

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

    // 3. Boot Logic — runs when session changes
    useEffect(() => {
        const boot = async () => {
            setIsReady(false);
            isInitialMount.current = true;

            const { data: { session: currentSession } } = await supabase.auth.getSession();
            const userId = currentSession?.user?.id;
            currentUserId.current = userId;

            let initialData: Store = { ...DEFAULT_STORE };

            if (currentSession && userId) {
                // Try cloud first for logged-in users
                try {
                    const { data, error } = await supabase
                        .from(SYNC_TABLE)
                        .select('data')
                        .eq('id', userId)
                        .single();

                    if (data && data.data) {
                        initialData = data.data as Store;
                        // Defensive hydration for newly added fields on older cloud saves
                        if (!initialData.transactions) initialData.transactions = [];
                        if (!initialData.birthdays) initialData.birthdays = [];
                        if (!initialData.weeklyFocus) initialData.weeklyFocus = [];
                        if (!initialData.brainDumps) initialData.brainDumps = [];
                        if (!initialData.habits) initialData.habits = [];
                        if (!initialData.events) initialData.events = [];
                        if (!initialData.tasks) initialData.tasks = [];

                        setIsCloudSynced(true);
                        console.log('[LifeOS] Cloud data loaded for user:', userId);
                    } else if (!error || error.code === 'PGRST116') {
                        // No row yet — new user. Use defaults and push to cloud.
                        console.log('[LifeOS] New user. Creating cloud baseline...');
                        await supabase.from(SYNC_TABLE).upsert({
                            id: userId,
                            data: initialData,
                            updated_at: new Date().toISOString()
                        });
                        setIsCloudSynced(true);
                    }
                } catch (e) {
                    console.error('[LifeOS] Cloud pull error:', e);
                    // Fallback to local
                    initialData = getLocalStore(userId);
                }
            }

            // Ensure settings exist
            if (!initialData.settings) initialData.settings = { theme: 'dark' };

            lastCloudSyncStr.current = JSON.stringify(initialData);
            setStore(initialData);
            saveLocalStore(initialData, userId);
            setIsReady(true);
        };

        boot();
    }, [session?.user?.id]); // Re-run when user changes

    // 4. Persistence Engine (Auto-save on store changes)
    useEffect(() => {
        if (!isReady) return;

        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }

        const currentStoreStr = JSON.stringify(store);
        if (currentStoreStr === lastCloudSyncStr.current) {
            return; // No meaningful change to save
        }

        setIsSaving(true);
        const timer = setTimeout(async () => {
            const userId = currentUserId.current;

            // Save to per-user localStorage
            saveLocalStore(store, userId);

            // Sync to cloud if logged in
            if (session && userId) {
                try {
                    const { error } = await supabase.from(SYNC_TABLE).upsert({
                        id: userId,
                        data: store,
                        updated_at: new Date().toISOString()
                    });
                    if (!error) {
                        setIsCloudSynced(true);
                        lastCloudSyncStr.current = currentStoreStr; // Mark as saved so we don't re-upload
                    }
                } catch (e) {
                    console.warn('[LifeOS] Cloud sync delay');
                }
            }
            setIsSaving(false);
        }, 800);

        return () => clearTimeout(timer);
    }, [store, isReady, session]);

    // 5. Realtime External Sync Subscription
    useEffect(() => {
        if (!session?.user?.id || !isReady) return;

        const userId = session.user.id;

        const subscription = supabase
            .channel('lifeos_realtime')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: SYNC_TABLE,
                    filter: `id=eq.${userId}`
                },
                (payload) => {
                    if (payload.new && (payload.new as any).data) {
                        const newData = (payload.new as any).data as Store;
                        // Defensive hydration
                        if (!newData.transactions) newData.transactions = [];
                        if (!newData.birthdays) newData.birthdays = [];
                        if (!newData.weeklyFocus) newData.weeklyFocus = [];
                        if (!newData.brainDumps) newData.brainDumps = [];
                        if (!newData.habits) newData.habits = [];
                        if (!newData.events) newData.events = [];
                        if (!newData.tasks) newData.tasks = [];
                        if (!newData.settings) newData.settings = { theme: 'dark' };

                        const newStr = JSON.stringify(newData);
                        // Only merge if it's strictly different from what we already sent to the cloud!
                        // This prevents endless reflections (Save -> Receive -> Save -> Receive)
                        if (newStr !== lastCloudSyncStr.current) {
                            console.log('[LifeOS] Silent background sync from another device!');
                            lastCloudSyncStr.current = newStr; // lock reflection
                            setStore(newData);
                            saveLocalStore(newData, userId);
                        }
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, [session?.user?.id, isReady]);

    const forceCloudPull = async () => {
        if (!session) return;
        const { data } = await supabase
            .from(SYNC_TABLE)
            .select('data')
            .eq('id', session.user.id)
            .single();
        if (data && data.data) {
            setStore(data.data as Store);
            setIsCloudSynced(true);
        }
    };

    const signOut = async () => {
        await supabase.auth.signOut();
        currentUserId.current = undefined;
        setStore({ ...DEFAULT_STORE });
        window.location.href = '/';
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
