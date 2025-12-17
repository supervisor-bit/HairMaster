
import { useState, useMemo } from 'react';
import { useProducts } from '../hooks/useProducts';
import { useToast } from '../components/Toast';

export function StocktakePage() {
    const { products, updateStock, loading } = useProducts();
    const { addToast } = useToast();
    const [search, setSearch] = useState('');
    const [actualCounts, setActualCounts] = useState({}); // { productId: number }
    const [saving, setSaving] = useState(false);

    // Calculate derived state
    const inventoryData = useMemo(() => {
        return products
            .filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
            .sort((a, b) => a.name.localeCompare(b.name))
            .map(p => {
                const currentStock = Number(p.stock) || 0;
                const actual = actualCounts[p.id] !== undefined ? actualCounts[p.id] : '';
                // Fix floating point errors by rounding to 2 decimals
                const diff = actual !== '' ? Number((Number(actual) - currentStock).toFixed(2)) : 0;

                return {
                    ...p,
                    currentStock: Number(currentStock.toFixed(2)),
                    actual,
                    diff
                };
            });
    }, [products, search, actualCounts]);

    const handleCountChange = (id, value) => {
        setActualCounts(prev => ({
            ...prev,
            [id]: value
        }));
    };

    const handleQuickFill = () => {
        if (!confirm('Chcete automaticky vyplnit "Fyzický stav" podle "Systémového stavu" u všech položek, které ještě nemají zadáno číslo?')) return;

        const updates = {};
        inventoryData.forEach(item => {
            if (item.actual === '') {
                updates[item.id] = item.currentStock;
            }
        });
        setActualCounts(prev => ({ ...prev, ...updates }));
    };

    const handleSave = async () => {
        const itemsToUpdate = inventoryData.filter(item => item.actual !== '' && item.diff !== 0);

        if (itemsToUpdate.length === 0) {
            addToast('Žádné rozdíly k uložení.', 'info');
            return;
        }

        if (!confirm(`Opravdu chcete uložit inventuru? Bude provedeno ${itemsToUpdate.length} korekcí skladu.`)) return;

        setSaving(true);
        try {
            // Process sequentially to be safe, or could updateStock handle parallel?
            // updateStock uses transactions/batches internally but we should be careful not to spam too fast if separate calls.
            // For now, simple loop.
            let count = 0;
            for (const item of itemsToUpdate) {
                await updateStock(item.id, item.diff, 'correction', `Inventura: Fyzicky ${item.actual} ${item.unit} (Systém ${item.currentStock})`);
                count++;
            }
            addToast(`Inventura dokončena. ${count} položek aktualizováno.`, 'success');
            setActualCounts({}); // Reset form
        } catch (error) {
            console.error(error);
            addToast('Chyba při ukládání: ' + error.message, 'error');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-4">Načítám sklad...</div>;

    return (
        <div className="page-layout fade-in">
            <header className="page-header">
                <div>
                    <h2 style={{ fontSize: '1.8rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '2rem' }}>📋</span>
                        Inventura
                    </h2>
                    <p className="text-muted">Kontrola fyzického stavu zásob</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                        className="btn btn-secondary"
                        onClick={handleQuickFill}
                        title="Doplní všude aktuální stav ze systému (pro rychlou kontrolu)"
                    >
                        ⚡ Předvyplnit shodou
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={handleSave}
                        disabled={saving}
                    >
                        {saving ? 'Ukládám...' : '✓ Potvrdit rozdíly'}
                    </button>
                </div>
            </header>

            <div className="card full-height-card">
                <div className="card-header-area">
                    <input
                        type="text"
                        placeholder="Hledat produkt..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{
                            padding: '10px',
                            borderRadius: '8px',
                            border: '1px solid var(--border-color)',
                            background: 'var(--bg-input)',
                            color: 'var(--text-primary)',
                            width: '100%',
                            maxWidth: '400px'
                        }}
                    />
                </div>

                <div className="card-scroll-area">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th style={{ position: 'sticky', top: 0, background: 'var(--bg-card)', zIndex: 10 }}>Produkt</th>
                                <th style={{ position: 'sticky', top: 0, background: 'var(--bg-card)', zIndex: 10, width: '120px', textAlign: 'center' }}>Systém</th>
                                <th style={{ position: 'sticky', top: 0, background: 'var(--bg-card)', zIndex: 10, width: '140px', textAlign: 'center' }}>Fyzicky</th>
                                <th style={{ position: 'sticky', top: 0, background: 'var(--bg-card)', zIndex: 10, width: '100px', textAlign: 'center' }}>Rozdíl</th>
                            </tr>
                        </thead>
                        <tbody>
                            {inventoryData.map(item => (
                                <tr key={item.id} style={{
                                    background: item.actual !== '' && item.diff !== 0
                                        ? (item.diff < 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)')
                                        : 'transparent'
                                }}>
                                    <td>
                                        <div style={{ fontWeight: 500 }}>{item.name}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                            {item.brand} • {item.packageSize ? `${item.packageSize}${item.unit}` : item.unit}
                                        </div>
                                    </td>
                                    <td style={{ textAlign: 'center', fontSize: '1.1rem', fontWeight: 500 }}>
                                        {item.currentStock}
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <input
                                            type="number"
                                            value={item.actual}
                                            onChange={(e) => handleCountChange(item.id, e.target.value)}
                                            className="noscroll"
                                            placeholder="?"
                                            style={{
                                                width: '80px',
                                                padding: '8px',
                                                borderRadius: '8px',
                                                border: item.actual !== '' && item.diff !== 0 ? '2px solid var(--accent)' : '1px solid var(--border-color)',
                                                background: 'var(--bg-tertiary)',
                                                color: 'var(--text-primary)',
                                                textAlign: 'center',
                                                fontSize: '1.1rem',
                                                fontWeight: 600
                                            }}
                                        />
                                    </td>
                                    <td style={{ textAlign: 'center', fontWeight: 'bold' }}>
                                        {item.actual !== '' ? (
                                            <span style={{
                                                color: item.diff === 0 ? 'var(--text-muted)' : (item.diff < 0 ? '#ef4444' : '#22c55e')
                                            }}>
                                                {item.diff > 0 ? '+' : ''}{item.diff}
                                            </span>
                                        ) : '-'}
                                    </td>
                                </tr>
                            ))}
                            {inventoryData.length === 0 && (
                                <tr>
                                    <td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                                        Nic nenalezeno.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
