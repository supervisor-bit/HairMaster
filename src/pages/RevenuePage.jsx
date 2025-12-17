import { useState } from 'react';
import { useRevenue } from '../hooks/useRevenue';
import { useClients } from '../hooks/useClients';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { ReceiptModal } from '../components/ReceiptModal';

export function RevenuePage() {
    const { transactions, deleteTransaction, getDailyTotal, getMonthlyTotal } = useRevenue();
    const { clients } = useClients();
    const [filter, setFilter] = useState('');
    const [confirmDialog, setConfirmDialog] = useState(null);
    const [selectedReceipt, setSelectedReceipt] = useState(null);

    const todayTotal = getDailyTotal();
    const monthTotal = getMonthlyTotal();
    const allTotal = transactions.reduce((sum, t) => sum + Number(t.amount), 0);

    // Enrich transactions with client name resolution
    const enrichedTransactions = transactions.map(t => {
        const clientNameResult = t.clientName || (t.clientId ? clients.find(c => c.id === t.clientId)?.name : null) || 'Neregistrovaný';
        return { ...t, displayName: clientNameResult };
    });

    const filteredTransactions = enrichedTransactions.filter(t => {
        const search = filter.toLowerCase();
        return (
            t.displayName.toLowerCase().includes(search) || // Search by resolved name
            t.items?.toLowerCase().includes(search) ||
            t.amount.toString().includes(search)
        );
    });

    const handleDelete = (id) => {
        setConfirmDialog({
            message: 'Opravdu smazat tuto transakci? (Nevratná akce)',
            onConfirm: () => {
                deleteTransaction(id);
                setConfirmDialog(null);
            },
            onCancel: () => setConfirmDialog(null)
        });
    };

    const handleOpenReceipt = (t) => {
        // Pass the enriched transaction with correct name (mapped to clientName for modal)
        setSelectedReceipt({ ...t, clientName: t.displayName });
    };

    return (
        <div className="page-layout fade-in">
            <header className="page-header">
                <h2 className="mb-lg">Tržby a Historie</h2>
                <div className="grid-3">
                    <div className="card text-center" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white' }}>
                        <div style={{ fontSize: '0.9rem', marginBottom: '8px' }}>Dnes</div>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{todayTotal} Kč</div>
                    </div>
                    <div className="card text-center" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: 'white' }}>
                        <div style={{ fontSize: '0.9rem', marginBottom: '8px' }}>Tento měsíc</div>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{monthTotal} Kč</div>
                    </div>
                    <div className="card text-center" style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)', color: 'white' }}>
                        <div style={{ fontSize: '0.9rem', marginBottom: '8px' }}>Celkem</div>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{allTotal} Kč</div>
                    </div>
                </div>
            </header>

            <div className="content-area">
                <div className="card full-height-card">
                    <div className="card-header-area">
                        <div className="flex-between">
                            <h3>Transakce ({filteredTransactions.length})</h3>
                            <input
                                type="text"
                                placeholder="Hledat..."
                                value={filter}
                                onChange={e => setFilter(e.target.value)}
                                style={{
                                    padding: '8px 12px',
                                    borderRadius: '8px',
                                    border: '1px solid var(--border-color)',
                                    background: 'var(--bg-input)',
                                    color: 'var(--text-primary)',
                                    width: '200px'
                                }}
                            />
                        </div>
                    </div>

                    <div className="card-scroll-area">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th style={{ position: 'sticky', top: 0, background: 'var(--bg-card)' }}>Datum</th>
                                    <th style={{ position: 'sticky', top: 0, background: 'var(--bg-card)' }}>Zákazník</th>
                                    <th style={{ position: 'sticky', top: 0, background: 'var(--bg-card)' }}>Položky</th>
                                    <th style={{ position: 'sticky', top: 0, background: 'var(--bg-card)' }}>Typ</th>
                                    <th style={{ position: 'sticky', top: 0, background: 'var(--bg-card)', textAlign: 'right' }}>Částka</th>
                                    <th style={{ position: 'sticky', top: 0, background: 'var(--bg-card)', textAlign: 'right' }}>Akce</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTransactions.map(t => (
                                    <tr key={t.id} className="fade-in">
                                        <td style={{ whiteSpace: 'nowrap', fontSize: '0.9rem' }}>
                                            {new Date(t.date).toLocaleString()}
                                        </td>
                                        <td>{t.displayName}</td>
                                        <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {t.items}
                                        </td>
                                        <td>
                                            <span style={{
                                                padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem',
                                                background: t.method === 'cash' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                                                color: t.method === 'cash' ? '#34d399' : '#60a5fa'
                                            }}>
                                                {t.method === 'cash' ? 'Hotovost' : 'QR / Karta'}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                                            {t.amount} Kč
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <button
                                                onClick={() => handleOpenReceipt(t)}
                                                className="btn btn-ghost"
                                                title="Zobrazit účtenku"
                                                style={{ padding: '4px 8px', marginRight: '4px' }}
                                            >
                                                📄
                                            </button>
                                            <button
                                                onClick={() => handleDelete(t.id)}
                                                className="btn btn-ghost"
                                                title="Smazat"
                                                style={{ padding: '4px 8px', color: '#ef4444' }}
                                            >
                                                🗑
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {filteredTransactions.length === 0 && (
                                    <tr>
                                        <td colSpan="6" style={{ textAlign: 'center', padding: 'var(--spacing-xl)', color: 'var(--text-muted)' }}>
                                            Žádné transakce nenalezeny.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {confirmDialog && (
                <ConfirmDialog
                    message={confirmDialog.message}
                    onConfirm={confirmDialog.onConfirm}
                    onCancel={confirmDialog.onCancel}
                />
            )}

            {selectedReceipt && (
                <ReceiptModal
                    transaction={selectedReceipt}
                    onClose={() => setSelectedReceipt(null)}
                />
            )}
        </div>
    );
}

