import { useState } from 'react';
import { useStore } from '../store/StoreContext.tsx';
import { Plus, ArrowUpRight, ArrowDownLeft, Trash2, Pencil } from 'lucide-react';
import type { Transaction } from '../types';

const MoneyPage = () => {
    const { store, setTransactions } = useStore();
    const [isAdding, setIsAdding] = useState(false);
    const [editingTx, setEditingTx] = useState<Transaction | null>(null);
    const [txType, setTxType] = useState<'income' | 'expense'>('expense');
    const [amount, setAmount] = useState('');
    const [reason, setReason] = useState('');

    const totalBalance = store.transactions.reduce((acc, t) => {
        return t.type === 'income' ? acc + t.amount : acc - t.amount;
    }, 0);

    const totalIncome = store.transactions
        .filter(t => t.type === 'income')
        .reduce((acc, t) => acc + t.amount, 0);

    const totalExpense = store.transactions
        .filter(t => t.type === 'expense')
        .reduce((acc, t) => acc + t.amount, 0);

    const handleSave = () => {
        const numAmount = parseFloat(amount);
        if (!numAmount || numAmount <= 0 || !reason.trim()) return;

        if (editingTx) {
            const updatedTx = store.transactions.map(t =>
                t.id === editingTx.id ? { ...t, type: txType, amount: numAmount, reason: reason.trim() } : t
            );
            setTransactions(updatedTx);
        } else {
            const tx: Transaction = {
                id: crypto.randomUUID(),
                type: txType,
                amount: numAmount,
                reason: reason.trim(),
                date: new Date().toISOString(),
            };
            setTransactions([...store.transactions, tx]);
        }
        closeModal();
    };

    const closeModal = () => {
        setIsAdding(false);
        setEditingTx(null);
        setAmount('');
        setReason('');
        setTxType('expense');
    };

    const openEdit = (tx: Transaction) => {
        setEditingTx(tx);
        setAmount(tx.amount.toString());
        setReason(tx.reason);
        setTxType(tx.type);
        setIsAdding(true);
    };

    const deleteTx = (id: string) => {
        setTransactions(store.transactions.filter(t => t.id !== id));
    };

    const sortedTx = [...store.transactions].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return (
        <div className="flex flex-col gap-10">
            {/* Balance Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card text-center py-10 flex flex-col items-center justify-center border-none bg-[var(--bg-secondary)] shadow-sm">
                    <span className="section-label lowercase tracking-widest opacity-60">Available Capital</span>
                    <p className="serif mt-4 text-5xl font-light tracking-tight" style={{
                        color: totalBalance >= 0 ? 'var(--text-primary)' : '#ef4444'
                    }}>
                        ₹{totalBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </p>
                </div>

                <div className="card py-8 border-none bg-green-500/5 group">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <ArrowDownLeft size={18} className="text-green-500" />
                        </div>
                        <span className="section-label lowercase tracking-widest opacity-60" style={{ marginBottom: 0 }}>Inflow</span>
                    </div>
                    <p className="serif text-2xl font-medium tracking-tight text-green-500/80">
                        +₹{totalIncome.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </p>
                </div>

                <div className="card py-8 border-none bg-red-500/5 group">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <ArrowUpRight size={18} className="text-red-500" />
                        </div>
                        <span className="section-label lowercase tracking-widest opacity-60" style={{ marginBottom: 0 }}>Outflow</span>
                    </div>
                    <p className="serif text-2xl font-medium tracking-tight text-red-500/80">
                        -₹{totalExpense.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </p>
                </div>
            </div>

            {/* Controls */}
            <div className="flex justify-center -mt-4">
                <button className="btn-pill px-10!" onClick={() => setIsAdding(true)}>
                    <Plus size={16} /> Record Transaction
                </button>
            </div>

            {/* History */}
            <section>
                <span className="section-label">Archive of Transactions</span>
                <div className="flex flex-col mt-6 rounded-2xl overflow-hidden border border-[var(--border)] shadow-sm">
                    {sortedTx.length > 0 ? sortedTx.map((tx) => (
                        <div
                            key={tx.id}
                            className="flex items-center justify-between px-8 py-5 group hover:bg-[var(--bg-tertiary)] transition-all bg-[var(--bg-secondary)]"
                            style={{ borderBottom: '1px solid var(--border)' }}
                        >
                            <div className="flex items-center gap-6">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.type === 'income' ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                                    {tx.type === 'income'
                                        ? <ArrowDownLeft size={18} className="text-green-500" />
                                        : <ArrowUpRight size={18} className="text-red-500" />
                                    }
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-semibold text-gray-200">{tx.reason}</span>
                                    <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest font-bold mt-1">
                                        {new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(tx.date))}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-8">
                                <span className={`serif font-normal text-xl ${tx.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                                    {tx.type === 'income' ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN')}
                                </span>
                                <div className="flex items-center gap-4 opacity-30 group-hover:opacity-100 transition-all duration-300">
                                    <button onClick={() => openEdit(tx)} className="hover:text-white transform hover:scale-110 transition-transform">
                                        <Pencil size={12} strokeWidth={2} />
                                    </button>
                                    <button onClick={() => deleteTx(tx.id)} className="hover:text-white transform hover:scale-110 transition-transform">
                                        <Trash2 size={14} strokeWidth={2} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )) : (
                        <div className="text-center py-24 bg-[var(--bg-secondary)] opacity-40">
                            <p className="serif italic text-2xl">Ledger is empty.</p>
                        </div>
                    )}
                </div>
            </section>

            {/* Modal */}
            {isAdding && (
                <div className="modal-overlay">
                    <div className="modal-card">
                        <h3>{editingTx ? 'Refine Transaction' : 'Record Transaction'}</h3>
                        <div className="flex flex-col gap-8">
                            {/* Type Toggle */}
                            <div className="flex rounded-full overflow-hidden border border-[var(--border)] p-1 bg-[var(--bg-tertiary)]">
                                <button
                                    onClick={() => setTxType('expense')}
                                    className={`flex-1 py-3 text-[10px] uppercase tracking-widest font-bold transition-all rounded-full ${txType === 'expense' ? 'bg-red-500/20 text-red-400 shadow-sm' : 'text-[var(--text-muted)]'}`}
                                >
                                    Outflow
                                </button>
                                <button
                                    onClick={() => setTxType('income')}
                                    className={`flex-1 py-3 text-[10px] uppercase tracking-widest font-bold transition-all rounded-full ${txType === 'income' ? 'bg-green-500/20 text-green-400 shadow-sm' : 'text-[var(--text-muted)]'}`}
                                >
                                    Inflow
                                </button>
                            </div>

                            <div className="flex flex-col gap-1">
                                <span className="section-label">Amount (₹)</span>
                                <input
                                    type="number"
                                    placeholder="0.00"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="serif text-center text-5xl! border-none p-0 focus:ring-0 active:ring-0 placeholder:opacity-20 bg-transparent underline decoration-dotted decoration-[var(--border)]"
                                    autoFocus
                                />
                            </div>

                            <div className="flex flex-col gap-1">
                                <span className="section-label">Label / Occasion</span>
                                <input
                                    placeholder="Describe the transaction..."
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    className="text-center p-0 border-none italic placeholder:opacity-40"
                                />
                            </div>

                            <div className="flex justify-end gap-6 pt-4 border-t border-[var(--border)]">
                                <button className="btn-ghost lowercase" onClick={closeModal}>Stow Ledger</button>
                                <button className="btn-pill" onClick={handleSave}>
                                    {editingTx ? 'Archive Changes' : 'Record Transaction'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MoneyPage;
