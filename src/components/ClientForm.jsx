import { useState, useEffect } from 'react';

export function ClientForm({ client, onSubmit, onCancel }) {
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        notes: ''
    });

    useEffect(() => {
        if (client) {
            setFormData(client);
        } else {
            setFormData({ name: '', phone: '', email: '', notes: '', tags: [] });
        }
    }, [client]);

    const handleAddTag = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const val = e.target.value.trim();
            if (val && !formData.tags?.includes(val)) {
                setFormData({ ...formData, tags: [...(formData.tags || []), val] });
                e.target.value = '';
            }
        }
    };

    const removeTag = (tagToRemove) => {
        setFormData({ ...formData, tags: (formData.tags || []).filter(t => t !== tagToRemove) });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <div className="page-layout fade-in">
            <header className="page-header">
                <div>
                    <h2 style={{ fontSize: '1.8rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '2rem' }}>●</span>
                        {client ? 'Upravit klienta' : 'Nový klient'}
                    </h2>
                    <p className="text-muted">Vyplňte základní informace o klientovi</p>
                </div>
            </header>

            <div className="content-area">
                <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
                    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 'var(--spacing-lg)' }}>
                        {/* Name Field */}
                        <div>
                            <label style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                marginBottom: 'var(--spacing-sm)',
                                color: 'var(--text-primary)',
                                fontWeight: 600,
                                fontSize: '0.9rem'
                            }}>
                                <span style={{ fontSize: '1.2rem' }}>✨</span>
                                Jméno a příjmení *
                            </label>
                            <input
                                required
                                type="text"
                                placeholder="Např. Jana Nováková"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    borderRadius: '10px',
                                    border: '2px solid var(--border-color)',
                                    background: 'var(--bg-tertiary)',
                                    color: 'var(--text-primary)',
                                    fontSize: '1rem',
                                    transition: 'border-color 0.2s, box-shadow 0.2s'
                                }}
                                onFocus={(e) => {
                                    e.target.style.borderColor = 'var(--primary)';
                                    e.target.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.1)';
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = 'var(--border-color)';
                                    e.target.style.boxShadow = 'none';
                                }}
                            />
                        </div>

                        {/* Tags Input */}
                        <div>
                            <label style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                marginBottom: 'var(--spacing-sm)',
                                color: 'var(--text-primary)',
                                fontWeight: 600,
                                fontSize: '0.9rem'
                            }}>
                                <span style={{ fontSize: '1.2rem' }}>🏷</span>
                                Štítky
                            </label>
                            <div style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: '8px',
                                padding: '8px',
                                borderRadius: '10px',
                                border: '1px solid var(--border-color)',
                                background: 'var(--bg-tertiary)',
                                minHeight: '48px'
                            }}>
                                {formData.tags?.map((tag, idx) => (
                                    <span key={idx} style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        background: 'var(--primary)',
                                        color: 'white',
                                        padding: '4px 10px',
                                        borderRadius: '16px',
                                        fontSize: '0.85rem'
                                    }}>
                                        {tag}
                                        <button
                                            type="button"
                                            onClick={() => removeTag(tag)}
                                            style={{
                                                background: 'none', border: 'none', color: 'white',
                                                cursor: 'pointer', padding: 0, marginLeft: '4px',
                                                fontSize: '1rem', lineHeight: 1
                                            }}
                                        >
                                            ×
                                        </button>
                                    </span>
                                ))}
                                <input
                                    type="text"
                                    placeholder="+ Přidat štítek (Enter)"
                                    onKeyDown={handleAddTag}
                                    style={{
                                        border: 'none',
                                        background: 'transparent',
                                        outline: 'none',
                                        color: 'var(--text-primary)',
                                        flex: 1,
                                        minWidth: '120px'
                                    }}
                                />
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                                Např.: VIP, Dlouhé vlasy, Problematická pleť...
                            </div>
                        </div>

                        {/* Phone & Notes Row */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                            <div>
                                <label style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    marginBottom: 'var(--spacing-sm)',
                                    color: 'var(--text-primary)',
                                    fontWeight: 600,
                                    fontSize: '0.9rem'
                                }}>
                                    <span style={{ fontSize: '1.2rem' }}>▸</span>
                                    Telefon
                                </label>
                                <input
                                    type="tel"
                                    placeholder="+420 123 456 789"
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px',
                                        borderRadius: '10px',
                                        border: '2px solid var(--border-color)',
                                        background: 'var(--bg-tertiary)',
                                        color: 'var(--text-primary)',
                                        fontSize: '1rem',
                                        transition: 'border-color 0.2s, box-shadow 0.2s'
                                    }}
                                    onFocus={(e) => {
                                        e.target.style.borderColor = 'var(--primary)';
                                        e.target.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.1)';
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.borderColor = 'var(--border-color)';
                                        e.target.style.boxShadow = 'none';
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    marginBottom: 'var(--spacing-sm)',
                                    color: 'var(--text-primary)',
                                    fontWeight: 600,
                                    fontSize: '0.9rem'
                                }}>
                                    <span style={{ fontSize: '1.2rem' }}>✎</span>
                                    Poznámky
                                </label>
                                <textarea
                                    placeholder="Alergie, preference, speciální požadavky..."
                                    value={formData.notes}
                                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px',
                                        borderRadius: '10px',
                                        border: '2px solid var(--border-color)',
                                        background: 'var(--bg-tertiary)',
                                        color: 'var(--text-primary)',
                                        fontSize: '1rem',
                                        minHeight: '100px',
                                        resize: 'vertical',
                                        fontFamily: 'inherit',
                                        transition: 'border-color 0.2s, box-shadow 0.2s'
                                    }}
                                    onFocus={(e) => {
                                        e.target.style.borderColor = 'var(--primary)';
                                        e.target.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.1)';
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.borderColor = 'var(--border-color)';
                                        e.target.style.boxShadow = 'none';
                                    }}
                                />
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div style={{
                            display: 'flex',
                            gap: 'var(--spacing-md)',
                            marginTop: 'var(--spacing-md)',
                            paddingTop: 'var(--spacing-md)',
                            borderTop: '1px solid var(--border-color)'
                        }}>
                            <button
                                type="submit"
                                className="btn btn-primary"
                                style={{ flex: 1, padding: '12px', fontSize: '1rem', fontWeight: 600 }}
                            >
                                ✓ Uložit klienta
                            </button>
                            <button
                                type="button"
                                onClick={onCancel}
                                className="btn btn-secondary"
                                style={{ flex: 1, padding: '12px', fontSize: '1rem' }}
                            >
                                Zrušit
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
