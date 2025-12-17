import { useState } from 'react';

const CATEGORY_LABELS = {
    color: { label: 'Barva', color: '#e879f9', bg: '#fae8ff' },
    oxidant: { label: 'Oxidant', color: '#60a5fa', bg: '#dbeafe' },
    bleach: { label: 'Melír', color: '#facc15', bg: '#fef9c3' },
    care: { label: 'Péče', color: '#4ade80', bg: '#dcfce7' },
    styling: { label: 'Styling', color: '#fb923c', bg: '#ffedd5' },
    supplies: { label: 'Spotřební', color: '#94a3b8', bg: '#f1f5f9' },
    retail: { label: 'Prodej', color: '#f472b6', bg: '#fce7f3' },
    other: { label: 'Ostatní', color: '#94a3b8', bg: '#f8fafc' }
};

export function ProductList({ products, onEdit, onDelete, onRestock, onLowStockFilter }) {
    const [search, setSearch] = useState('');
    const [filterCategory, setFilterCategory] = useState('all'); // 'all', 'color', 'developer', 'other'
    const [showLowStockOnly, setShowLowStockOnly] = useState(false);

    const filtered = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.brand?.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = filterCategory === 'all' || p.category === filterCategory;

        let matchesStock = true;
        if (showLowStockOnly) {
            matchesStock = p.minStock
                ? Number(p.stock) <= Number(p.minStock)
                : Number(p.stock) < 1;
        }

        return matchesSearch && matchesCategory && matchesStock;
    });

    return (

        <div className="card full-height-card fade-in">
            <div className="card-header-area" style={{ display: 'flex', gap: 'var(--spacing-md)', flexWrap: 'wrap' }}>
                <input
                    type="text"
                    placeholder="Hledat produkt..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={{
                        flex: 1,
                        padding: 'var(--spacing-sm)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-color)',
                        background: 'var(--bg-tertiary)',
                        color: 'var(--text-primary)',
                        minWidth: '200px'
                    }}
                />
                <select
                    value={filterCategory}
                    onChange={e => setFilterCategory(e.target.value)}
                    style={{
                        padding: 'var(--spacing-sm)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-color)',
                        background: 'var(--bg-tertiary)',
                        color: 'var(--text-primary)'
                    }}
                >
                    <option value="all">Všechny kategorie</option>
                    <option value="color">Barvy</option>
                    <option value="oxidant">Oxidanty</option>
                    <option value="bleach">Melíry</option>
                    <option value="care">Péče</option>
                    <option value="styling">Styling</option>
                    <option value="supplies">Spotřební</option>
                    <option value="retail">Prodej</option>
                    <option value="other">Ostatní</option>
                </select>
                <button
                    className={`btn ${showLowStockOnly ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setShowLowStockOnly(!showLowStockOnly)}
                    style={{ background: showLowStockOnly ? '#ef4444' : undefined, border: showLowStockOnly ? 'none' : undefined }}
                >
                    {showLowStockOnly ? '⚠️ Zobrazit vše' : '⚠️ Pod limitem'}
                </button>
            </div>

            <div className="card-scroll-area">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th style={{ position: 'sticky', top: 0, background: 'var(--bg-card)', zIndex: 10 }}>Produkt</th>
                            <th style={{ position: 'sticky', top: 0, background: 'var(--bg-card)', zIndex: 10 }}>Značka</th>
                            <th style={{ textAlign: 'center', position: 'sticky', top: 0, background: 'var(--bg-card)', zIndex: 10 }}>Sklad</th>
                            <th style={{ textAlign: 'right', position: 'sticky', top: 0, background: 'var(--bg-card)', zIndex: 10 }}>Akce</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map(product => {
                            const isLow = product.minStock
                                ? Number(product.stock) <= Number(product.minStock)
                                : Number(product.stock) < 1;

                            return (
                                <tr key={product.id}
                                    style={{
                                        cursor: 'pointer',
                                        background: isLow ? 'rgba(239, 68, 68, 0.1)' : undefined,
                                        borderLeft: isLow ? '4px solid #ef4444' : '4px solid transparent'
                                    }}
                                    onClick={() => onEdit(product)}
                                >
                                    <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                                        <div className="font-medium" style={{ fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            {product.name}
                                            {product.category && CATEGORY_LABELS[product.category] && (
                                                <span style={{
                                                    fontSize: '0.7rem',
                                                    padding: '2px 8px',
                                                    borderRadius: '12px',
                                                    backgroundColor: CATEGORY_LABELS[product.category].bg,
                                                    color: CATEGORY_LABELS[product.category].color,
                                                    fontWeight: 600,
                                                    border: `1px solid ${CATEGORY_LABELS[product.category].color}40`
                                                }}>
                                                    {CATEGORY_LABELS[product.category].label}
                                                </span>
                                            )}
                                        </div>
                                        <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                            {product.brand} {product.ean && `• EAN: ${product.ean}`}
                                        </div>
                                    </td>
                                    <td className="text-muted">{product.brand}</td>
                                    <td style={{ textAlign: 'center' }}>
                                        <span className={`badge`}
                                            style={{
                                                background: isLow ? 'rgba(239, 68, 68, 0.2)' : 'rgba(74, 222, 128, 0.2)',
                                                color: isLow ? '#ef4444' : '#4ade80'
                                            }}>
                                            {Number(product.packageSize) > 0 ? (
                                                <>
                                                    {Number(Number(product.stock).toFixed(2))} ks
                                                    <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>
                                                        ({(Number(product.stock) * Number(product.packageSize)).toFixed(0)}{product.unit || 'g'})
                                                    </span>
                                                </>
                                            ) : (
                                                `${Number(Number(product.stock).toFixed(2))} ${product.unit || 'ks'}`
                                            )}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onDelete(product.id); }}
                                            className="btn btn-ghost"
                                            style={{ padding: '0.25rem 0.5rem', color: '#f87171' }}
                                            title="Smazat"
                                        >
                                            🗑
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                        {filtered.length === 0 && (
                            <tr>
                                <td colSpan={4} style={{ textAlign: 'center', padding: 'var(--spacing-xl)', color: 'var(--text-muted)' }}>
                                    Žádné produkty nenalezeny.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>

    );
}
