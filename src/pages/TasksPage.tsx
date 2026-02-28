import { useState } from 'react';
import { useStore } from '../store/StoreContext.tsx';
import { Plus, Search, Trash2, CheckCircle, Circle, Sparkles, Pencil } from 'lucide-react';
import type { Task, Category, Priority, EffortSize } from '../types';

const TasksPage = () => {
    const { store, setTasks } = useStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState<Category | 'All'>('All');
    const [isAdding, setIsAdding] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [taskForm, setTaskForm] = useState<Partial<Task>>({
        title: '', category: 'Work', priority: 'medium', status: 'todo', effort: 'M',
        deadline: new Date().toISOString().split('T')[0],
    });
    const [messyText, setMessyText] = useState('');

    const filteredTasks = store.tasks.filter(t => {
        const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = filterCategory === 'All' || t.category === filterCategory;
        return matchesSearch && matchesCategory;
    });
    const sortedTasks = [...filteredTasks].sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());

    const handleSaveTask = () => {
        if (!taskForm.title) return;

        if (editingTask) {
            const updatedTasks = store.tasks.map(t =>
                t.id === editingTask.id ? { ...t, ...taskForm } as Task : t
            );
            setTasks(updatedTasks);
        } else {
            const task: Task = {
                id: crypto.randomUUID(),
                title: taskForm.title || '',
                category: (taskForm.category || 'Work') as Category,
                priority: (taskForm.priority || 'medium') as Priority,
                status: 'todo',
                effort: (taskForm.effort || 'M') as EffortSize,
                deadline: taskForm.deadline || new Date().toISOString().split('T')[0],
                createdAt: new Date().toISOString(),
            };
            setTasks([...store.tasks, task]);
        }
        closeModal();
    };

    const closeModal = () => {
        setIsAdding(false);
        setEditingTask(null);
        setTaskForm({
            title: '', category: 'Work', priority: 'medium', status: 'todo', effort: 'M',
            deadline: new Date().toISOString().split('T')[0],
        });
    };

    const openEdit = (task: Task) => {
        setEditingTask(task);
        setTaskForm(task);
        setIsAdding(true);
    };

    const toggleTaskStatus = (id: string) => {
        setTasks(store.tasks.map(t => t.id === id ? { ...t, status: t.status === 'completed' ? 'todo' : 'completed' } as Task : t));
    };

    const deleteTask = (id: string) => {
        setTasks(store.tasks.filter(t => t.id !== id));
    };

    const handleAIExtract = () => {
        if (!messyText.trim()) return;
        const lines = messyText.split('\n').filter(l => l.trim());
        const newTasks: Task[] = lines.map(line => ({
            id: crypto.randomUUID(),
            title: line.replace(/^[-*•]\s*/, '').trim(),
            category: 'Other' as Category,
            priority: 'medium' as Priority,
            status: 'todo',
            effort: 'M' as EffortSize,
            deadline: new Date().toISOString().split('T')[0],
            createdAt: new Date().toISOString(),
        }));
        setTasks([...store.tasks, ...newTasks]);
        setMessyText('');
    };

    const overdueTasks = sortedTasks.filter(t => t.status !== 'completed' && new Date(t.deadline) < new Date(new Date().setHours(0, 0, 0, 0)));

    return (
        <div className="flex flex-col gap-8">
            {/* Controls */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
                <div className="flex items-center gap-3 flex-1 max-w-sm">
                    <Search size={16} className="text-[var(--text-muted)]" />
                    <input
                        placeholder="Search tasks..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="border-none p-0 text-base"
                    />
                </div>
                <div className="flex gap-3 items-center">
                    <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value as Category | 'All')} className="w-auto text-sm border-none p-0 text-[var(--text-muted)] cursor-pointer">
                        <option value="All">All Categories</option>
                        <option value="Work">Work</option>
                        <option value="Personal">Personal</option>
                        <option value="Health">Health</option>
                        <option value="Finance">Finance</option>
                        <option value="Other">Other</option>
                    </select>
                    <button className="btn-pill" onClick={() => setIsAdding(true)}>
                        <Plus size={14} /> New Task
                    </button>
                </div>
            </div>

            {/* AI Extract */}
            <div className="card bg-[var(--bg-tertiary)]! border-none!">
                <div className="flex items-center gap-2 mb-3">
                    <Sparkles size={14} strokeWidth={2.5} />
                    <span className="section-label" style={{ marginBottom: 0 }}>AI Task Extractor</span>
                </div>
                <textarea
                    placeholder="Paste messy notes here, one task per line..."
                    className="w-full h-24 mb-3 border-none bg-transparent p-0 text-sm focus:ring-0"
                    value={messyText}
                    onChange={(e) => setMessyText(e.target.value)}
                />
                <button className="btn-pill w-full justify-center" onClick={handleAIExtract}>Extract Tasks</button>
            </div>

            {/* Overdue */}
            {overdueTasks.length > 0 && (
                <section>
                    <span className="section-label text-red-500!">Past Due</span>
                    <div className="flex flex-col rounded-xl overflow-hidden border border-red-500/20 mt-3">
                        {overdueTasks.map(task => (
                            <TaskItem key={task.id} task={task} onToggle={toggleTaskStatus} onDelete={deleteTask} onEdit={openEdit} />
                        ))}
                    </div>
                </section>
            )}

            {/* Active */}
            <section>
                <span className="section-label">Active Intentions</span>
                <div className="flex flex-col rounded-xl overflow-hidden border border-[var(--border)] mt-3">
                    {sortedTasks.filter(t => t.status !== 'completed' && !overdueTasks.includes(t)).length > 0
                        ? sortedTasks.filter(t => t.status !== 'completed' && !overdueTasks.includes(t)).map(task => (
                            <TaskItem key={task.id} task={task} onToggle={toggleTaskStatus} onDelete={deleteTask} onEdit={openEdit} />
                        ))
                        : <div className="text-center py-16 bg-[var(--bg-secondary)]">
                            <p className="serif italic text-[var(--text-muted)] text-lg">Your horizon is clear.</p>
                        </div>
                    }
                </div>
            </section>

            {/* Completed */}
            {sortedTasks.filter(t => t.status === 'completed').length > 0 && (
                <section>
                    <span className="section-label">Completed</span>
                    <div className="flex flex-col rounded-xl overflow-hidden border border-[var(--border)] mt-3 opacity-50">
                        {sortedTasks.filter(t => t.status === 'completed').map(task => (
                            <TaskItem key={task.id} task={task} onToggle={toggleTaskStatus} onDelete={deleteTask} onEdit={openEdit} />
                        ))}
                    </div>
                </section>
            )}

            {/* Modal */}
            {isAdding && (
                <div className="modal-overlay">
                    <div className="modal-card">
                        <h3>{editingTask ? 'Refine Task' : 'Define Intention'}</h3>
                        <div className="flex flex-col gap-6">
                            <div className="flex flex-col gap-1">
                                <span className="section-label">Title</span>
                                <input
                                    placeholder="What is the objective?"
                                    value={taskForm.title}
                                    onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                                    className="serif text-lg!"
                                    autoFocus
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1">
                                    <span className="section-label">Category</span>
                                    <select value={taskForm.category} onChange={(e) => setTaskForm({ ...taskForm, category: e.target.value as Category })}>
                                        <option value="Work">Work</option>
                                        <option value="Personal">Personal</option>
                                        <option value="Health">Health</option>
                                        <option value="Finance">Finance</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="section-label">Priority</span>
                                    <select value={taskForm.priority} onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value as Priority })}>
                                        <option value="low">Low Priority</option>
                                        <option value="medium">Medium Priority</option>
                                        <option value="high">High Priority</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1">
                                    <span className="section-label">Deadline</span>
                                    <input type="date" value={taskForm.deadline} onChange={(e) => setTaskForm({ ...taskForm, deadline: e.target.value })} />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="section-label">Complexity</span>
                                    <select value={taskForm.effort} onChange={(e) => setTaskForm({ ...taskForm, effort: e.target.value as EffortSize })}>
                                        <option value="S">Small (Quick)</option>
                                        <option value="M">Medium (Moderate)</option>
                                        <option value="L">Large (Deep Work)</option>
                                        <option value="XL">XL (Epic)</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex justify-end gap-4 mt-4">
                                <button className="btn-ghost" onClick={closeModal}>Cancel</button>
                                <button className="btn-pill" onClick={handleSaveTask}>
                                    {editingTask ? 'Apply Changes' : 'Commit Task'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const TaskItem = ({ task, onToggle, onDelete, onEdit }: { task: Task; onToggle: (id: string) => void; onDelete: (id: string) => void; onEdit: (task: Task) => void }) => (
    <div className="flex items-center justify-between px-5 py-4 bg-[var(--bg-secondary)] group hover:bg-[var(--bg-tertiary)] transition-colors" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-4">
            <button onClick={() => onToggle(task.id)} className="transition-colors">
                {task.status === 'completed'
                    ? <CheckCircle size={20} className="text-green-500" />
                    : <Circle size={20} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]" />
                }
            </button>
            <div className="flex flex-col">
                <span className={`text-sm font-medium ${task.status === 'completed' ? 'line-through opacity-40' : ''}`}>
                    {task.title}
                </span>
                <div className="flex gap-3 items-center mt-0.5 text-[var(--text-muted)] text-[10px] uppercase tracking-wider font-bold">
                    <span>{task.category}</span>
                    <span className={`${task.priority === 'high' ? 'text-red-400' : task.priority === 'medium' ? 'text-yellow-400' : ''}`}>
                        {task.priority}
                    </span>
                    <span>{task.deadline}</span>
                    <span className="bg-[var(--bg-tertiary)] px-1.5 rounded text-[10px]">{task.effort}</span>
                </div>
            </div>
        </div>
        <div className="flex items-center gap-4 opacity-30 group-hover:opacity-100 transition-all duration-300">
            <button onClick={() => onEdit(task)} className="hover:text-white transform hover:scale-110 transition-transform">
                <Pencil size={12} strokeWidth={2} />
            </button>
            <button onClick={() => onDelete(task.id)} className="hover:text-white transform hover:scale-110 transition-transform">
                <Trash2 size={14} strokeWidth={2} />
            </button>
        </div>
    </div>
);

export default TasksPage;
