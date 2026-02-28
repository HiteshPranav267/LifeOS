export interface Task {
    id: string;
    title: string;
    category: string;
    priority: 'low' | 'medium' | 'high';
    status: 'pending' | 'completed' | 'todo'; // Allow all for compatibility
    createdAt: string;
}

export interface Event {
    id: string;
    title: string;
    date: string;
    time: string;
    type: 'event' | 'task' | 'milestone';
    createdAt: string;
}

export interface Habit {
    id: string;
    title: string;
    frequency: string;
    streak: number;
    completedDays: string[]; // YYYY-MM-DD
}

export interface BrainDump {
    id: string;
    content: string;
    createdAt: string;
}

export interface WeeklyFocus {
    id: string;
    weekId?: string;
    focusTasks?: string[];
}

export interface Transaction {
    id: string;
    type: 'income' | 'expense';
    amount: number;
    reason: string;
    date: string;
}

export interface Settings {
    theme: 'light' | 'dark';
    supabaseUrl?: string;
    supabaseKey?: string;
}

export interface Store {
    tasks: Task[];
    events: Event[];
    habits: Habit[];
    brainDumps: BrainDump[];
    weeklyFocus: WeeklyFocus[];
    transactions: Transaction[];
    settings: Settings;
}
