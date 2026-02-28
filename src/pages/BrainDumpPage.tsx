import { useState } from 'react';
import { useStore } from '../store/StoreContext.tsx';
import { Plus, Brain, Trash2, ArrowRight, Zap } from 'lucide-react';
import type { BrainDump, Task } from '../types';

const BrainDumpPage = () => {
    const { store, setBrainDumps, setTasks } = useStore();
    const [content, setContent] = useState('');

    const handleSave = () => {
        if (!content.trim()) return;
        const newDump: BrainDump = {
            id: crypto.randomUUID(),
            content: content.trim(),
            createdAt: new Date().toISOString(),
        };
        setBrainDumps([newDump, ...store.brainDumps]);
        setContent('');
    };

    const deleteDump = (id: string) => {
        setBrainDumps(store.brainDumps.filter(d => d.id !== id));
    };

    const convertToTask = (dump: BrainDump) => {
        const newTask: Task = {
            id: crypto.randomUUID(),
            title: dump.content,
            category: 'Personal',
            priority: 'medium',
            status: 'pending',
            createdAt: new Date().toISOString(),
        };
        setTasks([...store.tasks, newTask]);
        deleteDump(dump.id);
    };

    return (
        <div className="flex flex-col gap-10 max-w-2xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <span className="text-[11px] uppercase tracking-[0.4em] font-bold text-[var(--text-secondary)]">Cognition</span>
                    <h1 className="text-3xl font-bold mt-2">Brain Dump.</h1>
                </div>
                <div className="w-10 h-10 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center">
                    <Brain size={20} className="text-[var(--text-secondary)]" />
                </div>
            </div>

            {/* Input */}
            <div className="card p-0 overflow-hidden">
                <textarea
                    placeholder="Capture your stream of consciousness..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="p-6 pb-20 text-lg font-medium !bg-transparent !border-none !rounded-none min-h-[140px] leading-relaxed resize-none h-auto placeholder:text-[var(--text-secondary)] placeholder:italic transition-all"
                />
                <div className="p-4 flex justify-between gap-4 items-center border-t border-[var(--border)]">
                    <span className="text-[10px] uppercase font-bold text-[var(--text-secondary)] tracking-widest pl-2">{content.length} chars</span>
                    <button
                        onClick={handleSave}
                        disabled={!content.trim()}
                        className={`w-12 h-12 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] flex items-center justify-center shadow-lg active:scale-90 transition-all ${!content.trim() ? 'opacity-20' : 'opacity-100'}`}
                    >
                        <Plus size={24} />
                    </button>
                </div>
            </div>

            {/* List */}
            <section className="flex flex-col gap-6">
                {store.brainDumps.length > 0 ? store.brainDumps.map(dump => (
                    <div key={dump.id} className="card group flex flex-col gap-6">
                        <div className="flex justify-between items-start">
                            <p className="text-lg font-medium leading-relaxed flex-1 pr-6">{dump.content}</p>
                            <div className="flex flex-col gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => deleteDump(dump.id)} className="p-2 text-[var(--text-secondary)] hover:text-red-500 transition-colors">
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between border-t border-[var(--border)] pt-5">
                            <div className="flex items-center gap-2">
                                <Zap size={12} className="text-orange-500" />
                                <span className="text-[10px] uppercase font-bold text-[var(--text-secondary)] tracking-[0.2em]">
                                    {new Date(dump.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                            <button
                                onClick={() => convertToTask(dump)}
                                className="flex items-center gap-2 py-2.5 px-5 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-full hover:bg-[var(--text-primary)] hover:text-[var(--bg-primary)] hover:border-transparent transition-all group/btn"
                            >
                                <span className="text-[11px] uppercase font-bold tracking-wider">Commit to Task</span>
                                <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </div>
                )) : (
                    <div className="p-16 text-center text-[var(--text-secondary)] italic text-lg border-2 border-dashed border-[var(--border)] rounded-3xl">
                        The stream is silent.
                    </div>
                )}
            </section>
        </div>
    );
};

export default BrainDumpPage;
