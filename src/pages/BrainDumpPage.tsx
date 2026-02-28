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
                    <span className="text-[11px] uppercase tracking-[0.4em] font-bold text-neutral-600">Cognition</span>
                    <h1 className="serif mt-2">The Stream.</h1>
                </div>
                <div className="w-10 h-10 rounded-full bg-neutral-900 flex items-center justify-center opacity-40">
                    <Brain size={20} />
                </div>
            </div>

            {/* Input Engine */}
            <div className="card p-0 overflow-hidden bg-neutral-900/10 border-none shadow-sm group">
                <textarea
                    placeholder="Capture your stream of consciousness..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="p-8 pb-32 text-xl font-medium !bg-transparent !border-none !rounded-none min-h-[160px] leading-relaxed resize-none h-auto placeholder:opacity-30 placeholder:italic transition-all"
                />
                <div className="p-4 flex justify-between gap-4 items-center">
                    <span className="text-[10px] uppercase font-bold text-neutral-600 tracking-widest pl-4">{content.length} Characters Captured</span>
                    <button
                        onClick={handleSave}
                        disabled={!content.trim()}
                        className={`w-14 h-14 rounded-full bg-white text-black flex items-center justify-center shadow-xl active:scale-90 transition-all ${!content.trim() ? 'opacity-20 translate-y-4' : 'opacity-100 translate-y-0'}`}
                    >
                        <Plus size={24} />
                    </button>
                </div>
            </div>

            {/* List Stream */}
            <section className="flex flex-col gap-6">
                {store.brainDumps.length > 0 ? store.brainDumps.map(dump => (
                    <div key={dump.id} className="card p-8 group flex flex-col gap-8 interactive-card">
                        <div className="flex justify-between items-start">
                            <p className="text-xl font-medium leading-relaxed flex-1 pr-6">{dump.content}</p>
                            <div className="flex flex-col gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => deleteDump(dump.id)} className="p-2 text-neutral-600 hover:text-red-500">
                                    <Trash2 size={24} />
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between border-t border-neutral-800 pt-6">
                            <div className="flex items-center gap-3">
                                <div className="w-6 h-6 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center">
                                    <Zap size={10} className="text-orange-500" />
                                </div>
                                <span className="text-[10px] uppercase font-bold text-neutral-600 tracking-[0.2em]">
                                    Captured {new Date(dump.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                            <button
                                onClick={() => convertToTask(dump)}
                                className="flex items-center gap-3 py-2 px-5 bg-neutral-900 rounded-full hover:bg-white hover:text-black transition-all group/btn"
                            >
                                <span className="text-[10px] uppercase font-bold tracking-widest">Commit to Task</span>
                                <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </div>
                )) : (
                    <div className="p-20 text-center opacity-30 italic serif text-xl lowercase border-2 border-dashed border-neutral-800 rounded-3xl">
                        The stream is silent.
                    </div>
                )}
            </section>
        </div>
    );
};

export default BrainDumpPage;
