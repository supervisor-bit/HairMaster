import { useState, useEffect, useRef } from 'react';
import { useProducts } from '../hooks/useProducts';
import { useToast } from '../components/Toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function OrderPage() {
    const { products } = useProducts();
    const { addToast } = useToast();
    const [items, setItems] = useState([]); // { name, count }
    const [inputVal, setInputVal] = useState('');

    const loadLowStock = () => {
        const lowStockItems = [];

        products.forEach(p => {
            const min = Number(p.minStock);
            const current = Number(p.stock);

            // Logic: If minStock is set and current <= min, order enough to reach min + buffer?
            // User requested: "vygenerovalo objednavku s minimalnich zasob"
            // Let's interpret as: Order items that are below min.
            // Quantity? Maybe just 1 or difference to min?
            // Let's order (Min - Current) + 1 to be safe, or just 1 if not specified.
            // Actually, usually you want to stock up. Let's say target is Min + 2 or just simple "1".
            // Let's default to: (Min * 2) - Current. If (Min*2 - Current) < 1, set 1.
            // Or simpler: just list them with qty 1 and let user adjust.

            if (min > 0 && current <= min) {
                // If I have 1 and min is 2. I need 1 to reach min. Maybe order 2 to be safe.
                // Let's try: Target = Min + 2. Order = Target - Current.
                const target = min + 2;
                const toOrder = Math.max(1, target - current);

                lowStockItems.push({
                    id: p.id,
                    name: p.name,
                    brand: p.brand,
                    count: toOrder
                });
            } else if (!min && current < 1) {
                // No min stock set, but 0 stock.
                lowStockItems.push({
                    id: p.id,
                    name: p.name,
                    brand: p.brand,
                    count: 1
                });
            }
        });

        if (lowStockItems.length === 0) {
            addToast('Všechny produkty jsou nad limitem.', 'info');
            return;
        }

        // Merge with existing manual items? Or replace?
        // Let's append unique ones.
        const newItems = [...items];
        lowStockItems.forEach(newItem => {
            if (!newItems.find(i => i.id === newItem.id)) {
                newItems.push(newItem);
            }
        });

        setItems(newItems);
    };

    const handleManualAdd = (e) => {
        e.preventDefault();
        const trimmed = inputVal.trim();
        if (!trimmed) return;

        setItems(prev => [...prev, { id: Date.now(), name: trimmed, count: 1, isManual: true }]);
        setInputVal('');
    };

    const updateCount = (index, val) => {
        const newItems = [...items];
        newItems[index].count = Number(val);
        setItems(newItems);
    };

    const removeItem = (index) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const copyToClipboard = () => {
        const text = items.map(i => `- ${i.count}x ${i.name} ${i.brand ? `(${i.brand})` : ''}`).join('\n');
        navigator.clipboard.writeText(`Objednávka:\n${text}`);
        addToast('Objednávka zkopírována do schránky! 📋', 'success');
    };

    const exportToPDF = () => {
        const doc = new jsPDF();

        // Title
        doc.setFontSize(20);
        doc.text("Objednávka produktů", 14, 22);

        // Date
        doc.setFontSize(10);
        doc.text(`Datum: ${new Date().toLocaleDateString()}`, 14, 30);

        const tableData = items.map(item => [
            item.name,
            item.brand || '',
            item.count
        ]);

        autoTable(doc, {
            head: [['Produkt', 'Značka', 'Množství']],
            body: tableData,
            startY: 40,
            styles: { fontSize: 10 },
            headStyles: { fillColor: [79, 70, 229] } // Indigo-600
        });

        doc.save(`objednavka_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    const [showSuggestions, setShowSuggestions] = useState(false);
    const [suggestions, setSuggestions] = useState([]);

    // Filter suggestions
    useEffect(() => {
        if (!inputVal || inputVal.length < 2) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        const lower = inputVal.toLowerCase();
        const matches = products.filter(p =>
            p.name.toLowerCase().includes(lower) ||
            p.brand?.toLowerCase().includes(lower)
        ).slice(0, 5);

        setSuggestions(matches);
        setShowSuggestions(matches.length > 0);
    }, [inputVal, products]);

    const addItem = (product) => {
        setItems(prev => {
            if (prev.find(i => i.id === product.id)) {
                return prev.map(i => i.id === product.id ? { ...i, count: i.count + 1 } : i);
            }
            return [...prev, {
                id: product.id,
                name: product.name,
                brand: product.brand,
                count: 1
            }];
        });
        setInputVal('');
        setShowSuggestions(false);
    };


    const listRef = useRef(null);

    // Auto-scroll
    useEffect(() => {
        if (listRef.current) {
            listRef.current.scrollTop = listRef.current.scrollHeight;
        }
    }, [items]);

    return (
        <div className="page-layout fade-in">
            <header className="page-header">
                <h2 className="mb-lg">Objednávky</h2>
            </header>
            <div className="content-area">
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(300px, 1fr) 1.5fr',
                    gap: 'var(--spacing-xl)',
                    flex: 1,
                    overflow: 'hidden',
                    height: '100%',
                    padding: '0 var(--spacing-xl) var(--spacing-xl) var(--spacing-xl)'
                }}>

                    {/* LEFT SLOT: INPUTS & ACTIONS */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)', overflowY: 'auto', paddingRight: '4px' }}>

                        {/* 1. Add Item Card */}
                        <div className="card">
                            <h3 className="mb-md">Přidat položku</h3>
                            <form onSubmit={handleManualAdd} style={{ display: 'grid', gap: 'var(--spacing-md)' }}>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type="text"
                                        value={inputVal}
                                        onChange={e => setInputVal(e.target.value)}
                                        placeholder="Název produktu..."
                                        style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                                    />
                                    {showSuggestions && (
                                        <div style={{
                                            position: 'absolute', top: '100%', left: 0, right: 0,
                                            background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                                            borderRadius: '8px', zIndex: 10, marginTop: '4px',
                                            boxShadow: 'var(--shadow-lg)', maxHeight: '200px', overflowY: 'auto'
                                        }}>
                                            {suggestions.map(p => (
                                                <div
                                                    key={p.id}
                                                    style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-glass)', cursor: 'pointer' }}
                                                    onClick={() => addItem(p)}
                                                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                                >
                                                    <div style={{ fontWeight: 500 }}>{p.name}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <button type="submit" className="btn btn-secondary" style={{ justifySelf: 'start' }}>+ Přidat ručně</button>
                            </form>
                        </div>

                        {/* 2. Bulk Actions */}
                        <div className="card">
                            <h3 className="mb-md">Hromadné akce</h3>
                            <div style={{ display: 'grid', gap: 'var(--spacing-sm)' }}>
                                <button className="btn btn-secondary" onClick={loadLowStock} style={{ justifyContent: 'center' }}>
                                    📥 Načíst zboží pod limitem
                                </button>
                                {items.length > 0 && (
                                    <button className="btn btn-ghost" onClick={() => setItems([])} style={{ color: '#ef4444', justifyContent: 'center' }}>
                                        🗑 Smazat seznam
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* 3. Export Actions */}
                        {items.length > 0 && (
                            <div className="card" style={{ background: 'var(--bg-tertiary)' }}>
                                <h3 className="mb-md">Export objednávky</h3>
                                <div style={{ display: 'grid', gap: 'var(--spacing-sm)' }}>
                                    <button className="btn btn-primary" onClick={exportToPDF} style={{ justifyContent: 'center' }}>
                                        📄 Generovat PDF
                                    </button>
                                    <button className="btn btn-secondary" onClick={copyToClipboard} style={{ justifyContent: 'center' }}>
                                        📋 Kopírovat do schránky
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* RIGHT SLOT: LIST */}
                    <div className="card full-height-card" style={{ display: 'flex', flexDirection: 'column' }}>
                        <div className="card-header-area flex-between">
                            <h3>Seznam položek ({items.reduce((acc, i) => acc + Number(i.count), 0)} ks)</h3>
                            <div className="text-muted" style={{ fontSize: '0.9rem' }}>
                                {items.length} typů produktů
                            </div>
                        </div>

                        <div className="card-scroll-area" ref={listRef} style={{ background: 'var(--bg-tertiary)' }}>
                            {items.length > 0 ? (
                                <div style={{ display: 'grid', gap: '8px' }}>
                                    {items.map((item, idx) => (
                                        <div key={item.id || idx} className="card fade-in" style={{
                                            display: 'flex', alignItems: 'center', gap: '12px',
                                            padding: '8px 12px',
                                            borderLeft: item.isManual ? '4px solid #fcd34d' : '4px solid var(--accent)'
                                        }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                <input
                                                    type="number"
                                                    value={item.count}
                                                    onChange={e => updateCount(idx, e.target.value)}
                                                    style={{ width: '60px', padding: '6px', textAlign: 'center', fontWeight: 'bold', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                                                />
                                            </div>

                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 500 }}>{item.name}</div>
                                                {item.brand && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.brand}</div>}
                                            </div>

                                            <button
                                                onClick={() => removeItem(idx)}
                                                style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#ef4444', padding: '4px' }}
                                                title="Odebrat z objednávky"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-muted" style={{ textAlign: 'center', marginTop: '40px', padding: '20px' }}>
                                    <div>📦</div>
                                    <div style={{ marginTop: '10px' }}>Seznam je prázdný.</div>
                                    <div style={{ fontSize: '0.8rem', marginTop: '4px' }}>Použijte panel vlevo pro přidání položek.</div>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
