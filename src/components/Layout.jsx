import { useProducts } from '../hooks/useProducts';
import { useAuth } from '../contexts/AuthContext';

export function Layout({ children, onNavigate, currentPage }) {
    const { products } = useProducts();
    const { currentUser, logout } = useAuth();
    const isInventoryEmpty = products.length === 0;

    // ... (rest of navItems) ...

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            console.error("Failed to log out", error);
        }
    };

    // Helper to get initials or placeholder
    const getInitials = () => {
        if (!currentUser?.email) return '??';
        return currentUser.email.substring(0, 2).toUpperCase();
    };

    // Helper for display name
    const getDisplayName = () => {
        if (currentUser?.email) return currentUser.email.split('@')[0];
        return 'Uživatel';
    };

    const navItems = [
        { id: 'dashboard', icon: '📊', label: 'Přehled' },
        { id: 'calendar', icon: '📅', label: 'Kalendář' },
        { id: 'clients', icon: '👥', label: 'Klienti' },
        { id: 'products', icon: '📦', label: 'Inventář', highlight: isInventoryEmpty }, // Highlight if empty
        { id: 'stockin', icon: '📥', label: 'Příjem', disabled: isInventoryEmpty },
        { id: 'stockout', icon: '📤', label: 'Výdej', disabled: isInventoryEmpty },
        { id: 'stocktake', icon: '📋', label: 'Inventura', disabled: isInventoryEmpty },
        { id: 'revenue', icon: '💰', label: 'Tržby' },
        { id: 'orders', icon: '📝', label: 'Objednávky', disabled: isInventoryEmpty },
        { id: 'settings', icon: '⚙️', label: 'Nastavení' }
    ];

    return (
        <div className="app-container">
            <aside className="sidebar">
                <div style={{ marginBottom: 'var(--spacing-xl)', paddingLeft: 'var(--spacing-sm)' }}>
                    <h1 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ color: 'var(--primary)' }}>✂</span> HairMaster
                    </h1>
                </div>

                <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {navItems.map(item => (
                        <button
                            key={item.id}
                            className={`nav-item ${currentPage === item.id ? 'active' : ''} ${item.disabled ? 'disabled' : ''} ${item.highlight ? 'highlight-pulse' : ''}`}
                            onClick={() => !item.disabled && onNavigate(item.id)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '12px 16px',
                                width: '100%',
                                borderRadius: '12px',
                                background: currentPage === item.id ? 'linear-gradient(90deg, rgba(236, 72, 153, 0.2), rgba(139, 92, 246, 0.2))' : 'transparent',
                                color: currentPage === item.id ? '#fff' : 'rgba(255,255,255,0.7)',
                                border: currentPage === item.id ? '1px solid rgba(255,255,255,0.1)' : '1px solid transparent',
                                boxShadow: currentPage === item.id ? '0 4px 15px rgba(236, 72, 153, 0.2)' : 'none',
                                cursor: item.disabled ? 'not-allowed' : 'pointer',
                                textAlign: 'left',
                                fontSize: '0.95rem',
                                fontWeight: currentPage === item.id ? 600 : 400,
                                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                            onMouseEnter={(e) => {
                                if (currentPage !== item.id && !item.disabled) {
                                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                                    e.currentTarget.style.color = '#fff';
                                    e.currentTarget.style.transform = 'translateX(4px)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (currentPage !== item.id) {
                                    e.currentTarget.style.background = 'transparent';
                                    e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
                                    e.currentTarget.style.transform = 'translateX(0)';
                                }
                            }}
                        >
                            <span style={{
                                fontSize: '1.2rem',
                                filter: currentPage === item.id ? 'drop-shadow(0 0 8px rgba(236, 72, 153, 0.5))' : 'none',
                                transition: 'filter 0.3s'
                            }}>{item.icon}</span>
                            {item.label}
                            {currentPage === item.id && (
                                <div style={{
                                    position: 'absolute',
                                    left: 0,
                                    top: '15%',
                                    bottom: '15%',
                                    width: '3px',
                                    background: 'var(--accent)',
                                    borderRadius: '0 4px 4px 0',
                                    boxShadow: '0 0 10px var(--accent)'
                                }} />
                            )}
                        </button>
                    ))}
                </nav>

                <div style={{ marginTop: 'auto', paddingTop: 'var(--spacing-lg)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: '16px', padding: '8px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}>
                        <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'linear-gradient(135deg, var(--primary), var(--accent))', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.9rem', boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }}>
                            {getInitials()}
                        </div>
                        <div style={{ fontSize: '0.875rem', overflow: 'hidden' }}>
                            <div style={{ color: 'var(--text-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', maxWidth: '140px', fontWeight: 500 }}>
                                {currentUser?.email}
                            </div>
                            <div style={{ color: 'var(--success)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)', display: 'inline-block' }}></span> Online
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="btn btn-ghost"
                        style={{ width: '100%', justifyContent: 'flex-start', color: '#f87171', padding: '10px 12px', fontSize: '0.9rem', borderRadius: '10px' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(248, 113, 113, 0.1)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                        <span>🚪</span> Odhlásit se
                    </button>
                </div>
            </aside>

            <main className="main-content">
                {children}
            </main>
        </div>
    );
}
