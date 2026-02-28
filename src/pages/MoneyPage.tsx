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
                    <span className="text-[11px] uppercase tracking-[0.4em] font-bold text-neutral-600">Treasury</span>
                    <h1 className="serif mt-2">Capital.</h1>
                </div>
                <button
                    onClick={() => setIsAdding(true)}
                    className="w-14 h-14 rounded-full bg-white text-black flex items-center justify-center shadow-xl active:scale-90 transition-transform"
                >
                    <Plus size={24} />
                </button>
            </div>

            {/* Premium Balance Card */}
            <div className="card p-10 bg-white text-black flex flex-col items-center justify-center gap-4 relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                    <Wallet size={120} />
                </div>
                <span className="text-[11px] uppercase tracking-[0.3em] font-bold opacity-40">Available Balance</span>
                <p className="text-5xl font-semibold tracking-tighter">
                    ₹{totalBalance.toLocaleString('en-IN')}
                </p>
                <div className="flex gap-4 mt-4">
                    <div className="flex items-center gap-1.5 px-4 py-2 bg-black/5 rounded-full">
                        <ArrowDownLeft size={12} className="text-green-600" />
                        <span className="text-[11px] font-bold tracking-widest">+₹{totalIncome.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-4 py-2 bg-black/5 rounded-full">
                        <ArrowUpRight size={12} className="text-red-600" />
                        <span className="text-[11px] font-bold tracking-widest">-₹{totalExpense.toLocaleString('en-IN')}</span>
                    </div>
                </div>
            </div>

            {/* Transaction History */}
            <section>
                <div className="flex items-center justify-between mb-8">
                    <span className="section-label m-0 opacity-40">Archive</span>
                    <span className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest">{store.transactions.length} Total Records</span>
                </div>
                <div className="flex flex-col gap-3">
                    {sortedTx.length > 0 ? sortedTx.map((tx) => (
                        <div key={tx.id} className="card p-5 py-4 flex items-center justify-between group">
                            <div className="flex items-center gap-6" onClick={() => openEdit(tx)}>
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${tx.type === 'income' ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                                    {tx.type === 'income' ? <ArrowDownLeft size={20} className="text-green-500" /> : <ArrowUpRight size={20} className="text-red-500" />}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-base font-semibold">{tx.reason}</span>
                                    <span className="text-[10px] text-neutral-600 uppercase tracking-widest font-bold mt-1">
                                        {new Date(tx.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-8">
                                <span className={`text-lg font-semibold ${tx.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
                                    {tx.type === 'income' ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN')}
                                </span>
                                <div className="flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => deleteTx(tx.id)} className="p-2 hover:text-red-500">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )) : (
                        <div className="p-20 text-center opacity-30 italic serif text-xl lowercase border-2 border-dashed border-neutral-800 rounded-3xl">
                            The ledger is empty.
                        </div>
                    )}
                </div>
            </section>

            {isAdding && (
                <div className="modal-overlay">
                    <div className="modal-card">
                        <h3 className="text-2xl font-semibold mb-8">Record Transaction.</h3>
                        <div className="flex flex-col gap-8">
                            {/* Type Toggle */}
                            <div className="flex gap-4">
                                <button
                                    onClick={() => setTxType('expense')}
                                    className={`flex-1 py-4 rounded-2xl flex flex-col items-center gap-2 border-2 transition-all ${txType === 'expense' ? 'bg-red-500/5 border-red-500/20 text-red-500' : 'bg-neutral-900 border-transparent opacity-60'}`}
                                >
                                    <ArrowUpRight size={20} />
                                    <span className="text-[10px] uppercase font-bold tracking-widest">Expense</span>
                                </button>
                                <button
                                    onClick={() => setTxType('income')}
                                    className={`flex-1 py-4 rounded-2xl flex flex-col items-center gap-2 border-2 transition-all ${txType === 'income' ? 'bg-green-500/5 border-green-500/20 text-green-500' : 'bg-neutral-900 border-transparent opacity-60'}`}
                                >
                                    <ArrowDownLeft size={20} />
                                    <span className="text-[10px] uppercase font-bold tracking-widest">Income</span>
                                </button>
                            </div>

                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] uppercase tracking-widest font-bold opacity-30 mb-2">Amount (₹)</span>
                                <input
                                    type="number"
                                    placeholder="0.00"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="text-center text-4xl! font-semibold bg-transparent border-none p-0 h-auto"
                                    autoFocus
                                />
                            </div>

                            <input
                                placeholder="Describe the occasion..."
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                className="bg-neutral-900 border-none rounded-2xl"
                            />

                            <div className="flex gap-4 pt-4 border-t border-neutral-900">
                                <button className="btn-pill flex-1 bg-white text-black text-lg" onClick={handleSave}>
                                    {editingTx ? 'Confirm Edit' : 'Add Record'}
                                </button>
                                <button className="btn-pill bg-neutral-800 text-white" onClick={closeModal}>
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
