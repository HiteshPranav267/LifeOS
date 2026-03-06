import { useState, useMemo } from 'react';
import { useStore } from '../store/StoreContext.tsx';
import { Plus, Check, Trash2, Pencil, Bookmark, Circle } from 'lucide-react';
import type { Task } from '../types';

const TasksPage = () => {
    const { store, setTasks } = useStore();
    const [isAdding, setIsAdding] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('Work');
    const [priority, setPriority] = useState<Task['priority']>('medium');

    const handleSave = () => {
        if (!title.trim()) return;

        if (editingTask) {
            const updated = store.tasks.map(t =>
                t.id === editingTask.id ? { ...t, title, category, priority } : t
            );
            setTasks(updated);
        } else {
            const newTask: Task = {
                id: crypto.randomUUID(),
                title,
                category,
                priority,
                status: 'pending',
                createdAt: new Date().toISOString(),
            };
            setTasks([...store.tasks, newTask]);
        }
        closeModal();
    };

    const toggleStatus = (id: string) => {
        setTasks(store.tasks.map(t =>
            t.id === id ? { ...t, status: t.status === 'completed' ? 'pending' : 'completed' } : t
        ));
    };

    const deleteTask = (id: string) => {
        setTasks(store.tasks.filter(t => t.id !== id));
    };

    const openEdit = (task: Task) => {
        setEditingTask(task);
        setTitle(task.title);
        setCategory(task.category);
        setPriority(task.priority);
        setIsAdding(true);
    };

    const closeModal = () => {
        setIsAdding(false);
        setEditingTask(null);
        setTitle('');
        setCategory('Work');
        setPriority('medium');
    };

    const pendingTasks = useMemo(() => {
        const tasks = store.tasks.filter(t => t.status !== 'completed');

        const high = tasks.filter(t => t.priority === 'high');
        const medium = tasks.filter(t => t.priority === 'medium');
        const low = tasks.filter(t => t.priority === 'low');
        const others = tasks.filter(t => !['high', 'medium', 'low'].includes(t.priority));

        const sortByDate = (a: Task, b: Task) =>
            new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();

        return [
            ...high.sort(sortByDate),
            ...medium.sort(sortByDate),
            ...low.sort(sortByDate),
            ...others.sort(sortByDate)
        ];
    }, [store.tasks]);

    const completedTasks = useMemo(() => {
        return [...store.tasks]
            .filter(t => t.status === 'completed')
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [store.tasks]);

    return (
        <div className="flex flex-col gap-10 max-w-2xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <span className="text-[11px] uppercase tracking-[0.4em] font-bold text-[var(--text-secondary)]">Inventory</span>
                    <h1 className="text-3xl font-bold mt-2">Tasks.</h1>
                </div>
                <button
                    onClick={() => setIsAdding(true)}
                    className="w-14 h-14 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] flex items-center justify-center shadow-lg active:scale-90 transition-transform"
                >
                    <Plus size={24} />
                </button>
            </div>

            <section className="flex flex-col gap-8">
                <div>
                    <span className="section-label m-0 mb-6">Pending Intention</span>
                    <div className="flex flex-col gap-3">
                        {pendingTasks.length > 0 ? pendingTasks.map(task => (
                            <div key={task.id} className="card p-5 py-4 flex flex-col gap-4 group">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4 flex-1" onClick={() => toggleStatus(task.id)}>
                                        <div className="w-8 h-8 rounded-full border-2 border-[var(--border)] flex items-center justify-center transition-colors group-hover:border-blue-500">
                                            <Circle size={16} className="text-[var(--text-secondary)]" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-base font-medium leading-snug">{task.title}</span>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[9px] uppercase font-bold tracking-widest text-neutral-500">{task.category}</span>
                                                <div className={`w-1 h-1 rounded-full ${task.priority === 'high' ? 'bg-red-500' : task.priority === 'medium' ? 'bg-orange-500' : 'bg-green-500'}`} />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6 opacity-30 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => openEdit(task)} className="p-2 hover:text-blue-500 transition-colors">
                                            <Pencil size={18} />
                                        </button>
                                        <button onClick={() => deleteTask(task.id)} className="p-2 hover:text-red-500 transition-colors">
                                            <Trash2 size={20} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <div className="p-10 text-center text-[var(--text-secondary)] italic text-lg border-2 border-dashed border-[var(--border)] rounded-3xl">
                                <p className="serif italic text-lg lowercase">The inventory is clean. Peace.</p>
                            </div>
                        )}
                    </div>
                </div>

                {completedTasks.length > 0 && (
                    <div>
                        <span className="section-label m-0 mb-6 opacity-40">Resolved</span>
                        <div className="flex flex-col gap-2">
                            {completedTasks.map(task => (
                                <div key={task.id} className="flex items-center gap-4 px-6 py-4 opacity-30 line-through grayscale">
                                    <div className="w-8 h-8 rounded-full bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center justify-center">
                                        <Check size={16} className="text-[var(--text-secondary)]" />
                                    </div>
                                    <span className="text-sm font-medium">{task.title}</span>
                                    <div className="flex-1" />
                                    <button onClick={() => deleteTask(task.id)} className="p-2">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </section>

            {isAdding && (
                <div className="modal-overlay">
                    <div className="modal-card">
                        <h3 className="text-2xl font-semibold mb-8">{editingTask ? 'Refine' : 'Add'} Intention.</h3>
                        <div className="flex flex-col gap-6">
                            <div className="relative group">
                                <div className="absolute left-4 top-5 text-neutral-500"><Bookmark size={20} /></div>
                                <input
                                    placeholder="What is the objective?"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="pl-14! mb-0!"
                                    autoFocus
                                />
                            </div>

                            <div className="flex gap-4">
                                <select
                                    className="flex-1 mb-0!"
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                >
                                    <option value="Work">Professional</option>
                                    <option value="Personal">Personal</option>
                                    <option value="Growth">Expansion</option>
                                    <option value="Ritual">Ritual</option>
                                </select>
                                <select
                                    className="flex-1 mb-0!"
                                    value={priority}
                                    onChange={(e) => setPriority(e.target.value as any)}
                                >
                                    <option value="high">Urgent</option>
                                    <option value="medium">Primary</option>
                                    <option value="low">Passive</option>
                                </select>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button className="flex-1 h-12 bg-[var(--text-primary)] text-[var(--bg-primary)] rounded-xl font-semibold active:scale-95 transition-transform" onClick={handleSave}>
                                    Save Task
                                </button>
                                <button className="h-12 px-6 bg-[var(--bg-elevated)] rounded-xl font-semibold active:scale-95 transition-transform" onClick={closeModal}>
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

export default TasksPage;
