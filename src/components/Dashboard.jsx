import { useState } from 'react';
import { useClients } from '../hooks/useClients';
import { useProducts } from '../hooks/useProducts';
import { useRevenue } from '../hooks/useRevenue';
import { useAppointments } from '../hooks/useAppointments';
import { ConfirmDialog } from './ConfirmDialog';
import { seedData } from '../utils/seedData';

function StatCard({ label, value, trend, icon, color }) {
    return (
        <div className="card" style={{ position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'relative', zIndex: 1 }}>
                <div className="flex-between mb-lg">
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{label}</span>
                    <span style={{ fontSize: '1.5rem', opacity: 0.8 }}>{icon}</span>
                </div>
                <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                    {value}
                </div>
                {trend && (
                    <div style={{ fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <span style={{ color: trend > 0 ? '#4ade80' : '#f87171' }}>
                            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
                        </span>
                        <span className="text-muted">vs minulý měsíc</span>
                    </div>
                )}
            </div>
            <div style={{
                position: 'absolute',
                top: '-20%',
                right: '-10%',
                width: '120px',
                height: '120px',
                background: color,
                filter: 'blur(50px)',
                opacity: 0.15,
                borderRadius: '50%'
            }} />
        </div>
    );
}

export function Dashboard({ onNavigate }) {
    const { clients } = useClients();
    const { products } = useProducts();
    const { getDailyTotal } = useRevenue();
    const { appointments } = useAppointments();
    const [confirmDialog, setConfirmDialog] = useState(null);

    // Calculate today's appointments
    // Use local YYYY-MM-DD format to avoid UTC shifting
    const getLocalISODate = (date) => {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // Calculate today's appointments
    const today = getLocalISODate(new Date());
    const todaysApps = appointments.filter(a => a.date === today).sort((a, b) => a.time.localeCompare(b.time));

    // Enrich with client names
    const enrichedAppointments = todaysApps.map(a => {
        const client = clients.find(c => c.id === a.clientId);
        return { ...a, clientName: client?.name || 'Neznámý klient' };
    });

    const totalStock = products.reduce((sum, p) => sum + Number(p.stock), 0).toFixed(2);
    const dailyRevenue = getDailyTotal();

    const lowStockProducts = products.filter(p => {
        const hasMinStock = p.minStock !== null && p.minStock !== undefined && p.minStock !== '';
        return hasMinStock
            ? Number(p.stock) <= Number(p.minStock)
            : Number(p.stock) < 1;
    });

    return (
        <div className="page-layout fade-in">
            <header className="page-header">
                <div>
                    <h2 style={{ fontSize: '1.875rem' }}>Přehled</h2>
                    <p className="text-muted">Vítejte zpět, máte {enrichedAppointments.length} naplánovaných schůzek.</p>
                </div>

                <div className="card" style={{ marginTop: 'var(--spacing-lg)' }}>
                    <h3 style={{ marginBottom: 'var(--spacing-md)', color: 'var(--accent-primary)' }}>Rychlé akce</h3>
                    <div style={{ display: 'flex', gap: 'var(--spacing-sm)', flexWrap: 'wrap' }}>
                        <button className="btn btn-primary" onClick={() => onNavigate('clients')}>+ Přidat Klienta</button>
                        <button className="btn btn-primary" onClick={() => onNavigate('products')}>+ Přidat Produkt</button>
                        <button className="btn btn-secondary" onClick={() => onNavigate('stockin')} disabled={products.length === 0}>▲ Naskladnit</button>
                        <button className="btn btn-secondary" onClick={() => onNavigate('stockout')} disabled={products.length === 0}>🛒 Pokladna</button>
                        <button className="btn btn-secondary" onClick={() => onNavigate('orders')} disabled={products.length === 0}>📋 Objednávky</button>
                        <button className="btn btn-secondary" onClick={() => onNavigate('orders')} disabled={products.length === 0}>📋 Objednávky</button>
                    </div>
                </div>
            </header>

            <div className="content-area">
                {products.length === 0 ? (
                    <div className="card fade-in" style={{
                        gridColumn: '1 / -1',
                        textAlign: 'center',
                        padding: '60px 20px',
                        background: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-card) 100%)',
                        border: '2px dashed var(--primary)'
                    }}>
                        <div style={{ fontSize: '3rem', marginBottom: '20px' }}>👋</div>
                        <h2 className="mb-md">Vítejte v HairMaster!</h2>
                        <p className="text-muted mb-lg" style={{ maxWidth: '500px', margin: '0 auto 30px' }}>
                            Váš systém je připraven. Abychom mohli začít sledovat sklad a tržby, musíme nejdříve naskladnit vaše produkty.
                        </p>
                        <button
                            className="btn btn-primary btn-lg"
                            onClick={() => onNavigate('products')}
                            style={{ fontSize: '1.2rem', padding: '12px 32px' }}
                        >
                            📦 Založit první produkty
                        </button>
                    </div>
                ) : (
                    <>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--spacing-lg)', marginBottom: 'var(--spacing-xl)' }}>
                            <div onClick={() => onNavigate('clients')} style={{ cursor: 'pointer' }}>
                                <StatCard
                                    label="Celkem klientů"
                                    value={clients.length}
                                    trend={12}
                                    icon="👥"
                                    color="var(--primary)"
                                />
                            </div>

                            <div onClick={() => onNavigate('products')} style={{ cursor: 'pointer' }}>
                                <StatCard
                                    label="Skladové zásoby"
                                    value={totalStock}
                                    icon="■"
                                    color="var(--accent)"
                                />
                            </div>

                            <StatCard
                                label="Dnešní tržba"
                                value={`${dailyRevenue} Kč`}
                                icon="💰"
                                color="#10b981"
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--spacing-lg)' }}>
                            <div className="card">
                                <div className="flex-between mb-lg">
                                    <h3>Dnešní schůzky</h3>
                                    <button className="btn btn-ghost" style={{ fontSize: '0.8rem' }} onClick={() => onNavigate('calendar')}>📅 Kalendář</button>
                                </div>
                                {enrichedAppointments.length > 0 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {enrichedAppointments.map(app => (
                                            <div key={app.id} style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                padding: '12px',
                                                borderRadius: '8px',
                                                background: 'var(--bg-tertiary)',
                                                borderLeft: '4px solid var(--accent)'
                                            }}>
                                                <div>
                                                    <div style={{ fontWeight: 600 }}>{app.clientName}</div>
                                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                                        {app.note || 'Bez poznámky'}
                                                    </div>
                                                </div>
                                                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--primary)' }}>
                                                    {app.time}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div style={{ height: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)', background: 'rgba(0,0,0,0.1)' }}>
                                        <span className="text-muted">Žádné schůzky na dnešek</span>
                                    </div>
                                )}
                            </div>

                            <div className="card">
                                <h3 className="mb-lg" style={{ color: lowStockProducts.length > 0 ? '#f87171' : 'var(--text-primary)' }}>
                                    {lowStockProducts.length > 0 ? '▲ Doplnit sklad' : '■ Stav skladu'}
                                </h3>
                                {lowStockProducts.length > 0 ? (
                                    <ul style={{ listStyle: 'none', padding: 0 }}>
                                        {lowStockProducts.slice(0, 5).map(p => (
                                            <li key={p.id} className="flex-between" style={{ marginBottom: 'var(--spacing-sm)', paddingBottom: 'var(--spacing-xs)', borderBottom: 'var(--border-glass)' }}>
                                                <span>{p.name}</span>
                                                <span className="badge badge-warning">{Number(p.stock).toFixed(2)} ks</span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <div className="text-muted">Všechny produkty jsou naskladněny.</div>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>

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
