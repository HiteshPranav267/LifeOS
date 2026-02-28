import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import type { Store, Task, Event, Habit, BrainDump, WeeklyFocus, Transaction } from '../types';
import { getStore, saveStore, syncToCloud, loadFromCloud } from './index';

interface StoreContextType {
    store: Store;
    isSaving: boolean;
    isCloudSynced: boolean;
    isReady: boolean;
    setTasks: (tasks: Task[]) => void;
    setEvents: (events: Event[]) => void;
    setHabits: (habits: Habit[]) => void;
    setBrainDumps: (brainDumps: BrainDump[]) => void;
    setWeeklyFocus: (weeklyFocus: WeeklyFocus[]) => void;
    setTransactions: (transactions: Transaction[]) => void;
    setTheme: (theme: 'light' | 'dark') => void;
    setSupabaseConfig: (url: string, key: string) => void;
    forceCloudPull: () => Promise<void>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [store, setStore] = useState<Store>(getStore());
    const [isSaving, setIsSaving] = useState(false);
    const [isCloudSynced, setIsCloudSynced] = useState(false);
    const [isReady, setIsReady] = useState(false);
    const isInitialMount = useRef(true);

    // Theme Synchronization
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', store.settings.theme);
    }, [store.settings.theme]);

    // Initial Load Protocol: Cloud -> Disk -> Local
    useEffect(() => {
        const boot = async () => {
            let initialData = getStore();

            // Magic Setup: Ingest Supabase Config from URL (for easy iPhone setup)
            const params = new URLSearchParams(window.location.search);
            const urlParam = params.get('sb_url');
            const keyParam = params.get('sb_key');
            if (urlParam && keyParam) {
                initialData.settings.supabaseUrl = decodeURIComponent(urlParam);
                initialData.settings.supabaseKey = decodeURIComponent(keyParam);
                saveStore(initialData); // Persist immediately
                console.log('[LifeOS] | Magic Handshake Successful | Configuration Ingested.');
                // Clean up URL
                window.history.replaceState({}, document.title, window.location.pathname);
            }

            // 1. Attempt Cloud Pull if configured
            if (initialData.settings.supabaseUrl && initialData.settings.supabaseKey) {
                const cloudData = await loadFromCloud(initialData.settings.supabaseUrl, initialData.settings.supabaseKey);

                // Safety logic:
                const localHasData = (initialData.tasks?.length || initialData.transactions?.length || initialData.habits?.length);
                const cloudHasData = cloudData && (cloudData.tasks?.length || cloudData.transactions?.length || cloudData.habits?.length);

                if (cloudHasData) {
                    initialData = cloudData;
                    setIsCloudSynced(true);
                    console.log('[LifeOS] | Sync Complete | Global Cloud Data Hydrated.');
                } else if (localHasData) {
                    // Local has data but cloud is empty - Push local to cloud immediately
                    console.log('[LifeOS] | Cloud Empty | Initializing cloud with local baseline...');
                    await syncToCloud(initialData);
                    setIsCloudSynced(true);
                } else if (cloudData) {
                    setIsCloudSynced(true);
                }
            } else {
                // 2. Attempt Local Disk Pull (Vite mock API)
                try {
                    const res = await fetch('/api/load-data');
                    if (res.ok) {
                        const diskData = await res.json();
                        if (diskData && diskData.settings) {
                            initialData = diskData;
                            console.log('[LifeOS] | Booted from Laptop Project Folder.');
                        }
                    }
                } catch (e) { /* silent fail for disk sync */ }
            }

            setStore(initialData);
            setIsReady(true);
        };
        boot();
    }, []);

    // Global Persistence Engine
    useEffect(() => {
        if (!isReady) return;

        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }

        setIsSaving(true);
        const timer = setTimeout(async () => {
            saveStore(store);
            if (store.settings.supabaseUrl && store.settings.supabaseKey) {
                await syncToCloud(store);
                setIsCloudSynced(true);
            }
            setIsSaving(false);
        }, 400); // Tighter debounce for responsive feel

        return () => clearTimeout(timer);
    }, [store, isReady]);

    const forceCloudPull = async () => {
        if (store.settings.supabaseUrl && store.settings.supabaseKey) {
            const data = await loadFromCloud(store.settings.supabaseUrl, store.settings.supabaseKey);
            if (data) {
                setStore(data);
                setIsCloudSynced(true);
            }
        }
    };

    const setTasks = (tasks: Task[]) => setStore(prev => ({ ...prev, tasks }));
    const setEvents = (events: Event[]) => setStore(prev => ({ ...prev, events }));
    const setHabits = (habits: Habit[]) => setStore(prev => ({ ...prev, habits }));
    const setBrainDumps = (brainDumps: BrainDump[]) => setStore(prev => ({ ...prev, brainDumps }));
    const setWeeklyFocus = (weeklyFocus: WeeklyFocus[]) => setStore(prev => ({ ...prev, weeklyFocus }));
    const setTransactions = (transactions: Transaction[]) => setStore(prev => ({ ...prev, transactions }));
    const setTheme = (theme: 'light' | 'dark') => setStore(prev => ({ ...prev, settings: { ...prev.settings, theme } }));
    const setSupabaseConfig = (supabaseUrl: string, supabaseKey: string) => setStore(prev => ({ ...prev, settings: { ...prev.settings, supabaseUrl, supabaseKey } }));

    return (
        <StoreContext.Provider value={{
            store, isSaving, isCloudSynced, isReady, setTasks, setEvents, setHabits, setBrainDumps, setWeeklyFocus, setTransactions, setTheme, setSupabaseConfig, forceCloudPull
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
