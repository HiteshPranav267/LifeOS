import type { Store, Task, Event, Habit, BrainDump, WeeklyFocus, Transaction } from '../types';

const STORAGE_KEY = 'lifeos_data';

const DEFAULT_STORE: Store = {
    tasks: [],
    events: [],
    habits: [],
    brainDumps: [],
    weeklyFocus: [],
    transactions: [],
    birthdays: [],
    nutrition: {
        metrics: {
            height: 175,
            weight: 70,
            age: 25,
            activityLevel: 'moderately active',
            lastUpdated: new Date().toISOString()
        },
        weightHistory: [],
        foodLogs: {},
        waterLogs: {},
        waterGoal: 2000,
        streak: 0
    },
    fitness: {
        sessions: [],
        templates: [],
        prs: [],
        cardioLogs: [],
        streak: 0
    },
    settings: {
        theme: 'dark',
    },
};

/** Sync to Local Disk (The Laptop Project Folder) */
export const syncToDisk = async (store: Store) => {
    try {
        // Only in local development
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.startsWith('192.168.') || window.location.hostname.startsWith('172.')) {
            const response = await fetch('/api/save-data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(store)
            });
            const result = await response.json();
            console.log(`[LifeOS Disk Sync] | Commit to Folder | ${result.status === 'success' ? 'SUCCESS' : 'FAILURE'}`);
        }
    } catch (err) {
        console.warn('[LifeOS Disk Sync] | Offline or non-development environment');
    }
};

/** Sync to Private Cloud (Supabase REST API) */
export const syncToCloud = async (store: Store) => {
    const { supabaseUrl, supabaseKey } = store.settings;
    if (!supabaseUrl || !supabaseKey) return;

    try {
        // High-Performance UPSERT (on_conflict=id)
        const res = await fetch(`${supabaseUrl}/rest/v1/lifeos_sync?on_conflict=id`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`,
                'Prefer': 'resolution=merge-duplicates'
            },
            body: JSON.stringify({
                id: 'default_user',
                data: store,
                updated_at: new Date().toISOString()
            })
        });

        if (res.ok) {
            console.log('[LifeOS Cloud Sync] | Global Uplink Success | Private Cloud Storage Updated.');
        } else {
            console.warn('[LifeOS Cloud Sync] | Failed to resolve cloud handshake.');
        }
    } catch (err) {
        console.warn('[LifeOS Cloud Sync] | Deferred (Offline)');
    }
};

/** Load from Private Cloud */
export const loadFromCloud = async (url: string, key: string): Promise<Store | null> => {
    try {
        const res = await fetch(`${url}/rest/v1/lifeos_sync?id=eq.default_user`, {
            method: 'GET',
            headers: {
                'apikey': key,
                'Authorization': `Bearer ${key}`
            }
        });

        if (res.ok) {
            const result = await res.json();
            if (result && result.length > 0) {
                return result[0].data as Store;
            }
        }
    } catch (err) {
        console.error('[LifeOS Cloud Pull Error]', err);
    }
    return null;
};

/** Robust UUID Fallback */
export const uuid = () => {
    try {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return crypto.randomUUID();
        }
    } catch (e) { /* ignore */ }
    return Math.random().toString(36).substring(2, 10) + '-' + Math.random().toString(36).substring(2, 6);
};

export const getStore = (): Store => {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        if (!data) {
            console.log('[LifeOS] | No local browser data. Ready to import from project folder.');
            return DEFAULT_STORE;
        }
        const parsed = JSON.parse(data);

        // Data Migration / Safety
        if (!parsed.transactions) parsed.transactions = [];
        if (!parsed.weeklyFocus) parsed.weeklyFocus = [];
        if (!parsed.brainDumps) parsed.brainDumps = [];
        if (!parsed.habits) parsed.habits = [];
        if (!parsed.events) parsed.events = [];
        if (!parsed.tasks) parsed.tasks = [];
        if (!parsed.settings) parsed.settings = DEFAULT_STORE.settings;
        if (!parsed.birthdays) parsed.birthdays = DEFAULT_STORE.birthdays;
        if (!parsed.nutrition) parsed.nutrition = DEFAULT_STORE.nutrition;
        if (!parsed.fitness) parsed.fitness = DEFAULT_STORE.fitness;

        return parsed;
    } catch (err) {
        console.error('[LifeOS Store Error]', err);
        return DEFAULT_STORE;
    }
};

export const saveStore = (store: Store) => {
    try {
        const data = JSON.stringify(store);
        localStorage.setItem(STORAGE_KEY, data);

        // Back up to Local Disk on Laptop
        syncToDisk(store);

        // Sync to Private Cloud if keys are configured
        syncToCloud(store);

        (window as any)._LIFEOS_LATEST_SYNC = {
            timestamp: new Date().toISOString(),
            taskCount: store.tasks.length,
            eventCount: store.events.length,
            size: data.length,
            cloud: !!(store.settings.supabaseUrl && store.settings.supabaseKey)
        };
    } catch (err) {
        console.error('[LifeOS Save Error]', err);
    }
};

// Generic update handlers for state updates outside of React context
export const updateTasks = (tasks: Task[]) => { const s = getStore(); saveStore({ ...s, tasks }); };
export const updateEvents = (events: Event[]) => { const s = getStore(); saveStore({ ...s, events }); };
export const updateHabits = (habits: Habit[]) => { const s = getStore(); saveStore({ ...s, habits }); };
export const updateBrainDumps = (brainDumps: BrainDump[]) => { const s = getStore(); saveStore({ ...s, brainDumps }); };
export const updateWeeklyFocus = (weeklyFocus: WeeklyFocus[]) => { const s = getStore(); saveStore({ ...s, weeklyFocus }); };
export const updateTransactions = (transactions: Transaction[]) => { const s = getStore(); saveStore({ ...s, transactions }); };
export const updateSettings = (settings: Store['settings']) => { const s = getStore(); saveStore({ ...s, settings }); };
