import { useState, useEffect } from 'react';

export function CheckoutModal({ visit, client, onConfirm, onCancel }) {
    const [amount, setAmount] = useState('');
    const [received, setReceived] = useState('');
    const [method, setMethod] = useState('cash'); // 'cash' | 'qr'
    const [change, setChange] = useState(0);

    // Calculate change whenever amount or received changes
    useEffect(() => {
        const price = Number(amount) || 0;
        const paid = Number(received) || 0;
        setChange(paid > price ? paid - price : 0);
    }, [amount, received]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onConfirm({
            amount: Number(amount),
            received: Number(received),
            method,
            items: visit ? visit.services : 'Návštěva'
        });
    };

    const predefinedAmounts = [500, 1000, 2000, 5000];

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.8)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(5px)'
        }}>
            <div className="card fade-in" style={{ width: '100%', maxWidth: '500px', border: '1px solid var(--accent)', background: 'var(--bg-card)' }}>
                <h2 className="mb-lg" style={{ textAlign: 'center' }}>Pokladna</h2>

                <div style={{ marginBottom: 'var(--spacing-md)', textAlign: 'center' }}>
                    <div className="text-muted">{client.name}</div>
                    <div style={{ fontSize: '0.9rem', marginTop: '4px' }}>{visit ? visit.services : 'Rychlá platba'}</div>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* TOTAL PRICE INPUT */}
                    <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                        <label className="text-muted" style={{ display: 'block', marginBottom: '8px' }}>Částka k úhradě (Kč)</label>
                        <input
                            autoFocus
                            type="number"
                            required
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            placeholder="0"
                            style={{
                                width: '100%',
                                fontSize: '3rem',
                                fontWeight: 'bold',
                                textAlign: 'center',
                                padding: '16px',
                                borderRadius: '12px',
                                outline: 'none',
                                background: 'var(--bg-input)', // THEME FIXED
                                color: 'var(--text-primary)',   // THEME FIXED
                                border: '1px solid var(--border-color)'
                            }}
                        />
                    </div>

                    {/* CASH PAYMENT UI */}
                    {method === 'cash' && (
                        <div className="fade-in" style={{ background: 'var(--bg-tertiary)', padding: '16px', borderRadius: '12px', marginBottom: '20px' }}>
                            <label className="text-muted" style={{ display: 'block', marginBottom: '8px' }}>Přijato od zákazníka</label>
                            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                                <input
                                    type="number"
                                    value={received}
                                    onChange={e => setReceived(e.target.value)}
                                    placeholder="Kolik dává?"
                                    style={{
                                        flex: 2,
                                        padding: '12px',
                                        fontSize: '1.2rem',
                                        borderRadius: '8px',
                                        background: 'var(--bg-input)', // THEME FIXED
                                        color: 'var(--text-primary)',   // THEME FIXED
                                        border: '1px solid var(--border-color)',
                                        outline: 'none'
                                    }}
                                />
                                {predefinedAmounts.map(val => (
                                    <button
                                        key={val}
                                        type="button"
                                        onClick={() => setReceived(val)}
                                        className="btn btn-secondary"
                                        style={{ flex: 1, padding: '0', fontSize: '0.8rem', justifyContent: 'center' }}
                                    >
                                        +{val}
                                    </button>
                                ))}
                            </div>

                            <div style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                padding: '12px', background: change > 0 ? 'rgba(74, 222, 128, 0.1)' : 'transparent',
                                borderRadius: '8px', border: change > 0 ? '1px solid #4ade80' : 'none'
                            }}>
                                <span style={{ color: 'var(--text-secondary)' }}>Vrátit nazpět:</span>
                                <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#4ade80' }}>
                                    {change > 0 ? `${change} Kč` : '-'}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* METHOD TOGGLE */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
                        <button
                            type="button"
                            className={`btn ${method === 'cash' ? 'btn-primary' : 'btn-secondary'}`}
                            style={{
                                justifyContent: 'center', height: '50px', fontSize: '1.1rem'
                            }}
                            onClick={() => setMethod('cash')}
                        >
                            💵 HOTOVĚ
                        </button>
                        <button
                            type="button"
                            className={`btn ${method === 'qr' ? 'btn-primary' : 'btn-secondary'}`}
                            style={{
                                justifyContent: 'center', height: '50px', fontSize: '1.1rem'
                            }}
                            onClick={() => setMethod('qr')}
                        >
                            📱 QR KÓD
                        </button>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            style={{ flex: 2, padding: '16px', fontSize: '1.2rem' }}
                            disabled={!amount}
                        >
                            Zaplatit {amount ? `${amount} Kč` : ''}
                        </button>
                        <button
                            type="button"
                            onClick={onCancel}
                            className="btn btn-secondary"
                            style={{ flex: 1 }}
                        >
                            Zrušit
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
