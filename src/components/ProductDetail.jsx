import { useProducts } from '../hooks/useProducts';

export function ProductDetail({ product, onEdit, onBack }) {
    const { getHistory } = useProducts();
    const history = getHistory(product.id);

    const isLow = product.minStock
        ? Number(product.stock) <= Number(product.minStock)
        : Number(product.stock) < 1;

    return (
        <div className="page-layout fade-in">
            <header className="page-header">
                <button onClick={onBack} className="btn btn-ghost" style={{ paddingLeft: 0, marginBottom: 'var(--spacing-md)' }}>
                    ← Zpět na seznam
                </button>

                <div className="card" style={{ borderLeft: isLow ? '4px solid #ef4444' : '4px solid transparent' }}>
                    <div className="flex-between">
                        <div>
                            <div className="text-muted" style={{ fontSize: '0.9rem', marginBottom: '4px' }}>
                                {product.brand} • {product.category === 'color' ? 'Barva' : product.category === 'developer' ? 'Vyvíječ' : 'Produkt'}
                            </div>
                            <h2 style={{ fontSize: '2rem', marginBottom: 'var(--spacing-sm)' }}>{product.name}</h2>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                {product.ean && (
                                    <span style={{ background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem', fontFamily: 'monospace' }}>
                                        EAN: {product.ean}
                                    </span>
                                )}
                                <span className={`badge`}
                                    style={{
                                        background: isLow ? 'rgba(239, 68, 68, 0.2)' : 'rgba(74, 222, 128, 0.2)',
                                        color: isLow ? '#ef4444' : '#4ade80',
                                        fontWeight: 'bold'
                                    }}>
                                    Skladem: {product.stock} ks
                                </span>
                            </div>
                        </div>
                        <button className="btn btn-primary" onClick={onEdit}>
                            ✏️ Upravit
                        </button>
                    </div>

                    <div style={{ marginTop: 'var(--spacing-lg)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-xl)' }}>
                        <div>
                            <label className="text-muted" style={{ display: 'block', marginBottom: '4px', fontSize: '0.8rem' }}>Popis</label>
                            <div>{product.description || 'Bez popisu'}</div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                            <div>
                                <label className="text-muted" style={{ display: 'block', marginBottom: '4px', fontSize: '0.8rem' }}>Velikost balení</label>
                                <div>{product.packageSize ? `${product.packageSize} g/ml` : 'Kusové'}</div>
                            </div>
                            <div>
                                <label className="text-muted" style={{ display: 'block', marginBottom: '4px', fontSize: '0.8rem' }}>Minimální limit</label>
                                <div>{product.minStock || 'Standard (0)'} ks</div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <div className="content-area">
                <div className="card full-height-card">
                    <div className="card-header-area">
                        <h3>Historie pohybů</h3>
                    </div>

                    <div className="card-scroll-area">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th style={{ position: 'sticky', top: 0, background: 'var(--bg-card)' }}>Datum</th>
                                    <th style={{ position: 'sticky', top: 0, background: 'var(--bg-card)' }}>Typ</th>
                                    <th style={{ position: 'sticky', top: 0, background: 'var(--bg-card)' }}>Množství</th>
                                    <th style={{ position: 'sticky', top: 0, background: 'var(--bg-card)' }}>Poznámka</th>
                                </tr>
                            </thead>
                            <tbody>
                                {history.map(h => (
                                    <tr key={h.id}>
                                        <td style={{ whiteSpace: 'nowrap' }}>{new Date(h.date).toLocaleString()}</td>
                                        <td>
                                            <span style={{
                                                padding: '2px 8px',
                                                borderRadius: '4px',
                                                fontSize: '0.8rem',
                                                background: h.type === 'import' ? 'rgba(16, 185, 129, 0.1)' :
                                                    h.type === 'sale' ? 'rgba(59, 130, 246, 0.1)' :
                                                        h.type === 'consumption' ? 'rgba(245, 158, 11, 0.1)' :
                                                            'rgba(148, 163, 184, 0.1)',
                                                color: h.type === 'import' ? '#10b981' :
                                                    h.type === 'sale' ? '#3b82f6' :
                                                        h.type === 'consumption' ? '#f59e0b' :
                                                            '#94a3b8'
                                            }}>
                                                {h.type === 'import' ? '▲ Naskladnění' :
                                                    h.type === 'sale' ? '▼ Prodej' :
                                                        h.type === 'consumption' ? '● Spotřeba' :
                                                            h.type === 'visit' ? '✂ Návštěva' : h.type}
                                            </span>
                                        </td>
                                        <td style={{
                                            fontWeight: 'bold',
                                            color: h.count > 0 ? '#10b981' : '#ef4444'
                                        }}>
                                            {h.count > 0 ? '+' : ''}{h.count} ks
                                        </td>
                                        <td style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{h.note || '-'}</td>
                                    </tr>
                                ))}
                                {history.length === 0 && (
                                    <tr>
                                        <td colSpan="4" style={{ textAlign: 'center', padding: 'var(--spacing-xl)', color: 'var(--text-muted)' }}>
                                            Zatím žádné pohyby
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
