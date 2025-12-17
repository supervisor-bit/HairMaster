import { useState } from 'react';
import { useVisits } from '../hooks/useVisits'; // Import hook

export function ClientList({ clients, onSelect, onDelete }) {
    const [search, setSearch] = useState('');
    const [activeTag, setActiveTag] = useState(null);
    const { getVisitsByClient } = useVisits(); // Use hook

    // Get unique tags from all clients
    const uniqueTags = [...new Set(clients.flatMap(c => c.tags || []))].sort();

    const filtered = clients.filter(c => {
        const searchNormalized = search.toLowerCase().trim();
        const searchDigits = searchNormalized.replace(/\s+/g, '');

        const matchesName = c.name.toLowerCase().includes(searchNormalized);

        let matchesPhone = false;
        if (c.phone) {
            // Remove spaces from stored phone for comparison
            const phoneDigits = c.phone.replace(/\s+/g, '');
            matchesPhone = phoneDigits.includes(searchDigits);
        }

        const matchesTag = activeTag ? c.tags?.includes(activeTag) : true;

        return (matchesName || matchesPhone) && matchesTag;
    });

    return (

        <div className="card full-height-card fade-in">
            <div className="card-header-area" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                {/* Tag Filters */}
                {uniqueTags.length > 0 && (
                    <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none' }}>
                        <button
                            onClick={() => setActiveTag(null)}
                            style={{
                                padding: '4px 12px',
                                borderRadius: '16px',
                                border: '1px solid var(--border-color)',
                                background: activeTag === null ? 'var(--primary)' : 'transparent',
                                color: activeTag === null ? 'white' : 'var(--text-secondary)',
                                fontSize: '0.8rem',
                                whiteSpace: 'nowrap',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                fontWeight: activeTag === null ? 600 : 400
                            }}
                        >
                            Vše
                        </button>
                        {uniqueTags.map(tag => (
                            <button
                                key={tag}
                                onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                                style={{
                                    padding: '4px 12px',
                                    borderRadius: '16px',
                                    border: '1px solid var(--border-color)',
                                    background: activeTag === tag ? 'var(--primary)' : 'var(--bg-tertiary)',
                                    color: activeTag === tag ? 'white' : 'var(--text-secondary)',
                                    fontSize: '0.8rem',
                                    whiteSpace: 'nowrap',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    fontWeight: activeTag === tag ? 600 : 400
                                }}
                            >
                                {tag}
                            </button>
                        ))}
                    </div>
                )}

                <div style={{ position: 'relative', width: '100%' }}>
                    <input
                        type="text"
                        placeholder="Hledat jméno, telefon..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{
                            padding: 'var(--spacing-sm)',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-color)',
                            background: 'var(--bg-input)',
                            color: 'var(--text-primary)',
                            width: '100%'
                        }}
                    />
                    <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>🔍</span>
                </div>
            </div>

            <div className="card-scroll-area">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th style={{ position: 'sticky', top: 0, background: 'var(--bg-card)', zIndex: 10 }}>Jméno</th>
                            <th style={{ position: 'sticky', top: 0, background: 'var(--bg-card)', zIndex: 10 }}>Kontakt</th>
                            <th style={{ position: 'sticky', top: 0, background: 'var(--bg-card)', zIndex: 10 }}>Poslední návštěva</th>
                            <th style={{ textAlign: 'right', position: 'sticky', top: 0, background: 'var(--bg-card)', zIndex: 10 }}>Akce</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map(client => {
                            const visits = getVisitsByClient(client.id);
                            const lastVisit = visits.length > 0 ? visits[0] : null;

                            return (
                                <tr key={client.id} style={{ cursor: 'pointer' }} onClick={() => onSelect(client)}>
                                    <td style={{ fontWeight: 500 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>
                                                {client.name.charAt(0)}
                                            </div>
                                            {client.name}
                                            {client.tags && client.tags.map((tag, i) => (
                                                <span key={i} style={{
                                                    fontSize: '0.7rem',
                                                    padding: '2px 6px',
                                                    borderRadius: '10px',
                                                    background: 'var(--bg-tertiary)',
                                                    border: '1px solid var(--border-color)',
                                                    color: 'var(--text-secondary)'
                                                }}>
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="text-muted">
                                        <div style={{ fontSize: '0.875rem' }}>{client.phone}</div>
                                        <div style={{ fontSize: '0.75rem' }}>{client.email}</div>
                                    </td>
                                    <td className="text-muted">
                                        {lastVisit ? (
                                            <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                                                {new Date(lastVisit.date).toLocaleDateString()}
                                            </span>
                                        ) : '-'}
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onDelete(client.id); }}
                                            className="btn btn-ghost"
                                            style={{ padding: '0.25rem 0.5rem', color: '#f87171' }}
                                            title="Smazat"
                                        >
                                            🗑
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                        {filtered.length === 0 && (
                            <tr>
                                <td colSpan={4} style={{ textAlign: 'center', padding: 'var(--spacing-xl)', color: 'var(--text-muted)' }}>
                                    Žádní klienti nenalezeni.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
