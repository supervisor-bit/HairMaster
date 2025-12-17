import React, { useState, useEffect, useRef } from 'react';
import { useProducts } from '../hooks/useProducts';
import { useVisits } from '../hooks/useVisits';
import { useServiceTemplates } from '../hooks/useServiceTemplates'; // [NEW] Import Hook
import { useToast } from '../components/Toast';
import { ConfirmDialog } from './ConfirmDialog';
import { PromptDialog } from './PromptDialog';

// Helper for searchable dropdown
const SmartSelect = ({ options, onSelect, placeholder, icon, type = 'product' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const wrapperRef = useRef(null);

    // Close when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    const filtered = options.filter(o => o.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <div ref={wrapperRef} style={{ position: 'relative', minWidth: '140px' }}>
            {!isOpen ? (
                <button
                    type="button"
                    onClick={() => { setIsOpen(true); setSearch(''); }}
                    style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px dashed var(--text-muted)',
                        color: 'var(--text-secondary)',
                        padding: '6px 12px',
                        borderRadius: '20px',
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        width: '100%',
                        whiteSpace: 'nowrap'
                    }}
                >
                    <span>{icon || '+'}</span>
                    <span>{placeholder}</span>
                </button>
            ) : (
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    zIndex: 1000,
                    background: 'var(--bg-card)',
                    border: '1px solid var(--primary)',
                    borderRadius: '8px',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
                    width: '240px',
                    overflow: 'hidden'
                }}>
                    <input
                        autoFocus
                        type="text"
                        placeholder="Hledat..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '8px 12px',
                            background: 'var(--bg-tertiary)',
                            border: 'none',
                            borderBottom: '1px solid var(--border-color)',
                            color: 'var(--text-primary)',
                            outline: 'none',
                            fontSize: '0.9rem'
                        }}
                    />
                    <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                        {filtered.length > 0 ? filtered.map(opt => (
                            <div
                                key={opt.id}
                                onClick={() => { onSelect(opt.id); setIsOpen(false); }}
                                style={{
                                    padding: '8px 12px',
                                    cursor: 'pointer',
                                    borderBottom: '1px solid var(--border-color)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    fontSize: '0.85rem',
                                    background: 'var(--bg-card)',
                                    color: 'var(--text-primary)'
                                }}
                                className="hover:bg-slate-700"
                                onMouseEnter={(e) => e.target.style.background = 'var(--bg-hover)'}
                                onMouseLeave={(e) => e.target.style.background = 'var(--bg-card)'}
                            >
                                <span>{opt.name}</span>
                                {type === 'product' && opt.stock !== undefined && (
                                    <span style={{
                                        fontSize: '0.75rem',
                                        padding: '2px 6px',
                                        borderRadius: '4px',
                                        backgroundColor: opt.virtualStock
                                            ? (opt.virtualStock.availableKs / (Number(opt.stock) || 1) > 0.5 ? '#10b981'
                                                : opt.virtualStock.availableKs / (Number(opt.stock) || 1) > 0.1 ? '#f59e0b'
                                                    : '#ef4444')
                                            : '#ef4444'
                                    }}>
                                        {opt.virtualStock ? (
                                            Number(opt.packageSize) > 0
                                                ? `${opt.virtualStock.availableKs.toFixed(1)} ks (${opt.virtualStock.available.toFixed(0)}${opt.unit || 'g'})`
                                                : `${opt.virtualStock.available.toFixed(0)} ${opt.unit || 'ks'}`
                                        ) : (
                                            Number(opt.packageSize) > 0
                                                ? `${parseFloat(Number(opt.stock).toFixed(2))} ks (${(Number(opt.stock) * Number(opt.packageSize)).toFixed(0)}${opt.unit || 'g'})`
                                                : `${opt.stock} ks`
                                        )}
                                    </span>
                                )}
                            </div>
                        )) : (
                            <div style={{ padding: '12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                Žádné výsledky
                            </div>
                        )}
                    </div >
                </div >
            )}
        </div >
    );
};

export function VisitForm({ client, onSubmit, onCancel, initialData }) {
    const { products } = useProducts();
    const { visits } = useVisits(); // Import full visits history for autocomplete
    const { templates, addTemplate, deleteTemplate } = useServiceTemplates(); // [NEW] Use templates hook
    const { addToast } = useToast();
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    // Dialog States
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
    const [showSavePrompt, setShowSavePrompt] = useState(null);
    const [showTemplatesModal, setShowTemplatesModal] = useState(false);

    // Autocomplete Suggestions
    const [serviceSuggestions, setServiceSuggestions] = useState([]);

    useEffect(() => {
        const defaults = ['Dámský střih', 'Pánský střih', 'Foukaná', 'Barvení', 'Melír', 'Balayage', 'Tónování', 'Kúra', 'Konzultace'];
        const history = new Set();

        // Extract names from blocks in all visits
        visits.forEach(v => {
            if (v.blocks) {
                v.blocks.forEach(b => {
                    if (b.name) history.add(b.name);
                });
            }
        });

        // Merge defaults and history, remove duplicates, sort
        const merged = [...new Set([...defaults, ...Array.from(history)])].sort();
        setServiceSuggestions(merged);
    }, [visits]);

    // Blocks: { id, type: 'color'|'simple', name, items: [], ratio, developerId, notes }
    const [blocks, setBlocks] = useState(initialData?.blocks || []);
    const [globalNotes, setGlobalNotes] = useState(initialData?.globalNotes || '');

    // Reset form when initialData changes (e.g. duplicating different visit)
    useEffect(() => {
        if (initialData) {
            setBlocks(initialData.blocks || []);
            setGlobalNotes(initialData.globalNotes || '');
        }
    }, [initialData]);

    const availableProducts = products.filter(p => Number(p.stock) > 0);
    const developerProducts = availableProducts.filter(p => p.category === 'oxidant');

    // Calculate virtual stock (current stock - already used in this visit)
    const calculateVirtualStock = (productId) => {
        const product = products.find(p => p.id === productId);
        if (!product) return { available: 0, availableKs: 0, used: 0, total: 0, unit: 'ks', packageSize: 0 };

        const currentStock = Number(product.stock) || 0;
        const packageSize = Number(product.packageSize) || 0;

        // Calculate total grams/units if packageSize exists
        const totalAmount = packageSize > 0 ? currentStock * packageSize : currentStock;

        // Sum all usage of this product in current visit (including developer auto-calculation)
        let usedAmount = 0;
        blocks.forEach(block => {
            // Manual items
            block.items.forEach(item => {
                if (item.productId === productId) {
                    let amount = Number(item.amount) || 0;
                    // If retail block and product has package size, convert pieces to base unit (e.g. 1ks -> 1000g)
                    if (block.type === 'retail' && packageSize > 0) {
                        amount = amount * packageSize;
                    }
                    usedAmount += amount;
                }
            });

            // Auto-calculated developer
            if (block.type === 'color' && block.developerId === productId) {
                const devAmount = calculateDeveloperAmount(block);
                usedAmount += devAmount;
            }
        });

        const available = totalAmount - usedAmount;
        const availableKs = packageSize > 0 ? available / packageSize : available;

        return {
            available: Math.max(0, available),
            availableKs: Math.max(0, availableKs),
            used: usedAmount,
            total: totalAmount,
            unit: product.unit || 'g',
            packageSize,
            productName: product.name
        };
    };

    const addBlock = (type) => {
        const id = Date.now().toString();
        const name = type === 'color' ? 'Barvení' : (type === 'retail' ? 'Domácí péče' : 'Další úkon');
        setBlocks([...blocks, { id, type, name, items: [], ratio: '1:1', developerId: '', notes: '' }]);
    };

    const removeBlock = (id) => {
        setBlocks(blocks.filter(b => b.id !== id));
    };

    const updateBlock = (id, field, value) => {
        setBlocks(blocks.map(b => b.id === id ? { ...b, [field]: value } : b));
    };

    const addItemToBlock = (blockId, productId, amount = 1) => {
        const product = products.find(p => p.id === productId);
        if (!product) return;

        // Validation for missing package size on fractional units
        if (['g', 'ml'].includes(product.unit) && (!product.packageSize || Number(product.packageSize) <= 0)) {
            addToast(`Pozor: Produkt "${product.name}" nemá nastavenou velikost balení! Systém bude odečítat po kusech namísto ${product.unit}. Zkontrolujte nastavení produktu.`, 'warning');
        }

        // Check virtual stock before adding
        const virtualStock = calculateVirtualStock(productId);
        if (amount > virtualStock.available) {
            const availableDisplay = virtualStock.packageSize > 0
                ? `${virtualStock.availableKs.toFixed(1)} ks (${virtualStock.available.toFixed(0)}${virtualStock.unit})`
                : `${virtualStock.available.toFixed(0)} ${virtualStock.unit}`;

            addToast(
                `Nedostatek zásob! ${product.name}: Dostupné ${availableDisplay}, požadováno ${amount}${virtualStock.unit}`,
                'error'
            );
            return;
        }

        setBlocks(blocks.map(b => {
            if (b.id !== blockId) return b;
            // Check if item exists
            if (b.items.some(i => i.productId === productId)) return b;
            return { ...b, items: [...b.items, { productId, amount: Number(amount), name: product.name, unit: product.unit }] };
        }));
    };

    const removeItemFromBlock = (blockId, productId) => {
        setBlocks(blocks.map(b => {
            if (b.id !== blockId) return b;
            return { ...b, items: b.items.filter(i => i.productId !== productId) };
        }));
    };

    const updateItemAmount = (blockId, productId, amount) => {
        const newAmount = Number(amount) || 0;

        // Get current amount for this item
        let currentAmount = 0;
        const block = blocks.find(b => b.id === blockId);
        if (block) {
            const item = block.items.find(i => i.productId === productId);
            if (item) currentAmount = Number(item.amount) || 0;
        }

        // Calculate virtual stock (excluding current item's amount)
        const product = products.find(p => p.id === productId);
        if (!product) return;

        const virtualStock = calculateVirtualStock(productId);
        // Add back current amount to get true available
        const trueAvailable = virtualStock.available + currentAmount;

        if (newAmount > trueAvailable) {
            const availableDisplay = virtualStock.packageSize > 0
                ? `${(trueAvailable / virtualStock.packageSize).toFixed(1)} ks (${trueAvailable.toFixed(0)}${virtualStock.unit})`
                : `${trueAvailable.toFixed(0)} ${virtualStock.unit}`;

            addToast(
                `Nedostatek zásob! ${product.name}: Dostupné ${availableDisplay}, požadováno ${newAmount}${virtualStock.unit}`,
                'error'
            );
            return;
        }

        setBlocks(blocks.map(b => {
            if (b.id !== blockId) return b;
            return {
                ...b,
                items: b.items.map(i => i.productId === productId ? { ...i, amount: newAmount } : i)
            };
        }));
    };

    const calculateDeveloperAmount = (block) => {
        if (block.type !== 'color' || !block.developerId) return 0;
        const totalColorAmount = block.items.reduce((sum, item) => sum + item.amount, 0);

        let ratioMultiplier = 1;
        if (block.ratio === '1:1.5') ratioMultiplier = 1.5;
        if (block.ratio === '1:2') ratioMultiplier = 2;

        return totalColorAmount * ratioMultiplier;
    };

    const handleSaveTemplate = (name) => {
        if (!showSavePrompt) return;
        const { id, ...templateData } = showSavePrompt;
        addTemplate({ ...templateData, name });
        addToast('Šablona uložena! Najdete ji nahoře pod "📂 Šablony"', 'success');
        setShowSavePrompt(null);
    };

    const handleDeleteTemplate = () => {
        if (!showDeleteConfirm) return;
        deleteTemplate(showDeleteConfirm);
        addToast('Šablona smazána', 'info');
        setShowDeleteConfirm(null);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // 1. VALIDATION: Check if there are any blocks
        // Using return to strictly stop execution if validation fails
        if (!blocks || blocks.length === 0) {
            addToast('Návštěva musí obsahovat alespoň jeden úkon (např. Barvení nebo Střih).', 'warning');
            return;
        }

        // 2. VALIDATION: Check if blocks have content
        const emptyBlocks = blocks.filter(b => !b.name?.trim() && b.items.length === 0);
        if (emptyBlocks.length > 0) {
            addToast('Máte tam prázdný úkon. Vyplňte název úkonu nebo přidejte produkty.', 'warning');
            return;
        }

        // 2. Compile Services String
        const servicesList = blocks.map(b => b.name).filter(Boolean).join(', ');

        // 2. Compile Used Products (Flat List)
        const allUsedProducts = [];

        blocks.forEach(block => {
            // Add all manual items
            block.items.forEach(item => {
                const isRetail = block.type === 'retail';
                // Find existing only if same retail status
                const existing = allUsedProducts.find(p => p.productId === item.productId && !!p.isRetail === isRetail);
                if (existing) existing.amount += item.amount;
                else allUsedProducts.push({ ...item, isRetail });
            });

            // If color block, calculate and add developer automation
            if (block.type === 'color' && block.developerId) {
                const devAmount = calculateDeveloperAmount(block);
                const devProduct = products.find(p => p.id === block.developerId);
                if (devProduct) {
                    const existing = allUsedProducts.find(p => p.productId === devProduct.id);
                    if (existing) existing.amount += devAmount;
                    else allUsedProducts.push({ productId: devProduct.id, amount: devAmount, name: devProduct.name, unit: devProduct.unit });
                }
            }
        });

        // 3. Compile Recipe Notes
        let recipeNotes = blocks.map(block => {
            if (block.type === 'color') {
                const colors = block.items.map(i => `${i.name} (${i.amount}g)`).join(' + ');
                const devProduct = products.find(p => p.id === block.developerId);
                const devAmount = calculateDeveloperAmount(block);
                const devText = devProduct ? ` + ${devProduct.name} (${devAmount}g)` : ''; // TODO: unit check
                return `${block.name}: ${colors}${devText} [${block.ratio}]` + (block.notes ? ` - ${block.notes} ` : '');
            } else {
                if (block.items.length > 0 || block.notes) {
                    const itemsText = block.items.map(i => `${i.name} (${i.amount}${i.unit})`).join(', ');
                    return `${block.name}: ${itemsText} ` + (block.notes ? ` - ${block.notes} ` : '');
                }
                return null;
            }
        }).filter(Boolean).join('\n');

        if (globalNotes) recipeNotes += `\n\nPoznámky: ${globalNotes} `;

        onSubmit({
            clientId: client.id,
            date,
            services: servicesList || 'Nezadáno',
            notes: recipeNotes,
            usedProducts: allUsedProducts,
            blocks,      // Save structured data for duplication
            globalNotes  // Save raw notes for duplication
        });
    };

    // Helper to generate live recipe preview
    const getBlockRecipeString = (block, products) => {
        if (block.type === 'simple') return '';

        const ingredients = block.items.map(item => {
            const p = products.find(p => p.id === item.productId);
            return `${p ? p.name : '???'}(${item.amount}g)`;
        }).join(' + ');

        const devP = products.find(p => p.id === block.developerId);
        const devString = devP ? ` + ${devP.name}(${calculateDeveloperAmount(block)}g)` : '';

        return ingredients ? `${ingredients}${devString}` : 'Vyberte produkty...';
    };

    // Auto-scroll logic
    const bottomRef = React.useRef(null);
    React.useEffect(() => {
        if (bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [blocks.length]);

    return (
        <div className="page-layout fade-in">
            {/* Custom Dialogs */}
            {showDeleteConfirm && (
                <ConfirmDialog
                    message="Opravdu chcete smazat tuto šablonu?"
                    confirmText="Smazat"
                    cancelText="Ponechat"
                    onConfirm={handleDeleteTemplate}
                    onCancel={() => setShowDeleteConfirm(null)}
                />
            )}

            {showSavePrompt && (
                <PromptDialog
                    title="Uložit šablonu"
                    message="Pojmenujte svou šablonu pro snadné použití v budoucnu."
                    initialValue={showSavePrompt.name}
                    placeholder="Např. Můj Melír, Blond Special..."
                    confirmText="Uložit"
                    onConfirm={handleSaveTemplate}
                    onCancel={() => setShowSavePrompt(null)}
                />
            )}

            <header className="page-header">
                <div className="flex-between">
                    <div>
                        <h2 style={{ fontSize: '1.8rem', marginBottom: '0.25rem' }}>
                            Nová návštěva: {client?.name || 'Petr Svoboda'}
                        </h2>
                        <p className="text-muted">Vyplňte detaily návštěvy a použité produkty.</p>
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                        <div style={{ position: 'relative' }}>
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => setShowTemplatesModal(true)} // Use State
                                style={{ border: '1px dashed var(--border-color)' }}
                            >
                                📂 Šablony
                            </button>

                            {/* React-controlled Template Modal */}
                            {showTemplatesModal && (
                                <div style={{
                                    position: 'fixed',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    background: 'rgba(0,0,0,0.5)',
                                    zIndex: 9000,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backdropFilter: 'blur(5px)'
                                }}>
                                    <div className="card fade-in" style={{
                                        width: '400px',
                                        maxHeight: '80vh',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        background: 'var(--bg-card)',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: 'var(--radius-lg)',
                                        padding: 'var(--spacing-lg)',
                                        boxShadow: 'var(--shadow-xl)'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
                                            <h3 style={{ margin: 0 }}>Uložené šablony</h3>
                                            <button
                                                type="button"
                                                onClick={() => setShowTemplatesModal(false)}
                                                style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-muted)' }}
                                            >
                                                ✕
                                            </button>
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', flex: 1, paddingRight: '4px' }}>
                                            {templates.length > 0 ? templates.map(t => (
                                                <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--bg-tertiary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                                    <div
                                                        onClick={() => {
                                                            const id = Date.now().toString();
                                                            setBlocks([...blocks, { ...t, id }]);
                                                            setShowTemplatesModal(false);
                                                            addToast(`Šablona "${t.name}" načtena`, 'success');
                                                        }}
                                                        style={{ cursor: 'pointer', flex: 1 }}
                                                        className="hover-opacity"
                                                    >
                                                        <div style={{ fontWeight: 600, marginBottom: '2px' }}>{t.name}</div>
                                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                                            {t.type === 'color' ? 'Barvení' : 'Služba'} • {t.items.length} produktů
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowDeleteConfirm(t.id)}
                                                        style={{ border: 'none', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', cursor: 'pointer', padding: '8px', borderRadius: '6px' }}
                                                        title="Smazat šablonu"
                                                    >
                                                        🗑
                                                    </button>
                                                </div>
                                            )) : (
                                                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                                    Zatím žádné uložené šablony...<br />
                                                    <small>Uložte si svou první kliknutím na 💾 u služby.</small>
                                                </div>
                                            )}
                                        </div>
                                        <div style={{ marginTop: 'var(--spacing-md)', textAlign: 'right' }}>
                                            <button type="button" className="btn btn-secondary" onClick={() => setShowTemplatesModal(false)}>Zavřít</button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        <button
                            type="button"
                            className="btn"
                            onClick={() => addBlock('color')}
                            style={{
                                background: 'linear-gradient(135deg, #d946ef, #c026d3)',
                                color: 'white',
                                border: 'none',
                                boxShadow: '0 4px 6px -1px rgba(217, 70, 239, 0.3)'
                            }}
                        >
                            + Chemie
                        </button>
                        <button
                            type="button"
                            className="btn"
                            onClick={() => addBlock('simple')}
                            style={{
                                background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                                color: 'white',
                                border: 'none',
                                boxShadow: '0 4px 6px -1px rgba(99, 102, 241, 0.3)'
                            }}
                        >
                            + Jiný úkon
                        </button>
                        <button
                            type="button"
                            className="btn"
                            onClick={() => addBlock('retail')}
                            style={{
                                background: 'linear-gradient(135deg, #10b981, #059669)',
                                color: 'white',
                                border: 'none',
                                boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.3)'
                            }}
                        >
                            + Domů
                        </button>
                    </div>
                </div>
                {/* Autocomplete Datalist */}
                <datalist id="service-suggestions">
                    {serviceSuggestions.map((s, i) => (
                        <option key={i} value={s} />
                    ))}
                </datalist>

            </header >

            <div className="content-area">
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 350px) 1fr', gap: 'var(--spacing-xl)', height: '100%', paddingBottom: 'var(--spacing-xl)' }}>
                    {/* Left: Form */}
                    <form onSubmit={handleSubmit} className="card" style={{ display: 'grid', gap: 'var(--spacing-md)', height: 'fit-content' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', color: 'var(--text-secondary)' }}>Datum</label>
                            <input type="date" required value={date} onChange={e => setDate(e.target.value)} />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', color: 'var(--text-secondary)' }}>Společné poznámky</label>
                            <textarea value={globalNotes} onChange={e => setGlobalNotes(e.target.value)} placeholder="Celkový dojem, platba, atd..." />
                        </div>

                        <div style={{ display: 'flex', gap: 'var(--spacing-sm)', marginTop: 'var(--spacing-sm)' }}>
                            <button type="submit" className="btn btn-primary">Uložit návštěvu</button>
                            <button type="button" onClick={onCancel} className="btn btn-ghost" style={{ border: '1px solid var(--border-color)' }}>Zrušit</button>
                        </div>
                    </form>

                    {/* Right: Blocks */}
                    <div className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                        <h3 style={{ padding: 'var(--spacing-lg)', paddingBottom: 'var(--spacing-md)', margin: 0 }}>Skladač úkonů</h3>
                        <div style={{ flex: 1, overflowY: 'auto', padding: '0 var(--spacing-lg) var(--spacing-lg)' }}>
                            {blocks.map((block, blockIndex) => (
                                <div key={block.id} style={{ marginBottom: blockIndex < blocks.length - 1 ? 'var(--spacing-md)' : 0 }}>
                                    <div className="card" style={{
                                        background: 'var(--bg-card)',
                                        backdropFilter: 'var(--glass-blur)',
                                        border: '1px solid var(--border-color)',
                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                                        padding: 0,
                                        borderRadius: 'var(--radius-lg)',
                                        overflow: 'visible', /* Allow dropdown overflow */
                                        transition: 'transform 0.2s',
                                        borderLeft: block.type === 'color' ? '4px solid var(--accent)' : (block.type === 'retail' ? '4px solid #10b981' : '4px solid var(--text-muted)')
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'stretch' }}>
                                            {/* Left Section: Identity */}
                                            <div style={{ padding: 'var(--spacing-md)', minWidth: '200px', borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
                                                <div style={{
                                                    display: 'inline-block',
                                                    fontSize: '0.65rem',
                                                    fontWeight: 800,
                                                    letterSpacing: '0.05em',
                                                    textTransform: 'uppercase',
                                                    color: block.type === 'color' ? 'var(--accent)' : (block.type === 'retail' ? '#10b981' : 'var(--text-muted)'),
                                                    marginBottom: '0.25rem',
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    width: '100%'
                                                }}>
                                                    <span>{block.type === 'color' ? '★ Chemie' : (block.type === 'retail' ? '🛍 Domácí péče' : '● Služba')}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowSavePrompt(block)}
                                                        title="Uložit jako šablonu"
                                                        style={{
                                                            background: 'transparent',
                                                            border: 'none',
                                                            cursor: 'pointer',
                                                            fontSize: '1rem',
                                                            opacity: 0.6,
                                                            padding: 0
                                                        }}
                                                        onMouseEnter={e => e.target.style.opacity = 1}
                                                        onMouseLeave={e => e.target.style.opacity = 0.6}
                                                    >
                                                        💾
                                                    </button>
                                                </div>
                                                <div style={{ marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span style={{ fontSize: '1rem', color: 'var(--text-muted)', cursor: 'default' }}>✎</span>
                                                    <input
                                                        type="text"
                                                        value={block.name}
                                                        onChange={(e) => updateBlock(block.id, 'name', e.target.value)}
                                                        style={{
                                                            background: 'transparent',
                                                            border: 'none',
                                                            borderBottom: '1px dashed var(--border-color)',
                                                            color: 'var(--text-primary)',
                                                            fontSize: '1.1rem',
                                                            fontWeight: 600,
                                                            width: '100%',
                                                            padding: '2px 0',
                                                            outline: 'none',
                                                            transition: 'border-color 0.2s'
                                                        }}
                                                        onFocus={(e) => e.target.style.borderBottom = '1px solid var(--primary)'}
                                                        onBlur={(e) => e.target.style.borderBottom = '1px dashed var(--border-color)'}
                                                        placeholder="Název úkonu..."
                                                        list="service-suggestions" // Link input to datalist
                                                    />
                                                </div>
                                                <input
                                                    type="text"
                                                    placeholder="Přidat poznámku..."
                                                    value={block.notes}
                                                    onChange={(e) => updateBlock(block.id, 'notes', e.target.value)}
                                                    style={{
                                                        background: 'transparent',
                                                        border: 'none',
                                                        fontSize: '0.85rem',
                                                        padding: '2px 0 2px 24px', // Indent to align with text above (icon width approx)
                                                        color: 'var(--text-secondary)',
                                                        width: '100%',
                                                        opacity: 0.8
                                                    }}
                                                    onFocus={(e) => {
                                                        e.target.style.background = 'var(--bg-tertiary)';
                                                        e.target.style.padding = '4px 8px';
                                                        e.target.style.borderRadius = '6px';
                                                    }}
                                                    onBlur={(e) => {
                                                        e.target.style.background = 'transparent';
                                                        e.target.style.padding = '2px 0 2px 24px';
                                                    }}
                                                />
                                            </div>

                                            {/* Middle Section: Configuration */}
                                            <div style={{ flex: 1, padding: 'var(--spacing-md)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>

                                                {/* LIVE RECIPE PREVIEW */}
                                                {block.type === 'color' && (
                                                    <div style={{
                                                        marginTop: 'var(--spacing-md)',
                                                        padding: 'var(--spacing-md)',
                                                        background: 'var(--bg-tertiary)',
                                                        border: '1px solid var(--border-color)',
                                                        borderRadius: '12px',
                                                        fontSize: '0.95rem',
                                                        fontWeight: 500,
                                                        color: 'var(--text-primary)',
                                                        fontFamily: 'monospace',
                                                        letterSpacing: '0.02em',
                                                        lineHeight: 1.6,
                                                        wordBreak: 'break-word'
                                                    }}>
                                                        🧪 {getBlockRecipeString(block, availableProducts)}
                                                    </div>
                                                )}

                                                {/* Product Strip */}
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', marginBottom: block.type === 'color' ? '12px' : 0 }}>
                                                    {block.items.map(item => (
                                                        <div key={item.productId} style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '6px',
                                                            background: 'var(--bg-input)',
                                                            color: 'var(--text-primary)',
                                                            border: '1px solid var(--border-color)',
                                                            borderRadius: '20px',
                                                            padding: '4px 12px',
                                                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                                            minWidth: 'fit-content',
                                                            whiteSpace: 'nowrap'
                                                        }}>
                                                            <span style={{ fontWeight: 500, fontSize: '0.85rem' }}>{item.name}</span>
                                                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
                                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>(</span>
                                                                <input
                                                                    type="number"
                                                                    value={item.amount}
                                                                    onChange={(e) => updateItemAmount(block.id, item.productId, e.target.value)}
                                                                    style={{ width: '35px', padding: 0, border: 'none', background: 'transparent', textAlign: 'center', fontWeight: 'bold', color: 'var(--accent)' }}
                                                                />
                                                                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{item.unit})</span>
                                                            </div>
                                                            <button onClick={() => removeItemFromBlock(block.id, item.productId)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#ef4444', marginLeft: '4px', display: 'flex', alignItems: 'center' }}>
                                                                <span style={{ fontSize: '1.2rem', lineHeight: 0.5 }}>×</span>
                                                            </button>
                                                        </div>
                                                    ))}

                                                    <SmartSelect
                                                        options={availableProducts
                                                            .filter(p => {
                                                                if (block.type === 'color') return ['color', 'bleach'].includes(p.category);
                                                                if (block.type === 'retail') return ['retail', 'care', 'styling'].includes(p.category);
                                                                // For 'simple' (other services), exclude technical chemicals
                                                                return !['color', 'bleach', 'oxidant'].includes(p.category);
                                                            })
                                                            .map(p => ({
                                                                ...p,
                                                                virtualStock: calculateVirtualStock(p.id)
                                                            }))}
                                                        onSelect={(id) => addItemToBlock(block.id, id, block.type === 'color' ? 30 : 1)}
                                                        placeholder={block.type === 'color' ? "Přidat barvu" : "Přidat produkt"}
                                                        icon="+"
                                                    />
                                                </div>

                                                {/* Tech Strip (Color Only) */}
                                                {block.type === 'color' && (
                                                    <div style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 'var(--spacing-lg)',
                                                        background: 'rgba(0,0,0,0.2)',
                                                        padding: '8px 12px',
                                                        borderRadius: '8px',
                                                        border: '1px solid rgba(255,255,255,0.03)',
                                                        marginTop: 'var(--spacing-xs)'
                                                    }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>POMĚR</span>
                                                            <select
                                                                value={block.ratio}
                                                                onChange={(e) => updateBlock(block.id, 'ratio', e.target.value)}
                                                                style={{
                                                                    background: 'var(--bg-app)',
                                                                    color: 'var(--text-primary)',
                                                                    border: '1px solid var(--border-color)',
                                                                    borderRadius: '4px',
                                                                    fontWeight: 'bold',
                                                                    fontSize: '0.8rem',
                                                                    padding: '2px 6px',
                                                                    cursor: 'pointer'
                                                                }}
                                                            >
                                                                <option value="1:1">1:1</option>
                                                                <option value="1:1.5">1:1.5</option>
                                                                <option value="1:2">1:2</option>
                                                            </select>
                                                        </div>
                                                        <div style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.1)' }}></div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>VYVÍJEČ</span>
                                                            <div style={{ maxWidth: '250px', flex: 1 }}>
                                                                <SmartSelect
                                                                    options={developerProducts.map(p => ({
                                                                        ...p,
                                                                        virtualStock: calculateVirtualStock(p.id)
                                                                    }))}
                                                                    onSelect={(id) => updateBlock(block.id, 'developerId', id)}
                                                                    placeholder={
                                                                        block.developerId
                                                                            ? (availableProducts.find(p => p.id === block.developerId)?.name || 'Neznámý')
                                                                            : "Vybrat oxidant"
                                                                    }
                                                                    icon="💧"
                                                                    type="product"
                                                                />
                                                            </div>
                                                        </div>
                                                        {(block.developerId && block.ratio) && (
                                                            <div style={{
                                                                fontSize: '0.85rem',
                                                                fontWeight: 'bold',
                                                                background: 'var(--accent)',
                                                                color: 'white',
                                                                padding: '2px 8px',
                                                                borderRadius: '4px',
                                                                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                                            }}>
                                                                + {calculateDeveloperAmount(block)}g
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Right: Actions */}
                                            <div style={{ width: '50px', borderLeft: '1px solid rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <button
                                                    type="button"
                                                    onClick={() => removeBlock(block.id)}
                                                    style={{
                                                        width: '32px',
                                                        height: '32px',
                                                        borderRadius: '50%',
                                                        background: 'rgba(239, 68, 68, 0.1)',
                                                        border: 'none',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        transition: 'all 0.2s'
                                                    }}
                                                    title="Odstranit"
                                                    className="btn-delete"
                                                >
                                                    <span style={{ color: '#ef4444', fontSize: '1.2rem', lineHeight: '1' }}>×</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {blocks.length === 0 && (
                                <div style={{ textAlign: 'center', padding: 'var(--spacing-xl)', color: 'var(--text-muted)' }}>
                                    Klikněte na tlačítko výše pro přidání úkonu
                                </div>
                            )}
                            <div ref={bottomRef}></div>
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
}
