import React, { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';

export function ReceiptModal({ transaction, onClose }) {
    const componentRef = useRef();

    const handlePrint = useReactToPrint({
        content: () => componentRef.current,
        documentTitle: `Uctenka_${transaction.date.slice(0, 10)}`,
        onAfterPrint: onClose
    });

    if (!transaction) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.8)', zIndex: 2000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(5px)'
        }}>
            <div className="card fade-in" style={{
                background: 'var(--bg-card)',
                width: '100%', maxWidth: '400px',
                padding: '24px',
                display: 'flex', flexDirection: 'column', gap: '24px',
                maxHeight: '90vh'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3>Náhled účtenky</h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>✕</button>
                </div>

                {/* SCROLLABLE PREVIEW AREA */}
                <div style={{
                    background: '#e0e0e0',
                    padding: '20px',
                    borderRadius: '8px',
                    overflowY: 'auto',
                    display: 'flex',
                    justifyContent: 'center'
                }}>
                    {/* RECEIPT PAPER */}
                    <div ref={componentRef} style={{
                        width: '80mm', // Standard thermal paper width
                        minHeight: '100mm',
                        background: 'white',
                        color: 'black',
                        padding: '10px',
                        fontFamily: "'Courier New', Courier, monospace",
                        fontSize: '12px',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                        lineHeight: '1.4'
                    }}>
                        <style>{`
                            @media print {
                                @page { size: auto; margin: 0mm; }
                                body { margin: 0; }
                                .receipt-content { width: 100%; }
                            }
                        `}</style>

                        <div className="receipt-content" style={{ textAlign: 'center', marginBottom: '15px', borderBottom: '1px dashed black', paddingBottom: '10px' }}>
                            <h2 style={{ margin: '0 0 5px 0', fontSize: '18px', fontWeight: 'bold' }}>HairMaster</h2>
                            <div style={{ fontSize: '10px' }}>Profesionální studio</div>
                            <div style={{ fontSize: '10px', marginTop: '5px' }}>{new Date(transaction.date).toLocaleString('cs-CZ')}</div>
                        </div>

                        <div style={{ marginBottom: '15px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Zákazník:</span>
                                <span style={{ fontWeight: 'bold' }}>{transaction.clientName || 'Neregistrovaný'}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Platba:</span>
                                <span>{transaction.method === 'cash' ? 'HOTOVOST' : 'KARTA / QR'}</span>
                            </div>
                        </div>

                        <div style={{ borderBottom: '1px dashed black', paddingBottom: '15px', marginBottom: '15px' }}>
                            <div style={{ fontWeight: 'bold', marginBottom: '5px', borderBottom: '1px solid black', display: 'inline-block' }}>POLOŽKY</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                {transaction.items ? transaction.items.split(', ').map((item, i) => (
                                    <div key={i}>{item}</div>
                                )) : <div>Služby</div>}
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 'bold', borderTop: '2px solid black', paddingTop: '10px' }}>
                            <span>CELKEM:</span>
                            <span>{transaction.amount} Kč</span>
                        </div>

                        <div style={{ textAlign: 'center', marginTop: '30px', fontSize: '10px', color: '#444' }}>
                            Děkujeme za návštěvu!
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                    <button onClick={handlePrint} className="btn btn-primary" style={{ flex: 1, padding: '12px', justifyContent: 'center', fontSize: '1.1rem' }}>
                        🖨️ Tisknout
                    </button>
                    <button onClick={onClose} className="btn btn-secondary" style={{ flex: 1, padding: '12px', justifyContent: 'center' }}>
                        Zrušit
                    </button>
                </div>
            </div>
        </div>
    );
}
