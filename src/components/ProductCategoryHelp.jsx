import React from 'react';

export function ProductCategoryHelp({ onClose }) {
    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.8)',
            backdropFilter: 'blur(4px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
        }} onClick={onClose}>
            <div
                className="card fade-in"
                onClick={e => e.stopPropagation()}
                style={{
                    maxWidth: '800px',
                    width: '100%',
                    maxHeight: '90vh',
                    overflowY: 'auto',
                    position: 'relative'
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
                    <h2 style={{ margin: 0, fontSize: '1.5rem' }}>ℹ️ Jak fungují kategorie produktů?</h2>
                    <button onClick={onClose} className="btn-ghost" style={{ fontSize: '1.5rem', lineHeight: 1 }}>×</button>
                </div>

                <p className="text-muted" style={{ marginBottom: 'var(--spacing-lg)' }}>
                    Správné nastavení kategorie u produktu je klíčové pro to, aby "Skladač návštěv" fungoval chytře.
                    Zde je přehled, jak systém s jednotlivými kategoriemi pracuje:
                </p>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
                        <thead>
                            <tr style={{ background: 'var(--bg-tertiary)', textAlign: 'left' }}>
                                <th style={{ padding: '12px', borderBottom: '2px solid var(--border-color)', width: '20%' }}>Kategorie</th>
                                <th style={{ padding: '12px', borderBottom: '2px solid var(--border-color)' }}>Chování v systému</th>
                                <th style={{ padding: '12px', borderBottom: '2px solid var(--border-color)', width: '30%' }}>Příklad použití</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style={{ padding: '12px', borderBottom: '1px solid var(--border-color)', fontWeight: 'bold', color: 'var(--accent)' }}>Barva (Color)</td>
                                <td style={{ padding: '12px', borderBottom: '1px solid var(--border-color)' }}>
                                    Hlavní složka receptury. Umožňuje míchání odstínů a automatický výpočet gramáže.
                                </td>
                                <td style={{ padding: '12px', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                                    Matrix SoColor 6N, Inoa 5.3
                                </td>
                            </tr>
                            <tr>
                                <td style={{ padding: '12px', borderBottom: '1px solid var(--border-color)', fontWeight: 'bold', color: 'var(--accent)' }}>Přeliv (Demi-permanent)</td>
                                <td style={{ padding: '12px', borderBottom: '1px solid var(--border-color)' }}>
                                    Stejné chování jako Barva. Používá se pro tónování a přelivy (demi-permanentní barvy).
                                </td>
                                <td style={{ padding: '12px', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                                    Matrix SoColor Sync, Dialight
                                </td>
                            </tr>
                            <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                                <td style={{ padding: '12px', borderBottom: '1px solid var(--border-color)', fontWeight: 'bold', color: '#3b82f6' }}>Oxidant (Developer)</td>
                                <td style={{ padding: '12px', borderBottom: '1px solid var(--border-color)' }}>
                                    Speciální role! V sekci "Chemie" se zobrazuje ve vlastním políčku pro vyvíječ a <strong>automaticky se dopočítává</strong> podle poměru (např. 1:1.5).
                                </td>
                                <td style={{ padding: '12px', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                                    Peroxid 6%, Vyvíječ 3%
                                </td>
                            </tr>
                            <tr>
                                <td style={{ padding: '12px', borderBottom: '1px solid var(--border-color)', fontWeight: 'bold', color: '#eab308' }}>Melír (Bleach)</td>
                                <td style={{ padding: '12px', borderBottom: '1px solid var(--border-color)' }}>
                                    Stejné chování jako Barva. Používá se pro odbarvovací prášky.
                                </td>
                                <td style={{ padding: '12px', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                                    Melírovací prášek, Light Master
                                </td>
                            </tr>
                            <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                                <td style={{ padding: '12px', borderBottom: '1px solid var(--border-color)', fontWeight: 'bold', color: '#10b981' }}>Prodej (Retail/Resale)</td>
                                <td style={{ padding: '12px', borderBottom: '1px solid var(--border-color)' }}>
                                    Určeno pro produkty na domácí použití. V nové návštěvě se řadí do sekce "Domů". Při duplikaci se obvykle nepřenáší (aby se nekopíroval nákup šamponu).
                                </td>
                                <td style={{ padding: '12px', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                                    Šampon na doma, Maska 250ml
                                </td>
                            </tr>
                            <tr>
                                <td style={{ padding: '12px', borderBottom: '1px solid var(--border-color)', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Ostatní (Péče/Styling)</td>
                                <td style={{ padding: '12px', borderBottom: '1px solid var(--border-color)' }}>
                                    Běžné produkty pro použití v salonu (laky, masky u mytí). Nemají speciální logiku míchání.
                                </td>
                                <td style={{ padding: '12px', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                                    Lak na vlasy, Hloubková kúra
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div style={{ marginTop: 'var(--spacing-lg)', padding: 'var(--spacing-md)', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                    <strong style={{ color: '#ef4444' }}>💡 Tip:</strong> Pokud se při duplikaci staré návštěvy neukazuje oxidant nebo receptura, <strong>zkontrolujte, zda má produkt nastavenou kategorii "Oxidant" nebo "Barva"</strong>. Pokud je veden jako "Ostatní", systém ho nerozpozná.
                </div>

                <div style={{ marginTop: 'var(--spacing-lg)', textAlign: 'right' }}>
                    <button onClick={onClose} className="btn btn-primary">Rozumím</button>
                </div>
            </div>
        </div>
    );
}
