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
    calorieNinjasKey?: string;
    exerciseDbKey?: string;
}

export interface Birthday {
    id: string;
    person: string;
    date: string; // YYYY-MM-DD
}

export interface WeightEntry {
    id: string;
    weight: number;
    date: string;
}

export interface BodyMetrics {
    height: number;
    weight: number;
    age: number;
    activityLevel: 'sedentary' | 'lightly active' | 'moderately active' | 'very active';
    lastUpdated: string;
}

export interface FoodEntry {
    id: string;
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    servingQty: number;
    servingUnit: string;
    mealType: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks';
    date: string;
}

export interface NutritionStore {
    metrics: BodyMetrics;
    weightHistory: WeightEntry[];
    foodLogs: Record<string, FoodEntry[]>; // key: YYYY-MM-DD
    waterLogs: Record<string, number>; // key: YYYY-MM-DD
    waterGoal: number; // in ml
    streak: number;
}

export interface Exercise {
    id: string;
    name: string;
    bodyPart: string;
    equipment: string;
    target: string;
    gifUrl: string;
}

export interface WorkoutSet {
    id: string;
    reps: number;
    weight: number;
    completed: boolean;
    isPR: boolean;
}

export interface LoggedExercise extends Exercise {
    instanceId: string;
    sets: WorkoutSet[];
}

export interface WorkoutSession {
    id: string;
    date: string;
    exercises: LoggedExercise[];
    isTemplate: boolean;
    templateName?: string;
}

export interface CardioEntry {
    id: string;
    type: 'run' | 'cycle' | 'swim' | 'walk';
    duration: number; // mins
    distance: number; // km
    calories: number;
    date: string;
}

export interface PersonalRecord {
    exerciseId: string;
    exerciseName: string;
    maxWeight: number;
    maxReps: number;
    oneRepMax: number;
    date: string;
}

export interface FitnessStore {
    sessions: WorkoutSession[];
    templates: WorkoutSession[];
    prs: PersonalRecord[];
    cardioLogs: CardioEntry[];
    streak: number;
}

export interface Store {
    tasks: Task[];
    events: Event[];
    habits: Habit[];
    brainDumps: BrainDump[];
    weeklyFocus: WeeklyFocus[];
    transactions: Transaction[];
    settings: Settings;
    birthdays: Birthday[];
    nutrition: NutritionStore;
    fitness: FitnessStore;
}
