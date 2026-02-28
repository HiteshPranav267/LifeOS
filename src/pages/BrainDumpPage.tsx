import { useState } from 'react';
import { useStore } from '../store/StoreContext.tsx';
import { Brain, Search, Trash2, Sparkles, AlertCircle, Bookmark, Archive, MessageSquare, Pencil } from 'lucide-react';
import type { BrainDump } from '../types';

const BrainDumpPage = () => {
    const { store, setBrainDumps, setTasks } = useStore();
    const [inputText, setInputText] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [editingDump, setEditingDump] = useState<BrainDump | null>(null);
    const [isEditing, setIsEditing] = useState(false);

    const sortedDumps = [...store.brainDumps]
        .filter(d => d.content.toLowerCase().includes(searchTerm.toLowerCase()))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const handleSave = () => {
        if (!inputText.trim()) return;

        if (editingDump) {
            setBrainDumps(store.brainDumps.map(d => (d.id === editingDump.id ? { ...d, content: inputText } : d)));
        } else {
            let type: BrainDump['type'] = 'reflection';
            const lower = inputText.toLowerCase();
            if (lower.startsWith('todo') || lower.startsWith('task')) type = 'task';
            if (lower.includes('idea')) type = 'idea';
            if (lower.includes('concern') || lower.includes('worry')) type = 'concern';

            setBrainDumps([...store.brainDumps, {
                id: crypto.randomUUID(),
                content: inputText,
                createdAt: new Date().toISOString(),
                type
            }]);
        }
        closeModal();
    };

    const closeModal = () => {
        setIsEditing(false);
        setEditingDump(null);
        setInputText('');
    };

    const openEdit = (dump: BrainDump) => {
        setEditingDump(dump);
        setInputText(dump.content);
        setIsEditing(true);
    };

    const deleteDump = (id: string) => {
        setBrainDumps(store.brainDumps.filter(d => d.id !== id));
    };

    const convertToTask = (dump: BrainDump) => {
        const title = dump.content.split('\n')[0].trim().replace(/^todo\s*:?\s*/i, '');
        setTasks([...store.tasks, {
            id: crypto.randomUUID(), title,
            category: 'Other', priority: 'medium', status: 'todo', effort: 'M',
            deadline: new Date().toISOString().split('T')[0],
            createdAt: new Date().toISOString()
        }]);
        setBrainDumps(store.brainDumps.filter(d => d.id !== dump.id));
    };

    const typeIcon = (type?: string) => {
        switch (type) {
            case 'task': return <AlertCircle size={12} className="text-red-400" />;
            case 'idea': return <Sparkles size={12} className="text-yellow-400" />;
            case 'concern': return <Archive size={12} className="text-blue-400" />;
            default: return <MessageSquare size={12} className="text-[var(--text-muted)]" />;
        }
    };

    return (
        <div className="flex flex-col gap-10">
            {/* Input Overlay / Main Input */}
            <div className={`card bg-[var(--bg-tertiary)]! border-none! transition-all duration-500 shadow-xl ${isEditing ? 'ring-2 ring-[var(--text-primary)] ring-offset-4 ring-offset-[var(--bg-primary)] scale-[1.02]' : ''}`}>
                <div className="flex items-center gap-3 mb-6">
                    <Brain size={18} className="text-[var(--text-primary)]" />
                    <span className="serif text-xl lowercase">{isEditing ? 'Refine Cognition' : 'Capture Thought'}</span>
                </div>
                <textarea
                    placeholder="Capture your stream of consciousness..."
                    className="w-full h-40 mb-4 bg-transparent border-none p-0 text-lg serif italic placeholder:opacity-20 focus:ring-0"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    autoFocus={isEditing}
                />
                <div className="flex justify-between items-center">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-[var(--text-muted)]">
                        {inputText.length} characters of insight
                    </span>
                    <div className="flex gap-4 items-center">
                        {isEditing && <button className="btn-ghost lowercase text-xs" onClick={closeModal}>Cancel</button>}
                        <button className="btn-pill" onClick={handleSave}>
                            {isEditing ? 'Archive Changes' : 'Stow Memory'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Past Entries */}
            <div>
                <div className="flex items-center gap-4 mb-8 border-b border-[var(--border)] pb-4">
                    <span className="section-label lowercase tracking-widest opacity-60">Archives of Cognition</span>
                    <div className="flex-1" />
                    <Search size={14} className="text-[var(--text-muted)]" />
                    <input
                        placeholder="Search archives..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="border-none p-0 text-[10px] uppercase font-bold tracking-widest w-40 focus:w-60 transition-all placeholder:text-[var(--text-muted)] focus:ring-0 bg-transparent"
                    />
                </div>

                <div className="flex flex-col gap-10">
                    {sortedDumps.length > 0 ? sortedDumps.map(dump => (
                        <div key={dump.id} className="group flex flex-col gap-4 pb-10 border-b border-[var(--border)] last:border-none hover:bg-[var(--bg-secondary)]/50 transition-colors rounded-xl px-4 -mx-4 py-6">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2 px-2.5 py-1 rounded-full border border-[var(--border)] text-[9px] font-bold uppercase tracking-widest opacity-60">
                                        {typeIcon(dump.type)}
                                        <span>{dump.type || 'reflection'}</span>
                                    </div>
                                    <span className="text-[10px] uppercase tracking-widest font-bold text-[var(--text-muted)]">
                                        {new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(dump.createdAt))}
                                    </span>
                                </div>
                                <div className="flex items-center gap-5 opacity-30 group-hover:opacity-100 transition-all duration-300">
                                    <button onClick={() => convertToTask(dump)} className="hover:text-white transform hover:scale-110 transition-all" title="Transform to Task">
                                        <Bookmark size={12} strokeWidth={2} />
                                    </button>
                                    <button onClick={() => openEdit(dump)} className="hover:text-white transform hover:scale-110 transition-all">
                                        <Pencil size={12} strokeWidth={2} />
                                    </button>
                                    <button onClick={() => deleteDump(dump.id)} className="hover:text-white transform hover:scale-110 transition-all">
                                        <Trash2 size={14} strokeWidth={2} />
                                    </button>
                                </div>
                            </div>
                            <p className="text-base serif italic leading-relaxed text-gray-300 opacity-90 whitespace-pre-wrap">{dump.content}</p>
                        </div>
                    )) : (
                        <div className="text-center py-24 opacity-30">
                            <p className="serif italic text-2xl lowercase">The archives are tranquil.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BrainDumpPage;
