import { useState, useEffect } from 'react';
import { useVisits } from '../hooks/useVisits';
import { VisitForm } from './VisitForm';
import { ClientForm } from './ClientForm';
import { CheckoutModal } from './CheckoutModal';
import { useRevenue } from '../hooks/useRevenue';
import { useProducts } from '../hooks/useProducts';
import { ConfirmDialog } from '../components/ConfirmDialog';

export function ClientDetail({ client, onBack, onUpdateClient, initialStartVisit, initialNote }) {
    const { getVisitsByClient, addVisit, deleteVisit, updateVisit } = useVisits();
    const { transactions, addTransaction } = useRevenue();
    const { products, updateStock } = useProducts();
    const [view, setView] = useState('detail'); // 'detail', 'edit_client', 'new_visit'
    const [paymentVisit, setPaymentVisit] = useState(null); // Visit being paid for
    const [confirmDialog, setConfirmDialog] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [initialVisitData, setInitialVisitData] = useState(null);

    // Auto-start visit if requested via props (Bridge)
    useEffect(() => {
        if (initialStartVisit) {
            setInitialVisitData({
                globalNotes: initialNote || '',
                blocks: []
            });
            setView('new_visit');
        }
    }, [initialStartVisit, initialNote]);

    // Check if visit is paid


    const visits = getVisitsByClient(client.id);

    const filteredVisits = visits.filter(v => {
        if (!searchTerm) return true;
        const lower = searchTerm.toLowerCase();
        return (
            v.services?.toLowerCase().includes(lower) ||
            v.notes?.toLowerCase().includes(lower) ||
            v.usedProducts?.some(p => p.name.toLowerCase().includes(lower)) ||
            new Date(v.date).toLocaleDateString().includes(lower)
        );
    });

    const handleDuplicate = (visit) => {
        let blocksToUse = visit.blocks ? [...visit.blocks] : [];

        // 1. Fallback for Legacy Visits (no blocks stored)
        if (blocksToUse.length === 0 && visit.usedProducts && visit.usedProducts.length > 0) {
            // Filter out retail products from legacy list
            const nonRetailItems = visit.usedProducts.filter(p => !p.isRetail);

            if (nonRetailItems.length > 0) {
                // Smart Detection: Is this a color service?
                // We need to check categories. We can look up products by ID from the global 'products' list.
                let blockType = 'simple';
                let developerId = '';
                let itemsForBlock = [];

                const hasChemicals = nonRetailItems.some(item => {
                    const fullProduct = products.find(p => p.id === item.productId);
                    return fullProduct && ['color', 'bleach', 'oxidant'].includes(fullProduct.category);
                });

                if (hasChemicals) {
                    blockType = 'color';

                    // Try to extract developer to separate field
                    const devItem = nonRetailItems.find(item => {
                        const fullProduct = products.find(p => p.id === item.productId);
                        return fullProduct && fullProduct.category === 'oxidant';
                    });

                    if (devItem) {
                        developerId = devItem.productId;
                        // Add only non-oxidants to the main items list (developer is special field in color block)
                        itemsForBlock = nonRetailItems.filter(i => i.productId !== developerId).map(p => ({
                            productId: p.productId,
                            amount: Number(p.amount),
                            name: p.name,
                            unit: p.unit || 'ks'
                        }));
                    } else {
                        // No developer found, just map everything
                        itemsForBlock = nonRetailItems.map(p => ({
                            productId: p.productId,
                            amount: Number(p.amount),
                            name: p.name,
                            unit: p.unit || 'ks'
                        }));
                    }
                } else {
                    itemsForBlock = nonRetailItems.map(p => ({
                        productId: p.productId,
                        amount: Number(p.amount),
                        name: p.name,
                        unit: p.unit || 'ks'
                    }));
                }

                blocksToUse = [{
                    id: Date.now().toString(),
                    type: blockType,
                    name: visit.services || (blockType === 'color' ? 'Barvení' : 'Služba'),
                    items: itemsForBlock,
                    ratio: '1:1', // Default
                    developerId: developerId,
                    notes: ''
                }];
            }
        }

        // 2. Filter out Retail Blocks from Modern Visits
        blocksToUse = blocksToUse.filter(b => b.type !== 'retail');

        // 3. Regen IDs to avoid conflicts
        const cleanBlocks = blocksToUse.map((b, idx) => ({
            ...b,
            id: `dup_${Date.now()}_${idx}`, // Fresh ID
            items: b.items.map(i => ({ ...i })) // Deep copy items
        }));

        setInitialVisitData({
            blocks: cleanBlocks,
            globalNotes: visit.globalNotes || ''
        });
        setView('new_visit');
    };

    const handlePayment = (paymentData) => {
        addTransaction({
            clientId: client.id,
            clientName: client.name, // Added clientName explicitly
            visitId: paymentVisit.id,
            ...paymentData
        });
        setPaymentVisit(null);
    };

    const handleSaveVisit = (visitData) => {
        // 1. Add visit record
        addVisit(visitData);

        // 2. Deduct stock for used products
        visitData.usedProducts.forEach(item => {
            const product = products.find(p => p.id === item.productId);
            let amountToDeduct = item.amount;

            if (product && Number(product.packageSize) > 0 && !item.isRetail) {
                amountToDeduct = item.amount / product.packageSize;
            }
            updateStock(item.productId, -Math.abs(amountToDeduct), 'visit', `Návštěva: ${visitData.date} `);
        });

        setView('detail');
        setInitialVisitData(null);
    };

    const handleDeleteVisit = (visitId) => {
        setConfirmDialog({
            message: 'Opravdu smazat záznam o návštěvě? Naskladněné produkty budou vráceny na sklad.',
            onConfirm: () => {
                // Restore stock
                const visit = visits.find(v => v.id === visitId);
                if (visit && visit.usedProducts) {
                    visit.usedProducts.forEach(item => {
                        const product = products.find(p => p.id === item.productId);
                        let amountToRestore = Number(item.amount) || 0;

                        if (product && Number(product.packageSize) > 0 && !item.isRetail) {
                            amountToRestore = amountToRestore / Number(product.packageSize);
                        }

                        // Only update if amount > 0
                        if (amountToRestore > 0) {
                            updateStock(item.productId, Math.abs(amountToRestore), 'correction', `Storno návštěvy: ${new Date(visit.date).toLocaleDateString()}`);
                        }
                    });
                }

                deleteVisit(visitId);
                setConfirmDialog(null);
            },
            onCancel: () => setConfirmDialog(null)
        });
    };

    if (view === 'edit_client') {
        return <ClientForm
            client={client}
            onSubmit={(data) => { onUpdateClient({ ...client, ...data }); setView('detail'); }}
            onCancel={() => setView('detail')}
        />;
    }

    if (view === 'new_visit') {
        return <VisitForm
            client={client}
            initialData={initialVisitData}
            onSubmit={handleSaveVisit}
            onCancel={() => { setView('detail'); setInitialVisitData(null); }}
        />;
    }

    return (
        <div className="page-layout fade-in">
            <header className="page-header">
                <button onClick={onBack} className="btn btn-ghost mb-md" style={{ paddingLeft: 0 }}>
                    ← Zpět na seznam
                </button>

                <div className="card" style={{ padding: 'var(--spacing-lg)' }}>
                    <div className="flex-between">
                        <div>
                            <h2 style={{ fontSize: '2rem', marginBottom: 'var(--spacing-xs)' }}>{client.name}</h2>
                            <div className="text-muted">{client.phone} • {client.email}</div>
                        </div>
                        <button className="btn btn-ghost" onClick={() => setView('edit_client')}>Upravit údaje</button>
                    </div>
                    {client.notes && (
                        <div style={{ marginTop: 'var(--spacing-md)', padding: 'var(--spacing-md)', background: 'var(--bg-app)', borderRadius: 'var(--radius-md)' }}>
                            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Poznámky ke klientovi</div>
                            {client.notes}
                        </div>
                    )}
                </div>

                {/* Loyalty Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-md)' }}>
                    <div className="card" style={{ padding: 'var(--spacing-md)', textAlign: 'center', background: 'transparent', border: '1px solid var(--border-color)' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Celková útrata</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#10b981' }}>
                            {transactions.filter(t => t.clientId === client.id).reduce((sum, t) => sum + Number(t.amount), 0).toLocaleString()} Kč
                        </div>
                    </div>
                    <div className="card" style={{ padding: 'var(--spacing-md)', textAlign: 'center', background: 'transparent', border: '1px solid var(--border-color)' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Počet návštěv</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                            {visits.length}
                        </div>
                    </div>
                    <div className="card" style={{ padding: 'var(--spacing-md)', textAlign: 'center', background: 'transparent', border: '1px solid var(--border-color)' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Prům. útrata</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--accent)' }}>
                            {(visits.length > 0
                                ? (transactions.filter(t => t.clientId === client.id).reduce((sum, t) => sum + Number(t.amount), 0) / visits.length)
                                : 0).toLocaleString(undefined, { maximumFractionDigits: 0 })} Kč
                        </div>
                    </div>
                    <div className="card" style={{ padding: 'var(--spacing-md)', textAlign: 'center', background: 'transparent', border: '1px solid var(--border-color)' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Klientem od</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                            {visits.length > 0 ? new Date(Math.min(...visits.map(v => new Date(v.date)))).toLocaleDateString() : '-'}
                        </div>
                    </div>
                </div>
            </header>

            <div className="content-area">
                <div className="flex-between mb-lg" style={{ flexWrap: 'wrap', gap: '1rem' }}>
                    <h3>Historie návštěv ({visits.length})</h3>
                    <div style={{ display: 'flex', gap: 'var(--spacing-md)', flex: 1, justifyContent: 'flex-end', minWidth: '300px' }}>
                        <div style={{ position: 'relative', flex: 1, maxWidth: '300px' }}>
                            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>🔍</span>
                            <input
                                type="text"
                                placeholder="Hledat (datum, úkon, produkt, poznámka)..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '10px 10px 10px 36px',
                                    borderRadius: '20px',
                                    border: '1px solid var(--border-color)',
                                    background: 'var(--bg-tertiary)',
                                    color: 'var(--text-primary)',
                                    fontSize: '0.9rem'
                                }}
                            />
                        </div>
                        <button className="btn btn-primary" onClick={() => { setInitialVisitData(null); setView('new_visit'); }}>+ Nová návštěva</button>
                    </div>
                </div>

                <div style={{ display: 'grid', gap: 'var(--spacing-md)' }}>
                    {filteredVisits.map(visit => {
                        const transaction = transactions.find(t => t.visitId === visit.id);
                        const paid = !!transaction;
                        return (
                            <div key={visit.id} className="card" style={{ position: 'relative', borderLeft: paid ? '4px solid #10b981' : '4px solid transparent' }}>
                                <div style={{ position: 'absolute', top: 'var(--spacing-md)', right: 'var(--spacing-md)', display: 'flex', gap: '8px' }}>

                                    <button
                                        onClick={() => handleDuplicate(visit)}
                                        className="btn btn-ghost"
                                        style={{ padding: '4px 8px', fontSize: '0.9rem', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                                        title="Duplikovat (použít stejné produkty)"
                                    >
                                        📋
                                    </button>

                                    {!paid && (
                                        <button
                                            className="btn btn-primary"
                                            style={{ padding: '4px 12px', fontSize: '0.8rem', background: 'var(--accent)' }}
                                            onClick={() => setPaymentVisit(visit)}
                                        >
                                            Zaplatit
                                        </button>
                                    )}
                                    {paid && (
                                        <span style={{
                                            color: '#10b981', fontWeight: 'bold', fontSize: '0.9rem',
                                            display: 'flex', alignItems: 'center', gap: '4px',
                                            background: 'rgba(16, 185, 129, 0.1)', padding: '4px 12px', borderRadius: '4px',
                                            border: '1px solid rgba(16, 185, 129, 0.2)'
                                        }}>
                                            ✓ {transaction.amount} Kč
                                        </span>
                                    )}
                                    <button
                                        onClick={() => handleDeleteVisit(visit.id)}
                                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                                        title="Smazat záznam"
                                    >
                                        ✕
                                    </button>
                                </div>

                                <div style={{ display: 'flex', gap: 'var(--spacing-lg)' }}>
                                    <div style={{ minWidth: '100px', borderRight: '1px solid var(--border-color)', paddingRight: 'var(--spacing-md)' }}>
                                        <div style={{ fontWeight: 'bold' }}>{new Date(visit.date).toLocaleDateString()}</div>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 500, marginBottom: 'var(--spacing-sm)', paddingRight: '80px' }}>{visit.services}</div>

                                        {visit.usedProducts.length > 0 && (
                                            <div style={{ marginBottom: 'var(--spacing-sm)' }}>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Materiál:</div>
                                                <div style={{ display: 'flex', gap: 'var(--spacing-sm)', flexWrap: 'wrap' }}>
                                                    {visit.usedProducts.map((p, idx) => (
                                                        <span key={idx} className="badge" style={{ background: 'var(--bg-tertiary)' }}>{p.name} ({p.amount}x)</span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {visit.notes && (
                                            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                                                "{visit.notes}"
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    {filteredVisits.length === 0 && (
                        <div className="text-muted" style={{ textAlign: 'center', padding: 'var(--spacing-xl)' }}>
                            {searchTerm ? 'Žádné výsledky hledání.' : 'Zatím žádné návštěvy.'}
                        </div>
                    )}
                </div>
            </div>

            {paymentVisit && (
                <CheckoutModal
                    visit={paymentVisit}
                    client={client}
                    onConfirm={handlePayment}
                    onCancel={() => setPaymentVisit(null)}
                />
            )}

            {confirmDialog && (
                <ConfirmDialog
                    message={confirmDialog.message}
                    onConfirm={confirmDialog.onConfirm}
                    onCancel={confirmDialog.onCancel}
                />
            )}
        </div>
    );
}
