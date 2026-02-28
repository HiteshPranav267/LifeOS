export interface Task {
    id: string;
    title: string;
    category: Category;
    priority: Priority;
    status: 'todo' | 'completed';
    effort: EffortSize;
    deadline: string;
    createdAt: string;
}

export type Category = 'Work' | 'Personal' | 'Health' | 'Finance' | 'Other';
export type Priority = 'low' | 'medium' | 'high';
export type EffortSize = 'S' | 'M' | 'L' | 'XL';

export interface Event {
    id: string;
    title: string;
    date: string;
    start: string;
    end: string;
    category: Category;
}

export interface Habit {
    id: string;
    name: string;
    completions: string[]; // dates in YYYY-MM-DD
}

export interface BrainDump {
    id: string;
    content: string;
    createdAt: string;
    type?: 'task' | 'idea' | 'concern' | 'reflection';
}

export interface WeeklyFocus {
    id: string;
    weekStart: string;
    focus: string;
    objectives: { id: string; text: string; completed: boolean }[];
    // Compatibility with current implementation
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
    supabaseUrl?: string; // For Private Cloud Sync
    supabaseKey?: string; // For Private Cloud Sync
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
