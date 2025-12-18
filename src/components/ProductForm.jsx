import { useState, useEffect } from 'react';

export function ProductForm({ product, onSubmit, onCancel }) {
    const [formData, setFormData] = useState({
        name: '',
        brand: '',
        stock: '',
        description: '',
        packageSize: '',
        minStock: '',
        ean: '',
        category: 'other',
        unit: 'ks', // Changed default unit to 'ks'
        price: ''
    });

    useEffect(() => {
        if (product) {
            setFormData(product);
        } else {
            // Reset to default values when product is null (new product)
            setFormData({
                name: '',
                brand: '',
                stock: '',
                description: '',
                packageSize: '',
                minStock: '',
                ean: '',
                category: 'other',
                unit: 'ks', // Reset to 'ks' for new product
                price: ''
            });
        }
    }, [product]);

    const handleSubmit = (e, keepOpen = false) => {
        e.preventDefault();
        onSubmit(formData, keepOpen);

        if (keepOpen) {
            // Reset for next entry but keep context (Brand, Category, Unit...)
            setFormData(prev => ({
                ...prev,
                name: '',
                ean: '',
                stock: '',
                price: '',
                description: ''
            }));
            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    // Handler for unit change, potentially clearing packageSize if unit is 'ks'
    const handleUnitChange = (e) => {
        const newUnit = e.target.value;
        setFormData(prevData => ({
            ...prevData,
            unit: newUnit,
            // Clear packageSize if unit changes to 'ks'
            packageSize: newUnit === 'ks' ? '' : prevData.packageSize
        }));
    };

    return (
        <div className="page-layout fade-in">
            <header className="page-header">
                <div>
                    <h2 style={{ fontSize: '1.8rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '2rem' }}>■</span>
                        {product ? 'Upravit produkt' : 'Nový produkt'}
                    </h2>
                    <p className="text-muted">Vyplňte informace o produktu a skladových zásobách</p>
                </div>
            </header>

            <div className="content-area">
                <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
                    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 'var(--spacing-lg)' }}>

                        {/* Basic Info Section */}
                        <div>
                            <h3 style={{ fontSize: '1.1rem', marginBottom: 'var(--spacing-md)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span>ℹ️</span> Základní informace
                            </h3>
                            <div style={{ display: 'grid', gap: 'var(--spacing-md)' }}>
                                <div>
                                    <label style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        marginBottom: 'var(--spacing-sm)',
                                        color: 'var(--text-primary)',
                                        fontWeight: 600,
                                        fontSize: '0.9rem'
                                    }}>
                                        <span style={{ fontSize: '1.2rem' }}>▸</span>
                                        Název produktu *
                                    </label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="Např. Loreal Inoa 6.0"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        style={{
                                            width: '100%',
                                            padding: '12px 16px',
                                            borderRadius: '10px',
                                            border: '2px solid var(--border-color)',
                                            background: 'var(--bg-tertiary)',
                                            color: 'var(--text-primary)',
                                            fontSize: '1rem',
                                            transition: 'border-color 0.2s, box-shadow 0.2s'
                                        }}
                                        onFocus={(e) => {
                                            e.target.style.borderColor = 'var(--primary)';
                                            e.target.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.1)';
                                        }}
                                        onBlur={(e) => {
                                            e.target.style.borderColor = 'var(--border-color)';
                                            e.target.style.boxShadow = 'none';
                                        }}
                                    />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--spacing-md)' }}>
                                    <div style={{ gridColumn: 'span 2' }}> {/* Span 2 columns for category and unit */}
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                                            <div>
                                                <label style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.5rem',
                                                    marginBottom: 'var(--spacing-sm)',
                                                    color: 'var(--text-primary)',
                                                    fontWeight: 600,
                                                    fontSize: '0.9rem'
                                                }}>
                                                    <span style={{ fontSize: '1.2rem' }}>◆</span>
                                                    Kategorie
                                                </label>
                                                <select
                                                    value={formData.category}
                                                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                                                    style={{
                                                        width: '100%',
                                                        padding: '12px 16px',
                                                        borderRadius: '10px',
                                                        background: 'var(--bg-tertiary)',
                                                        border: '2px solid var(--border-color)',
                                                        color: 'var(--text-primary)',
                                                        fontSize: '1rem',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    <option value="other">Ostatní / Nerozlišeno</option>
                                                    <option value="color">Barva (Tuba)</option>
                                                    <option value="preliv">Přeliv (Demi-permanent)</option>
                                                    <option value="oxidant">Oxidant / Vyvíječ</option>
                                                    <option value="bleach">Melír (Prášek)</option>
                                                    <option value="care">Péče (Šampon/Kondicionér)</option>
                                                    <option value="styling">Styling</option>
                                                    <option value="supplies">Spotřební materiál (Rukavice/Fólie)</option>
                                                    <option value="retail">Prodej (Retail na doma)</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.5rem',
                                                    marginBottom: 'var(--spacing-sm)',
                                                    color: 'var(--text-primary)',
                                                    fontWeight: 600,
                                                    fontSize: '0.9rem'
                                                }}>
                                                    <span style={{ fontSize: '1.2rem' }}>▤</span>
                                                    Jednotka
                                                </label>
                                                <select
                                                    value={formData.unit}
                                                    onChange={handleUnitChange}
                                                    style={{
                                                        width: '100%',
                                                        padding: '12px 16px',
                                                        borderRadius: '10px',
                                                        background: 'var(--bg-tertiary)',
                                                        border: '2px solid var(--border-color)',
                                                        color: 'var(--text-primary)',
                                                        fontSize: '1rem',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    <option value="ks">Kusy (ks)</option>
                                                    <option value="g">Gramy (g)</option>
                                                    <option value="ml">Mililitry (ml)</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            marginBottom: 'var(--spacing-sm)',
                                            color: 'var(--text-primary)',
                                            fontWeight: 600,
                                            fontSize: '0.9rem'
                                        }}>
                                            <span style={{ fontSize: '1.2rem' }}>●</span>
                                            Značka
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Loreal, Matrix..."
                                            value={formData.brand}
                                            onChange={e => setFormData({ ...formData, brand: e.target.value })}
                                            style={{
                                                width: '100%',
                                                padding: '12px 16px',
                                                borderRadius: '10px',
                                                border: '2px solid var(--border-color)',
                                                background: 'var(--bg-tertiary)',
                                                color: 'var(--text-primary)',
                                                fontSize: '1rem'
                                            }}
                                        />
                                    </div>

                                    <div>
                                        <label style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            marginBottom: 'var(--spacing-sm)',
                                            color: 'var(--text-primary)',
                                            fontWeight: 600,
                                            fontSize: '0.9rem'
                                        }}>
                                            <span style={{ fontSize: '1.2rem' }}>•</span>
                                            EAN (Čárový kód)
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Naskenujte kód..."
                                            value={formData.ean}
                                            onChange={e => setFormData({ ...formData, ean: e.target.value })}
                                            style={{
                                                width: '100%',
                                                padding: '12px 16px',
                                                borderRadius: '10px',
                                                border: '2px solid var(--border-color)',
                                                background: 'var(--bg-tertiary)',
                                                color: 'var(--text-primary)',
                                                fontSize: '1rem'
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Stock Info Section */}
                        <div style={{ paddingTop: 'var(--spacing-md)', borderTop: '1px solid var(--border-color)' }}>
                            <h3 style={{ fontSize: '1.1rem', marginBottom: 'var(--spacing-md)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span>📊</span> Skladové zásoby
                            </h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--spacing-md)' }}>
                                <div>
                                    <label style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        marginBottom: 'var(--spacing-sm)',
                                        color: 'var(--text-primary)',
                                        fontWeight: 600,
                                        fontSize: '0.9rem'
                                    }}>
                                        <span style={{ fontSize: '1.2rem' }}>■</span>
                                        Skladové zásoby (ks)
                                    </label>
                                    <input
                                        type="number"
                                        placeholder="Např. 2"
                                        value={formData.stock ? Math.round(Number(formData.stock) * 100) / 100 : ''}
                                        onChange={e => setFormData({ ...formData, stock: e.target.value })}
                                        disabled={!!product} // Disable if editing existing product
                                        style={{
                                            width: '100%',
                                            padding: '12px 16px',
                                            borderRadius: '10px',
                                            border: '2px solid var(--border-color)',
                                            background: product ? 'var(--bg-secondary)' : 'var(--bg-tertiary)',
                                            color: product ? 'var(--text-muted)' : 'var(--text-primary)',
                                            fontSize: '1rem',
                                            cursor: product ? 'not-allowed' : 'text'
                                        }}
                                    />
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                        {product
                                            ? 'Pro změnu množství použijte "Naskladnit" nebo "Inventuru"'
                                            : 'Počáteční stav skladu'}
                                    </p>
                                </div>

                                <div>
                                    <label style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        marginBottom: 'var(--spacing-sm)',
                                        color: 'var(--text-primary)',
                                        fontWeight: 600,
                                        fontSize: '0.9rem'
                                    }}>
                                        <span style={{ fontSize: '1.2rem' }}>▲</span>
                                        Minimální limit (ks)
                                    </label>
                                    <input
                                        type="number"
                                        placeholder="Např. 2"
                                        value={formData.minStock}
                                        onChange={e => setFormData({ ...formData, minStock: e.target.value })}
                                        style={{
                                            width: '100%',
                                            padding: '12px 16px',
                                            borderRadius: '10px',
                                            border: '2px solid var(--border-color)',
                                            background: 'var(--bg-tertiary)',
                                            color: 'var(--text-primary)',
                                            fontSize: '1rem'
                                        }}
                                    />
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                        Upozornění při poklesu
                                    </p>
                                </div>

                                <div>
                                    <label style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        marginBottom: 'var(--spacing-sm)',
                                        color: 'var(--text-primary)',
                                        fontWeight: 600,
                                        fontSize: '0.9rem'
                                    }}>
                                        <span style={{ fontSize: '1.2rem' }}>▬</span>
                                        Velikost balení (g/ml)
                                    </label>
                                    <input
                                        type="number"
                                        placeholder="Např. 60"
                                        value={formData.packageSize}
                                        onChange={e => setFormData({ ...formData, packageSize: e.target.value })}
                                        style={{
                                            width: '100%',
                                            padding: '12px 16px',
                                            borderRadius: '10px',
                                            border: '2px solid var(--border-color)',
                                            background: 'var(--bg-tertiary)',
                                            color: 'var(--text-primary)',
                                            fontSize: '1rem'
                                        }}
                                    />
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                        Nechte prázdné pro kusové zboží
                                    </p>
                                    {(formData.unit === 'g' || formData.unit === 'ml') && (!formData.packageSize || Number(formData.packageSize) <= 0) && (
                                        <div style={{ marginTop: '8px', color: '#f59e0b', fontSize: '0.8rem', display: 'flex', gap: '6px', alignItems: 'flex-start', background: 'rgba(245, 158, 11, 0.1)', padding: '8px', borderRadius: '6px' }}>
                                            <span style={{ fontSize: '1rem' }}>⚠️</span>
                                            <span>
                                                <strong>Pozor:</strong> U jednotek <strong>{formData.unit}</strong> musíte vyplnit velikost balení, jinak se bude odečítat 1{formData.unit} = 1 kus ze skladu!
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Description Section */}
                        <div style={{ paddingTop: 'var(--spacing-md)', borderTop: '1px solid var(--border-color)' }}>
                            <label style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                marginBottom: 'var(--spacing-sm)',
                                color: 'var(--text-primary)',
                                fontWeight: 600,
                                fontSize: '0.9rem'
                            }}>
                                <span style={{ fontSize: '1.2rem' }}>✎</span>
                                Popis
                            </label>
                            <textarea
                                placeholder="Barva, odstín, složení, pokyny k použití..."
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    borderRadius: '10px',
                                    border: '2px solid var(--border-color)',
                                    background: 'var(--bg-tertiary)',
                                    color: 'var(--text-primary)',
                                    fontSize: '1rem',
                                    minHeight: '80px',
                                    resize: 'vertical',
                                    fontFamily: 'inherit'
                                }}
                            />
                        </div>

                        {/* Action Buttons */}
                        <div style={{
                            display: 'flex',
                            gap: 'var(--spacing-md)',
                            marginTop: 'var(--spacing-md)',
                            paddingTop: 'var(--spacing-md)',
                            borderTop: '1px solid var(--border-color)'
                        }}>
                            <button
                                type="button"
                                onClick={(e) => handleSubmit(e, false)}
                                className="btn btn-primary"
                                style={{ flex: 1, padding: '12px', fontSize: '1rem', fontWeight: 600 }}
                            >
                                ✓ Uložit produkt
                            </button>
                            {!product && (
                                <button
                                    type="button"
                                    onClick={(e) => handleSubmit(e, true)}
                                    className="btn btn-secondary"
                                    style={{ flex: 1, padding: '12px', fontSize: '1rem', border: '1px solid var(--primary)', color: 'var(--primary)', background: 'rgba(139, 92, 246, 0.1)' }}
                                >
                                    + Uložit a další
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={onCancel}
                                className="btn btn-secondary"
                                style={{ flex: 1, padding: '12px', fontSize: '1rem' }}
                            >
                                Zrušit
                            </button>
                        </div>
                    </form>
                </div>
            </div >
        </div >
    );
}
