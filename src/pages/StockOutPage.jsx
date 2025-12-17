import { useState, useRef, useEffect } from 'react';
import { useProducts } from '../hooks/useProducts';
import { useRevenue } from '../hooks/useRevenue';
import { CheckoutModal } from '../components/CheckoutModal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useToast } from '../components/Toast';

export function StockOutPage() {
    const { products, updateStock } = useProducts();
    const { addTransaction } = useRevenue();
    const { addToast } = useToast();

    const [inputVal, setInputVal] = useState('');
    const [items, setItems] = useState([]); // { product, count, price }

    // UI Logic
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [suggestions, setSuggestions] = useState([]);

    // Checkout State
    const [showCheckout, setShowCheckout] = useState(false);

    // Confirmation dialogs
    const [confirmDialog, setConfirmDialog] = useState(null);

    const inputRef = useRef(null);

    // --- SEARCH / SCAN LOGIC (Similar to StockIn) ---
    useEffect(() => {
        if (!inputVal || inputVal.length < 2) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }
        const lower = inputVal.toLowerCase();
        const isEanPotential = /^\d{5,}$/.test(inputVal);

        if (isEanPotential) {
            setShowSuggestions(false);
            return;
        }

        const matches = products.filter(p =>
            p.name.toLowerCase().includes(lower) ||
            p.brand?.toLowerCase().includes(lower)
        ).slice(0, 5);

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

        // 1. EAN
        const byEan = products.find(p => p.ean === trimmed);
        if (byEan) {
            addItem(byEan);
            setInputVal('');
            return;
        }

        // 2. Exact Name
        const byName = products.find(p => p.name.toLowerCase() === trimmed.toLowerCase());
        if (byName) {
            addItem(byName);
            setInputVal('');
            return;
        }

        // 3. Not Found
        // For StockOut, we probably don't create products. Just alert.
        addToast('Produkt nenalezen. Pro výdej musí produkt existovat.', 'error');
    };

    const addItem = (product) => {
        setItems(prev => {
            const existing = prev.find(i => i.product.id === product.id);
            if (existing) {
                return prev.map(i => i.product.id === product.id ? { ...i, count: i.count + 1 } : i);
            }
            // Default price 0 since we removed prices.
            return [{ product, count: 1, price: '' }, ...prev];
        });
    };

    const updateItemPrice = (index, newPrice) => {
        setItems(prev => prev.map((item, idx) => idx === index ? { ...item, price: newPrice } : item));
    };

    // --- ACTIONS ---

    const handleConsume = () => {
        setConfirmDialog({
            message: 'Vydat položky jako spotřebu (materiál na práci)?',
            onConfirm: () => {
                items.forEach(item => {
                    updateStock(item.product.id, -item.count, 'consumption', 'Výdej na práci');
                });
                setItems([]);
                addToast('Vydáno ze skladu (Spotřeba).', 'success');
                inputRef.current?.focus();
                setConfirmDialog(null);
            },
            onCancel: () => setConfirmDialog(null)
        });
    };

    const handleSellStart = () => {
        const total = items.reduce((sum, item) => sum + (Number(item.price) * item.count), 0);
        if (total === 0) {
            setConfirmDialog({
                message: 'Celková částka je 0 Kč. Pokračovat v prodeji?',
                onConfirm: () => {
                    setShowCheckout(true);
                    setConfirmDialog(null);
                },
                onCancel: () => setConfirmDialog(null)
            });
        } else {
            setShowCheckout(true);
        }
    };

    const handlePaymentConfirm = (paymentData) => {
        // 1. Deduct Stock
        items.forEach(item => {
            updateStock(item.product.id, -item.count, 'sale', 'Prodej na pokladně');
        });

        // 2. Record Transaction
        addTransaction({
            type: 'retail',
            amount: paymentData.amount,
            method: paymentData.method,
            items: items.map(i => `${i.count}x ${i.product.name}`).join(', '),
            clientName: 'Prodej na pokladně' // Or maybe "Retail Customer"
        });

        setItems([]);
        setShowCheckout(false);
        addToast('Prodej dokončen!', 'success');
        inputRef.current?.focus();
    };

    const totalSum = Number(items.reduce((sum, item) => sum + (Number(item.price) * item.count), 0).toFixed(2));

    const listRef = useRef(null);

    // Auto-scroll logic
    useEffect(() => {
        if (listRef.current) {
            listRef.current.scrollTop = listRef.current.scrollHeight;
        }
    }, [items]);

    return (
        <div className="page-layout fade-in">
            <header className="page-header">
                <h2 className="mb-lg">Pokladna / Výdej</h2>
            </header>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(300px, 1fr) 1.5fr',
                gap: 'var(--spacing-xl)',
                flex: 1,
                overflow: 'hidden',
                padding: '0 var(--spacing-xl) var(--spacing-xl) var(--spacing-xl)' // Added padding
            }}>

                {/* LEFT: SCANNER */}
                <div style={{ overflowY: 'auto', paddingBottom: 'var(--spacing-xl)' }}>
                    <div className="card" style={{ padding: 'var(--spacing-lg)', border: '1px solid var(--accent)', position: 'sticky', top: 0 }}>
                        <label className="text-muted" style={{ display: 'block', marginBottom: '8px' }}>
                            Naskenujte produkt pro výdej
                        </label>
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
                                    background: 'var(--bg-hover)',
                                    color: 'var(--text-primary)',
                                    outline: 'none'
                                }}
                            />
                            {/* SUGGESTIONS */}
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
                                            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <div style={{ fontWeight: 500 }}>{p.name}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                {p.brand} • Skladem: {Number(p.stock).toFixed(2)} ks
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </form>
                    </div>
                </div>

                {/* RIGHT: CART */}
                <div className="card full-height-card" style={{ display: 'flex', flexDirection: 'column' }}>
                    <div className="card-header-area">
                        <div className="flex-between mb-md">
                            <h3>Košík ({items.length})</h3>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                                {totalSum} Kč
                            </div>
                        </div>
                    </div>

                    <div className="card-scroll-area" ref={listRef} style={{ background: 'var(--bg-tertiary)' }}>
                        <div style={{ display: 'grid', gap: '8px' }}>
                            {items.map((item, idx) => (
                                <div key={idx} className="card fade-in" style={{ padding: '12px', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto auto auto', gap: '12px', alignItems: 'center', background: 'var(--bg-card)' }}>

                                    {/* Info */}
                                    <div>
                                        <div style={{ fontWeight: 500 }}>{item.product.name}</div>
                                        <div className="text-muted" style={{ fontSize: '0.8rem' }}>Skladem: {Number(item.product.stock).toFixed(2)} ks</div>
                                    </div>

                                    {/* Price Input */}
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'end' }}>
                                        <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Cena/ks</label>
                                        <input
                                            type="number"
                                            value={item.price}
                                            onChange={(e) => updateItemPrice(idx, e.target.value)}
                                            placeholder="0"
                                            style={{ width: '80px', padding: '4px', textAlign: 'right', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '4px' }}
                                        />
                                    </div>

                                    {/* Quantity */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <button
                                            className="btn btn-secondary"
                                            style={{ padding: '4px 8px' }}
                                            onClick={() => setItems(items.map((i, ii) => ii === idx ? { ...i, count: Math.max(1, i.count - 1) } : i))}
                                        >-</button>
                                        <span style={{ fontWeight: 'bold', width: '20px', textAlign: 'center' }}>{item.count}</span>
                                        <button
                                            className="btn btn-secondary"
                                            style={{ padding: '4px 8px' }}
                                            onClick={() => setItems(items.map((i, ii) => ii === idx ? { ...i, count: Math.min(Number(item.product.stock), i.count + 1) } : i))}
                                        >+</button>
                                    </div>

                                    {/* Delete */}
                                    <button
                                        onClick={() => setItems(items.filter((_, ii) => ii !== idx))}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f87171' }}
                                    >
                                        🗑
                                    </button>
                                </div>
                            ))}

                            {items.length === 0 && (
                                <div className="text-muted" style={{ textAlign: 'center', padding: '40px', border: '2px dashed var(--border-color)', borderRadius: '12px' }}>
                                    Košík je prázdný.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* FOOTER ACTIONS - Part of card but fixed at bottom? No, inside card-header-area logic or separate footer */}
                    {items.length > 0 && (
                        <div style={{ padding: 'var(--spacing-md)', borderTop: '1px solid var(--border-color)', background: 'var(--bg-card)' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                                <button
                                    className="btn btn-secondary"
                                    style={{ justifyContent: 'center', padding: '12px' }}
                                    onClick={handleConsume}
                                >
                                    🧹 Vydat (Spotřeba)
                                </button>
                                <button
                                    className="btn btn-primary"
                                    style={{ justifyContent: 'center', padding: '12px' }}
                                    onClick={handleSellStart}
                                >
                                    💰 Zaplatit (Prodej)
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* CHECKOUT MODAL */}
            {showCheckout && (
                <CheckoutModal
                    visit={null}
                    client={{ name: 'Prodej na pokladně' }}
                    onConfirm={handlePaymentConfirm}
                    onCancel={() => setShowCheckout(false)}
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
