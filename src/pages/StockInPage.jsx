import { useState, useRef, useEffect } from 'react';
import { useProducts } from '../hooks/useProducts';
import { useToast } from '../components/Toast';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { ProductForm } from '../components/ProductForm';

export function StockInPage() {
    const { products, addProduct, updateStock } = useProducts();
    const { addToast } = useToast();
    const [inputVal, setInputVal] = useState('');
    const [items, setItems] = useState([]); // Array of { product, count }
    // "Unknown Product" modal state
    const [showCreateProduct, setShowCreateProduct] = useState(false);
    const [pendingEan, setPendingEan] = useState('');
    // Confirmation dialog
    const [confirmDialog, setConfirmDialog] = useState(null);
    const [unknownName, setUnknownName] = useState('');
    // "Manual Select" state
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [suggestions, setSuggestions] = useState([]);

    const inputRef = useRef(null);

    // Filter suggestions based on input
    useEffect(() => {
        if (!inputVal || inputVal.length < 2) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        const lower = inputVal.toLowerCase();
        // Check if input looks like EAN (digits only, length > 5) to avoid searching names
        const isEanPotential = /^\d{5,}$/.test(inputVal);

        if (isEanPotential) {
            setShowSuggestions(false); // Don't suggest names if typing a barcode
            return;
        }

        const matches = products.filter(p =>
            p.name.toLowerCase().includes(lower) ||
            p.brand?.toLowerCase().includes(lower)
        ).slice(0, 5); // Limit to 5

        setSuggestions(matches);
        setShowSuggestions(matches.length > 0);

    }, [inputVal, products]);


    const handleScanOrSubmit = (e) => {
        e.preventDefault();
        processInput(inputVal);
    };

    const processInput = (val) => {
        const trimmed = val.trim();
        if (!trimmed) return;

        // 1. Try find by EAN
        const byEan = products.find(p => p.ean === trimmed);
        if (byEan) {
            addItem(byEan);
            setInputVal('');
            return;
        }

        // 2. Try strict name match (if they typed exact name)
        const byName = products.find(p => p.name.toLowerCase() === trimmed.toLowerCase());
        if (byName) {
            addItem(byName);
            setInputVal('');
            return;
        }

        // 3. Not found -> Check if Barcode or Name
        const isBarcode = /^\d+$/.test(trimmed) && trimmed.length > 3;

        if (isBarcode) {
            setPendingEan(trimmed);
            setUnknownName('');
            setShowCreateProduct(true);
            setInputVal('');
        } else {
            // Treat as new Name
            setConfirmDialog({
                message: `Produkt "${trimmed}" nenalezen. Chcete jej založit?`,
                onConfirm: () => {
                    setUnknownName(trimmed);
                    setPendingEan('');
                    setShowCreateProduct(true);
                    setInputVal('');
                    setConfirmDialog(null);
                },
                onCancel: () => {
                    setInputVal('');
                    setConfirmDialog(null);
                }
            });
        }
    };

    const addItem = (product, quantity = 1) => {
        setItems(prev => {
            const existing = prev.find(i => i.product.id === product.id);
            if (existing) {
                return prev.map(i => i.product.id === product.id ? { ...i, count: i.count + quantity } : i);
            }
            return [{ product, count: quantity }, ...prev];
        });
    };

    const handleCreateProduct = (productData) => {
        const initialStock = Number(productData.stock) || 0;

        // Create product with 0 stock to avoid double counting
        // The stock will be added via the commit transaction
        const newProduct = addProduct({
            ...productData,
            stock: 0,
            ean: productData.ean || pendingEan
        });

        // Use entered stock as the count for this receipt
        addItem(newProduct, initialStock > 0 ? initialStock : 1);

        setShowCreateProduct(false);
        setPendingEan('');
        setUnknownName('');
        // Focus back
        setTimeout(() => inputRef.current?.focus(), 100);
    };

    const handleCommit = () => {
        const totalCount = items.reduce((acc, i) => acc + i.count, 0);
        setConfirmDialog({
            message: `Naskladnit ${totalCount} položek?`,
            onConfirm: () => {
                items.forEach(item => {
                    updateStock(item.product.id, item.count, 'import', 'Rychlý příjem zboží');
                });
                setItems([]);
                addToast('Naskladněno!', 'success');
                inputRef.current?.focus();
                setConfirmDialog(null);
            },
            onCancel: () => setConfirmDialog(null)
        });
    };


    const listRef = useRef(null);

    // Auto-scroll on new items
    useEffect(() => {
        if (listRef.current) {
            listRef.current.scrollTop = listRef.current.scrollHeight;
        }
    }, [items]);

    return (
        <div className="page-layout fade-in">
            <header className="page-header">
                <h2 className="mb-lg">Rychlý příjem zboží</h2>
            </header>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(300px, 1fr) 1.5fr',
                gap: 'var(--spacing-xl)',
                flex: 1,
                overflow: 'hidden',
                padding: '0 var(--spacing-xl) var(--spacing-xl) var(--spacing-xl)' // Added padding
            }}>

                {/* LEFT: SCANNER INPUT */}
                <div style={{ overflowY: 'auto', paddingBottom: 'var(--spacing-xl)' }}>
                    <div className="card" style={{ padding: 'var(--spacing-lg)', border: '1px solid var(--primary)' }}>
                        <div className="flex-between" style={{ marginBottom: '8px' }}>
                            <label className="text-muted">
                                Naskenujte EAN nebo hledejte název
                            </label>
                            <button
                                tabIndex={-1} // Don't steal focus by default
                                className="btn btn-ghost"
                                style={{ fontSize: '0.8rem', padding: '2px 8px' }}
                                onClick={() => {
                                    setUnknownName('');
                                    setUnknownEan('');
                                    setShowCreateModal(true);
                                }}
                            >
                                + Ručně
                            </button>
                        </div>
                        <form onSubmit={handleScanOrSubmit} style={{ position: 'relative' }}>
                            <input
                                ref={inputRef}
                                autoFocus
                                type="text"
                                value={inputVal}
                                onChange={e => setInputVal(e.target.value)}
                                placeholder="Píp..."
                                style={{
                                    width: '100%',
                                    fontSize: '1.5rem',
                                    padding: '16px',
                                    borderRadius: '12px',
                                    border: '2px solid var(--primary)',
                                    background: 'rgba(99, 102, 241, 0.1)',
                                    color: 'var(--text-primary)',
                                    outline: 'none'
                                }}
                            />
                            {/* SUGGESTIONS DROPDOWN */}
                            {showSuggestions && (
                                <div style={{
                                    position: 'absolute', top: '100%', left: 0, right: 0,
                                    background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                                    borderRadius: '8px', zIndex: 10, marginTop: '4px',
                                    boxShadow: 'var(--shadow-lg)'
                                }}>
                                    {suggestions.map(p => (
                                        <div
                                            key={p.id}
                                            style={{ padding: '12px', borderBottom: '1px solid var(--border-glass)', cursor: 'pointer' }}
                                            onClick={() => {
                                                addItem(p);
                                                setInputVal('');
                                                setShowSuggestions(false);
                                                inputRef.current?.focus();
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <div style={{ fontWeight: 500 }}>{p.name}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                {p.brand} • Skladem: {Number(p.stock).toFixed(2)} ks
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <div className="text-muted" style={{ marginTop: '16px', fontSize: '0.9rem' }}>
                                💡 Tip: Funguje i bez čtečky. Začněte psát název produktu a vyberte ho ze seznamu.
                            </div>
                        </form>
                    </div>
                </div>

                {/* RIGHT: LIST */}
                <div className="card full-height-card" style={{ display: 'flex', flexDirection: 'column' }}>
                    <div className="card-header-area">
                        <div className="flex-between mb-md">
                            <h3>Položky k naskladnění ({items.length})</h3>
                            {items.length > 0 && (
                                <button onClick={handleCommit} className="btn btn-primary" style={{ padding: '12px 24px', fontSize: '1.1rem' }}>
                                    Naskladnit vše
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="card-scroll-area" ref={listRef} style={{ background: 'var(--bg-tertiary)' }}>
                        <div style={{ display: 'grid', gap: '8px' }}>
                            {items.map((item, idx) => (
                                <div key={idx} className="card fade-in" style={{ padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontWeight: 500 }}>{item.product.name}</div>
                                        <div className="text-muted" style={{ fontSize: '0.8rem' }}>
                                            {item.product.brand} {item.product.ean ? `• ${item.product.ean}` : ''}
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                                            Skladem: {Number(item.product.stock).toFixed(2)} ks
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <button
                                            className="btn btn-secondary"
                                            onClick={() => setItems(items.map((i, ii) => ii === idx ? { ...i, count: Math.max(1, i.count - 1) } : i))}
                                        >-</button>
                                        <span style={{ fontSize: '1.2rem', fontWeight: 'bold', minWidth: '30px', textAlign: 'center' }}>
                                            {item.count}
                                        </span>
                                        <button
                                            className="btn btn-secondary"
                                            onClick={() => setItems(items.map((i, ii) => ii === idx ? { ...i, count: i.count + 1 } : i))}
                                        >+</button>
                                        <button
                                            onClick={() => setItems(items.filter((_, ii) => ii !== idx))}
                                            style={{ background: 'none', border: 'none', marginLeft: '8px', cursor: 'pointer' }}
                                        >
                                            🗑
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {items.length === 0 && (
                                <div className="text-muted" style={{ textAlign: 'center', padding: '40px', border: '2px dashed var(--border-color)', borderRadius: '12px' }}>
                                    Zatím prázdno. <br />
                                    Naskenujte kód nebo vyhledejte produkt.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* CREATE MODAL */}
            {showCreateProduct && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)', zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backdropFilter: 'blur(5px)'
                }}>
                    <div style={{ width: '100%', maxWidth: '600px' }}>
                        <div className="card mb-md" style={{ background: '#fef3c7', color: '#92400e', border: '1px solid #f59e0b' }}>
                            {pendingEan ? (
                                <>⚠️ Čárový kód <strong>{pendingEan}</strong> nebyl nalezen. Založte prosím produkt.</>
                            ) : (
                                <>⚠️ Produkt <strong>{unknownName}</strong> neexistuje. Založte jej prosím.</>
                            )}
                        </div>
                        <ProductForm
                            product={{ ean: pendingEan, name: unknownName }}
                            onSubmit={handleCreateProduct}
                            onCancel={() => { setShowCreateProduct(false); setPendingEan(''); setUnknownName(''); }}
                        />
                    </div>
                </div>
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
