import { useState } from 'react';
import { useStore } from '../store/StoreContext.tsx';
import { Plus, ArrowUpRight, ArrowDownLeft, Trash2, Wallet } from 'lucide-react';
import type { Transaction } from '../types';

const MoneyPage = () => {
    const { store, setTransactions } = useStore();
    const [isAdding, setIsAdding] = useState(false);
    const [editingTx, setEditingTx] = useState<Transaction | null>(null);
    const [txType, setTxType] = useState<'income' | 'expense'>('expense');
    const [amount, setAmount] = useState('');
    const [reason, setReason] = useState('');

    const totalBalance = store.transactions.reduce((acc, t) => t.type === 'income' ? acc + t.amount : acc - t.amount, 0);
    const totalIncome = store.transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const totalExpense = store.transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);

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
        <div className="flex flex-col gap-10 max-w-2xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <span className="text-[11px] uppercase tracking-[0.4em] font-bold text-[var(--text-secondary)]">Treasury</span>
                    <h1 className="text-3xl font-bold mt-2">Capital.</h1>
                </div>
                <button
                    onClick={() => setIsAdding(true)}
                    className="w-14 h-14 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] flex items-center justify-center shadow-lg active:scale-90 transition-transform"
                >
                    <Plus size={24} />
                </button>
            </div>

            {/* Balance Card */}
            <div className="card p-8 bg-[var(--bg-elevated)] border border-[var(--border)] flex flex-col items-center justify-center gap-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                    <Wallet size={100} />
                </div>
                <span className="text-[11px] uppercase tracking-[0.3em] font-bold text-[var(--text-secondary)]">Available Balance</span>
                <p className="text-5xl font-semibold tracking-tighter">
                    ₹{totalBalance.toLocaleString('en-IN')}
                </p>
                <div className="flex gap-4 mt-4">
                    <div className="flex items-center gap-1.5 px-4 py-2.5 bg-green-500/10 border border-green-500/20 rounded-full">
                        <ArrowDownLeft size={12} className="text-green-500" />
                        <span className="text-[11px] font-bold tracking-widest text-green-500">+₹{totalIncome.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-4 py-2.5 bg-red-500/10 border border-red-500/20 rounded-full">
                        <ArrowUpRight size={12} className="text-red-500" />
                        <span className="text-[11px] font-bold tracking-widest text-red-500">-₹{totalExpense.toLocaleString('en-IN')}</span>
                    </div>
                </div>
            </div>

            {/* Transactions */}
            <section>
                <div className="flex items-center justify-between mb-6">
                    <span className="section-label !mb-0">History</span>
                    <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">{store.transactions.length} records</span>
                </div>
                <div className="flex flex-col gap-3">
                    {sortedTx.length > 0 ? sortedTx.map((tx) => (
                        <div key={tx.id} className="card flex items-center justify-between group">
                            <div className="flex items-center gap-5 cursor-pointer" onClick={() => openEdit(tx)}>
                                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${tx.type === 'income' ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                                    {tx.type === 'income' ? <ArrowDownLeft size={18} className="text-green-500" /> : <ArrowUpRight size={18} className="text-red-500" />}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-semibold">{tx.reason}</span>
                                    <span className="text-[10px] text-[var(--text-secondary)] uppercase tracking-widest font-bold mt-0.5">
                                        {new Date(tx.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                <span className={`text-base font-semibold ${tx.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
                                    {tx.type === 'income' ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN')}
                                </span>
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => deleteTx(tx.id)} className="p-2 hover:text-red-500 transition-colors">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )) : (
                        <div className="p-16 text-center text-[var(--text-secondary)] italic text-lg border-2 border-dashed border-[var(--border)] rounded-3xl">
                            No transactions yet.
                        </div>
                    )}
                </div>
            </section>

            {isAdding && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-card" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-semibold mb-6">Record Transaction</h3>
                        <div className="flex flex-col gap-5">
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setTxType('expense')}
                                    className={`flex-1 py-4 rounded-2xl flex flex-col items-center gap-2 border-2 transition-all ${txType === 'expense' ? 'bg-red-500/10 border-red-500/30 text-red-500' : 'bg-[var(--bg-elevated)] border-transparent text-[var(--text-secondary)]'}`}
                                >
                                    <ArrowUpRight size={20} />
                                    <span className="text-[10px] uppercase font-bold tracking-widest">Expense</span>
                                </button>
                                <button
                                    onClick={() => setTxType('income')}
                                    className={`flex-1 py-4 rounded-2xl flex flex-col items-center gap-2 border-2 transition-all ${txType === 'income' ? 'bg-green-500/10 border-green-500/30 text-green-500' : 'bg-[var(--bg-elevated)] border-transparent text-[var(--text-secondary)]'}`}
                                >
                                    <ArrowDownLeft size={20} />
                                    <span className="text-[10px] uppercase font-bold tracking-widest">Income</span>
                                </button>
                            </div>

                            <div className="flex flex-col gap-1">
                                <span className="text-xs text-[var(--text-secondary)] font-medium px-1">Amount (₹)</span>
                                <input
                                    type="number"
                                    placeholder="0.00"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="text-center text-3xl! font-semibold"
                                    autoFocus
                                />
                            </div>

                            <input
                                placeholder="What's this for?"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                            />

                            <div className="flex gap-3 pt-2">
                                <button className="flex-1 h-12 bg-[var(--text-primary)] text-[var(--bg-primary)] rounded-xl font-semibold active:scale-95 transition-transform" onClick={handleSave}>
                                    {editingTx ? 'Update' : 'Add'}
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

export default MoneyPage;
