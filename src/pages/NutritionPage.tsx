import { useState, useMemo } from 'react';
import { useStore } from '../store/StoreContext.tsx';
import {
    Apple,
    Droplets,
    Scale,
    Plus,
    Search,
    ChevronRight,
    ChevronDown,
    Flame,
    Trash2,
    Clock,
    Info,
    TrendingDown,
    TrendingUp,
    Settings as SettingsIcon,
    Edit2,
    Mail
} from 'lucide-react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import type { FoodEntry, BodyMetrics } from '../types';

const CALORIENINJAS_KEY = 'uaNfMe0h4Uru/HgouNAPfQ==fOkJonefRPHoBT8R';

const NutritionPage = () => {
    const { store, setNutrition } = useStore();
    const nutrition = store.nutrition;
    const today = new Date().toISOString().split('T')[0];
    const todayLogs = nutrition.foodLogs[today] || [];
    const todayWater = nutrition.waterLogs[today] || 0;

    const [isConfigOpen, setIsConfigOpen] = useState(false);
    const [tempWaterGoal, setTempWaterGoal] = useState(nutrition.waterGoal || 2500);
    const [customWaterAmount, setCustomWaterAmount] = useState<number>(250);
    const [searchResults, setSearchResults] = useState<FoodEntry[]>([]);
    const [editingFood, setEditingFood] = useState<FoodEntry | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [mealType, setMealType] = useState<FoodEntry['mealType']>('Breakfast');
    const [isAddingCustom, setIsAddingCustom] = useState(false);
    const [customFood, setCustomFood] = useState({ name: '', calories: 0, protein: 0, carbs: 0, fat: 0 });

    const apiKey = CALORIENINJAS_KEY;

    const updateFood = (id: string, updates: Partial<FoodEntry>) => {
        const currentLogs = { ...nutrition.foodLogs };
        if (currentLogs[today]) {
            currentLogs[today] = currentLogs[today].map(f => f.id === id ? { ...f, ...updates } : f);
            setNutrition({ ...nutrition, foodLogs: currentLogs });
        }
        setEditingFood(null);
    };

    const calculateTDEE = (metrics: BodyMetrics) => {
        if (!metrics.height || !metrics.weight || !metrics.age) return 2000;
        // Basic Mifflin-St Jeor (assuming male for simplicity or average)
        const bmr = (10 * metrics.weight) + (6.25 * metrics.height) - (5 * metrics.age) + 5;
        const factors = { sedentary: 1.2, 'lightly active': 1.375, 'moderately active': 1.55, 'very active': 1.725 };
        return Math.round(bmr * factors[metrics.activityLevel]);
    };

    const tdeeGoal = calculateTDEE(nutrition.metrics);
    const totals = todayLogs.reduce((acc, curr) => ({
        calories: acc.calories + curr.calories,
        protein: acc.protein + curr.protein,
        carbs: acc.carbs + curr.carbs,
        fat: acc.fat + curr.fat,
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

    const updateMetrics = (field: keyof BodyMetrics, value: any) => {
        const numValue = Number(value);
        const newMetrics = { ...nutrition.metrics, [field]: numValue, lastUpdated: new Date().toISOString() };

        let newWeightHistory = [...nutrition.weightHistory];
        if (field === 'weight') {
            const todayStr = new Date().toISOString().split('T')[0];
            // Overwrite or create today's single entry
            const existingIndex = newWeightHistory.findIndex(entry => entry.date.startsWith(todayStr));
            if (existingIndex >= 0) {
                newWeightHistory[existingIndex] = { ...newWeightHistory[existingIndex], weight: numValue };
            } else {
                newWeightHistory.push({ id: crypto.randomUUID(), weight: numValue, date: new Date().toISOString() });
            }
            newWeightHistory = newWeightHistory.slice(-30);
        }

        setNutrition({ ...nutrition, metrics: newMetrics, weightHistory: newWeightHistory });
    };

    const addWater = (amount?: number) => {
        const mlToAdd = amount || customWaterAmount || 250;
        const newWaterLogs = { ...nutrition.waterLogs, [today]: todayWater + mlToAdd };
        setNutrition({ ...nutrition, waterLogs: newWaterLogs });
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        setIsSearching(true);
        try {
            const res = await fetch(`https://api.calorieninjas.com/v1/nutrition?query=${encodeURIComponent(searchQuery)}`, {
                headers: { 'X-Api-Key': apiKey }
            });
            const data = await res.json();
            if (data.items) {
                const results: FoodEntry[] = data.items.map((food: any) => ({
                    id: crypto.randomUUID(),
                    name: food.name,
                    calories: Math.round(food.calories),
                    protein: Math.round(food.protein_g),
                    carbs: Math.round(food.carbohydrates_total_g),
                    fat: Math.round(food.fat_total_g),
                    servingQty: food.serving_size_g,
                    servingUnit: 'g',
                    mealType,
                    date: today
                }));
                setSearchResults(results);
                // Don't clear searchQuery here yet, so we can use it for "Merge & Add" name
            }
        } catch (err) {
            console.error('Nutrition search failed', err);
        } finally {
            setIsSearching(false);
        }
    };

    const addCustomFood = () => {
        if (!customFood.name) return;
        const newEntry: FoodEntry = {
            id: crypto.randomUUID(),
            ...customFood,
            servingQty: 1,
            servingUnit: 'portion',
            mealType,
            date: today
        };
        const newLogs = { ...nutrition.foodLogs, [today]: [...todayLogs, newEntry] };
        setNutrition({ ...nutrition, foodLogs: newLogs });
        setCustomFood({ name: '', calories: 0, protein: 0, carbs: 0, fat: 0 });
        setIsAddingCustom(false);
    };

    const addFood = (food: FoodEntry) => {
        const currentLogs = { ...nutrition.foodLogs };
        currentLogs[today] = [...(currentLogs[today] || []), food];
        setNutrition({ ...nutrition, foodLogs: currentLogs });
        setSearchResults(prev => prev.filter(p => p.id !== food.id));
        if (searchResults.length <= 1) setSearchQuery(''); // Clear query if last item added
    };

    const deleteFood = (id: string) => {
        const newLogs = { ...nutrition.foodLogs, [today]: todayLogs.filter(f => f.id !== id) };
        setNutrition({ ...nutrition, foodLogs: newLogs });
    };

    const bmi = useMemo(() => {
        if (!nutrition.metrics.height || !nutrition.metrics.weight) return 0;
        const hInMeters = nutrition.metrics.height / 100;
        return (nutrition.metrics.weight / (hInMeters * hInMeters)).toFixed(1);
    }, [nutrition.metrics]);

    const weightData = useMemo(() => {
        // Deduplicate existing history: Keep only the latest entry for each distinct date
        const dailyLatest: Record<string, any> = {};
        nutrition.weightHistory.forEach(entry => {
            const dateStr = entry.date.split('T')[0];
            dailyLatest[dateStr] = entry;
        });

        return Object.values(dailyLatest)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .map(entry => ({
                date: new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                weight: entry.weight
            }));
    }, [nutrition.weightHistory]);

    return (
        <div className="flex flex-col gap-10 max-w-2xl mx-auto pb-24">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div>
                        <span className="text-[11px] uppercase tracking-[0.4em] font-bold text-[var(--text-secondary)]">Fuel & Form</span>
                        <h1 className="text-3xl font-bold mt-2">Nutrition.</h1>
                    </div>
                    <button
                        onClick={() => setIsConfigOpen(true)}
                        className="p-2 mt-6 rounded-full bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-blue-500 transition-all active:scale-95"
                    >
                        <SettingsIcon size={16} />
                    </button>
                </div>
                <div className="flex flex-col items-end">
                    <div className="flex items-center gap-2 text-orange-500">
                        <Flame size={18} fill="currentColor" />
                        <span className="font-bold text-xl">{nutrition.streak}</span>
                    </div>
                    <span className="text-[10px] uppercase font-bold text-[var(--text-secondary)] tracking-widest">Day Streak</span>
                </div>
            </div>

            {/* Daily Summary */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="card p-6 flex flex-col gap-6">
                    <div className="flex justify-between items-center">
                        <span className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)]">Daily Calorie Goal</span>
                        <Info size={14} className="text-[var(--text-secondary)]" />
                    </div>
                    <div className="flex flex-col gap-2">
                        <div className="flex justify-between items-end">
                            <span className="text-4xl font-bold">{totals.calories}</span>
                            <span className="text-[var(--text-secondary)] font-medium mb-1">/ {tdeeGoal} kcal</span>
                        </div>
                        <div className="w-full h-3 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
                            <div
                                className="h-full bg-blue-500 transition-all duration-500"
                                style={{ width: `${Math.min((totals.calories / tdeeGoal) * 100, 100)}%` }}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mt-2">
                        {[
                            { label: 'Protein', value: totals.protein, target: Math.round(tdeeGoal * 0.3 / 4), color: 'bg-red-500' },
                            { label: 'Carbs', value: totals.carbs, target: Math.round(tdeeGoal * 0.4 / 4), color: 'bg-green-500' },
                            { label: 'Fat', value: totals.fat, target: Math.round(tdeeGoal * 0.3 / 9), color: 'bg-yellow-500' }
                        ].map(macro => (
                            <div key={macro.label} className="flex flex-col gap-2">
                                <span className="text-[10px] uppercase font-bold text-[var(--text-secondary)]">{macro.label}</span>
                                <div className="w-full h-1.5 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
                                    <div
                                        className={`h-full ${macro.color} transition-all duration-500`}
                                        style={{ width: `${Math.min((macro.value / macro.target) * 100, 100)}%` }}
                                    />
                                </div>
                                <span className="text-xs font-bold">{macro.value}g</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="card p-6 flex flex-col gap-6">
                    <div className="flex justify-between items-center">
                        <span className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)]">Hydration</span>
                        <Droplets size={18} className="text-blue-500" />
                    </div>
                    <div className="flex flex-col gap-2">
                        <div className="flex justify-between items-end">
                            <span className="text-4xl font-bold">{todayWater}</span>
                            <span className="text-[var(--text-secondary)] font-medium mb-1">/ {nutrition.waterGoal} ml</span>
                        </div>
                        <div className="w-full h-3 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
                            <div
                                style={{ width: `${Math.min((todayWater / nutrition.waterGoal) * 100, 100)}%` }}
                                className="h-full bg-blue-400 transition-all duration-500"
                            />
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <input
                            type="number"
                            value={customWaterAmount || ''}
                            onChange={(e) => setCustomWaterAmount(Number(e.target.value))}
                            className="w-24! text-center! mb-0! h-14! font-bold!"
                            placeholder="ml"
                        />
                        <button
                            onClick={() => addWater()}
                            className="flex-1 bg-blue-500/10 text-blue-500 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-blue-500/20 active:scale-95 transition-all"
                        >
                            <Plus size={18} /> Add
                        </button>
                    </div>
                </div>
            </section>

            {/* Food Log */}
            <section className="flex flex-col gap-6">
                <div className="flex justify-between items-center">
                    <span className="section-label m-0">Daily Food Log</span>
                    <div className="flex gap-2">
                        {(['Breakfast', 'Lunch', 'Dinner', 'Snacks'] as FoodEntry['mealType'][]).map(type => (
                            <button
                                key={type}
                                onClick={() => setMealType(type)}
                                className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${mealType === type ? 'bg-[var(--text-primary)] text-[var(--bg-primary)]' : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                            >
                                {type[0]}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col gap-4">
                    <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]">
                            <Search size={20} />
                        </div>
                        <input
                            placeholder={`Explore ${mealType.toLowerCase()}... (e.g. "2 eggs and toast")`}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            className="pl-14! pr-20! h-14! mb-0!"
                        />
                        <button
                            disabled={!searchQuery.trim() || isSearching}
                            onClick={handleSearch}
                            className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-[var(--text-primary)] text-[var(--bg-primary)] rounded-lg font-bold text-xs active:scale-95 disabled:opacity-20 transition-all"
                        >
                            {isSearching ? '...' : <ChevronRight size={18} />}
                        </button>
                    </div>
                    <button
                        onClick={() => setIsAddingCustom(true)}
                        className="text-[10px] uppercase font-bold text-blue-500 tracking-widest self-end hover:opacity-80 transition-opacity"
                    >
                        + Add Custom Entry
                    </button>
                </div>

                {/* Search Results Preview */}
                {searchResults.length > 0 && (
                    <div className="flex flex-col gap-3 p-4 bg-orange-500/5 rounded-[2rem] border border-orange-500/10">
                        <div className="flex justify-between items-center px-2">
                            <span className="text-[10px] uppercase font-black text-orange-500 tracking-[0.2em]">Verify Results</span>
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => {
                                        const merged: FoodEntry = {
                                            id: crypto.randomUUID(),
                                            name: searchQuery.trim() || searchResults.map(r => r.name).join(' '),
                                            calories: searchResults.reduce((s, r) => s + r.calories, 0),
                                            protein: Number(searchResults.reduce((s, r) => s + r.protein, 0).toFixed(1)),
                                            carbs: Number(searchResults.reduce((s, r) => s + r.carbs, 0).toFixed(1)),
                                            fat: Number(searchResults.reduce((s, r) => s + r.fat, 0).toFixed(1)),
                                            servingQty: 1,
                                            servingUnit: 'portion',
                                            mealType,
                                            date: today
                                        };
                                        addFood(merged);
                                        setSearchResults([]);
                                    }}
                                    className="text-[10px] font-black text-orange-500 uppercase tracking-widest hover:bg-orange-500 hover:text-white px-3 py-1 rounded-lg transition-all"
                                >
                                    Merge & Add
                                </button>
                                <button onClick={() => setSearchResults([])} className="text-[10px] font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Clear</button>
                            </div>
                        </div>
                        {searchResults.map(result => (
                            <div key={result.id} className="card p-4 flex items-center justify-between bg-[var(--bg-elevated)] border-none">
                                <div className="flex flex-col gap-1">
                                    <span className="font-bold text-sm capitalize">{result.name}</span>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            value={result.servingQty}
                                            onChange={(e) => {
                                                const newQty = Number(e.target.value);
                                                const ratio = newQty / result.servingQty;
                                                setSearchResults(prev => prev.map(p => p.id === result.id ? {
                                                    ...p,
                                                    servingQty: newQty,
                                                    calories: Math.round(p.calories * ratio),
                                                    protein: Number((p.protein * ratio).toFixed(1)),
                                                    carbs: Number((p.carbs * ratio).toFixed(1)),
                                                    fat: Number((p.fat * ratio).toFixed(1))
                                                } : p));
                                            }}
                                            className="w-16! h-7! p-0! text-center! text-[10px]! font-bold! bg-[var(--bg-primary)]! border-none! rounded-lg! mb-0!"
                                        />
                                        <span className="text-[10px] text-[var(--text-secondary)] font-bold uppercase">{result.servingUnit} • {result.calories} kcal</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => addFood(result)}
                                    className="p-3 bg-orange-500 text-white rounded-xl shadow-lg shadow-orange-500/20 active:scale-90 transition-all"
                                >
                                    <Plus size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Log List */}
                <div className="flex flex-col gap-3">
                    {todayLogs.length > 0 ? (
                        (['Breakfast', 'Lunch', 'Dinner', 'Snacks'] as FoodEntry['mealType'][]).map(type => {
                            const entries = todayLogs.filter(l => l.mealType === type);
                            if (entries.length === 0) return null;
                            return (
                                <div key={type} className="flex flex-col gap-2">
                                    <span className="text-[10px] uppercase font-bold text-[var(--text-secondary)] tracking-widest pl-2 mb-1">{type}</span>
                                    {entries.map(food => (
                                        <div key={food.id} className="card p-4 flex items-center justify-between group">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center text-orange-500">
                                                    <Apple size={18} />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-sm">{food.name}</span>
                                                    <span className="text-[10px] text-[var(--text-secondary)] uppercase font-bold">{food.calories} kcal • {food.servingQty} {food.servingUnit}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="hidden md:flex items-center gap-3">
                                                    {[{ l: 'P', v: food.protein, c: 'text-red-500' }, { l: 'C', v: food.carbs, c: 'text-green-500' }, { l: 'F', v: food.fat, c: 'text-yellow-500' }].map(m => (
                                                        <div key={m.l} className="flex flex-col items-center">
                                                            <span className={`text-[8px] font-bold ${m.c}`}>{m.l}</span>
                                                            <span className="text-[10px] font-bold">{m.v}g</span>
                                                        </div>
                                                    ))}
                                                </div>
                                                <button onClick={() => setEditingFood(food)} className="p-2 text-[var(--text-secondary)] hover:text-orange-500 opacity-0 group-hover:opacity-100 transition-all">
                                                    <Edit2 size={16} />
                                                </button>
                                                <button onClick={() => deleteFood(food.id)} className="p-2 text-[var(--text-secondary)] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            );
                        })
                    ) : (
                        <div className="p-10 border-2 border-dashed border-[var(--border)] rounded-3xl text-center">
                            <p className="serif italic text-[var(--text-secondary)]">Fuel the journey. Log your intake.</p>
                        </div>
                    )}
                </div>
            </section>

            {/* Metrics & Progress */}
            <section className="flex flex-col gap-6">
                <span className="section-label m-0">Body Metrics & History</span>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Weight', value: nutrition.metrics.weight, unit: 'kg', icon: Scale, field: 'weight' },
                        { label: 'Height', value: nutrition.metrics.height, unit: 'cm', icon: ChevronDown, field: 'height' },
                        { label: 'Age', value: nutrition.metrics.age, unit: 'yrs', icon: Clock, field: 'age' },
                        { label: 'BMI', value: bmi, unit: '', icon: Info, field: '' }
                    ].map(metric => (
                        <div key={metric.label} className="card p-5 flex flex-col gap-2">
                            <div className="flex justify-between items-center text-[var(--text-secondary)]">
                                <span className="text-[9px] uppercase font-bold tracking-widest">{metric.label}</span>
                                <metric.icon size={14} />
                            </div>
                            <div className="flex items-baseline gap-1">
                                {metric.field ? (
                                    <input
                                        type="number"
                                        value={metric.value}
                                        onChange={(e) => updateMetrics(metric.field as any, Number(e.target.value))}
                                        className="w-full bg-transparent border-none p-0 text-xl font-bold focus:ring-0! mb-0!"
                                    />
                                ) : (
                                    <span className="text-xl font-bold">{metric.value}</span>
                                )}
                                <span className="text-[10px] font-bold text-[var(--text-secondary)]">{metric.unit}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Weight Chart */}
                {weightData.length > 1 && (
                    <div className="card p-6 h-[300px]">
                        <div className="flex items-center justify-between mb-6">
                            <span className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)]">Weight Trajectory</span>
                            <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 text-green-500 rounded-full text-[10px] font-bold">
                                {Number(weightData[weightData.length - 1].weight) < Number(weightData[0].weight) ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
                                {Math.abs(Number(weightData[weightData.length - 1].weight) - Number(weightData[0].weight)).toFixed(1)}kg
                            </div>
                        </div>
                        <ResponsiveContainer width="100%" height="80%">
                            <LineChart data={weightData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                                <XAxis
                                    dataKey="date"
                                    fontSize={10}
                                    tick={{ fill: 'var(--text-secondary)' }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    hide
                                    domain={['dataMin - 2', 'dataMax + 2']}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'var(--bg-elevated)',
                                        border: '1px solid var(--border)',
                                        borderRadius: '12px',
                                        fontSize: '12px'
                                    }}
                                    itemStyle={{ color: 'var(--text-primary)' }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="weight"
                                    stroke="var(--text-primary)"
                                    strokeWidth={3}
                                    dot={{ fill: 'var(--text-primary)', r: 4 }}
                                    activeDot={{ r: 6 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </section>

            {/* Modals */}
            {isAddingCustom && (
                <div className="modal-overlay">
                    <div className="modal-card">
                        <h3 className="text-2xl font-semibold mb-8 text-center">Custom Entry.</h3>
                        <div className="flex flex-col gap-6">
                            <input
                                placeholder="Food Name"
                                value={customFood.name}
                                onChange={(e) => setCustomFood({ ...customFood, name: e.target.value })}
                                autoFocus
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <input
                                    type="number"
                                    placeholder="Calories (kcal)"
                                    value={customFood.calories || ''}
                                    onChange={(e) => setCustomFood({ ...customFood, calories: Number(e.target.value) })}
                                />
                                <input
                                    type="number"
                                    placeholder="Protein (g)"
                                    value={customFood.protein || ''}
                                    onChange={(e) => setCustomFood({ ...customFood, protein: Number(e.target.value) })}
                                />
                                <input
                                    type="number"
                                    placeholder="Carbs (g)"
                                    value={customFood.carbs || ''}
                                    onChange={(e) => setCustomFood({ ...customFood, carbs: Number(e.target.value) })}
                                />
                                <input
                                    type="number"
                                    placeholder="Fat (g)"
                                    value={customFood.fat || ''}
                                    onChange={(e) => setCustomFood({ ...customFood, fat: Number(e.target.value) })}
                                />
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button className="flex-1 h-12 bg-[var(--text-primary)] text-[var(--bg-primary)] rounded-xl font-semibold active:scale-95 transition-transform" onClick={addCustomFood}>
                                    Save Entry
                                </button>
                                <button className="h-12 px-6 bg-[var(--bg-elevated)] rounded-xl font-semibold active:scale-95 transition-transform" onClick={() => setIsAddingCustom(false)}>
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* API Config Modal */}
            {isConfigOpen && (
                <div className="modal-overlay">
                    <div className="modal-card">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-500">
                                <SettingsIcon size={24} />
                            </div>
                            <h3 className="text-2xl font-semibold">Nutrition Settings.</h3>
                        </div>
                        <div className="flex flex-col gap-6">
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] uppercase font-bold tracking-widest text-[var(--text-secondary)] ml-1">Daily Water Goal (ml)</label>
                                <input
                                    type="number"
                                    placeholder="e.g. 3000"
                                    value={tempWaterGoal}
                                    onChange={(e) => setTempWaterGoal(Number(e.target.value))}
                                    className="h-14!"
                                />
                            </div>

                            <div className="pt-4 border-t border-[var(--border)]">
                                <span className="text-[10px] uppercase font-bold tracking-widest text-[var(--text-secondary)] ml-1">Support & Feedback</span>
                                <a
                                    href="mailto:hiteshpranavreddy.d@gmail.com?subject=LifeOS Suggestion"
                                    className="flex items-center gap-3 p-4 mt-2 bg-[var(--bg-elevated)] rounded-2xl group hover:bg-blue-500/5 transition-all"
                                >
                                    <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500 group-hover:scale-110 transition-transform">
                                        <Mail size={16} />
                                    </div>
                                    <div className="flex flex-col text-left">
                                        <span className="font-bold text-sm text-[var(--text-primary)]">Have a suggestion?</span>
                                        <span className="text-[10px] text-[var(--text-secondary)]">Reach out to the developer</span>
                                    </div>
                                </a>
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button
                                    className="flex-1 h-12 bg-blue-500 text-white rounded-xl font-bold active:scale-95 transition-transform"
                                    onClick={() => {
                                        setNutrition({ ...nutrition, waterGoal: tempWaterGoal });
                                        setIsConfigOpen(false);
                                    }}
                                >
                                    Save Settings
                                </button>
                                <button className="h-12 px-6 bg-[var(--bg-elevated)] rounded-xl font-bold active:scale-95 transition-transform" onClick={() => setIsConfigOpen(false)}>
                                    Dismiss
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Edit Food Modal */}
            {editingFood && (
                <div className="modal-overlay">
                    <div className="modal-card">
                        <h3 className="text-2xl font-semibold mb-8 text-center capitalize">Edit {editingFood.name}.</h3>
                        <div className="flex flex-col gap-6">
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] uppercase font-bold text-[var(--text-secondary)] ml-1">Quantity & Unit</label>
                                <div className="flex gap-4">
                                    <input
                                        type="number"
                                        placeholder="Qty"
                                        value={editingFood.servingQty}
                                        onChange={(e) => setEditingFood({ ...editingFood, servingQty: Number(e.target.value) })}
                                        className="w-1/3!"
                                    />
                                    <input
                                        placeholder="Unit (e.g. g, oz, bowl)"
                                        value={editingFood.servingUnit}
                                        onChange={(e) => setEditingFood({ ...editingFood, servingUnit: e.target.value })}
                                        className="flex-1!"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] uppercase font-bold text-[var(--text-secondary)] ml-1">Calories</label>
                                    <input
                                        type="number"
                                        value={editingFood.calories || ''}
                                        onChange={(e) => setEditingFood({ ...editingFood, calories: Number(e.target.value) })}
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] uppercase font-bold text-[var(--text-secondary)] ml-1">Protein (g)</label>
                                    <input
                                        type="number"
                                        value={editingFood.protein || ''}
                                        onChange={(e) => setEditingFood({ ...editingFood, protein: Number(e.target.value) })}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] uppercase font-bold text-[var(--text-secondary)] ml-1">Carbs (g)</label>
                                    <input
                                        type="number"
                                        value={editingFood.carbs || ''}
                                        onChange={(e) => setEditingFood({ ...editingFood, carbs: Number(e.target.value) })}
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] uppercase font-bold text-[var(--text-secondary)] ml-1">Fat (g)</label>
                                    <input
                                        type="number"
                                        value={editingFood.fat || ''}
                                        onChange={(e) => setEditingFood({ ...editingFood, fat: Number(e.target.value) })}
                                    />
                                </div>
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button
                                    className="flex-1 h-12 bg-orange-500 text-white rounded-xl font-bold active:scale-95 transition-transform"
                                    onClick={() => updateFood(editingFood.id, editingFood)}
                                >
                                    Update Entry
                                </button>
                                <button className="h-12 px-6 bg-[var(--bg-elevated)] rounded-xl font-bold active:scale-95 transition-transform" onClick={() => setEditingFood(null)}>
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NutritionPage;
