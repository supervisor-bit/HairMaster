import { useState, useEffect } from 'react';
import { useToast } from '../components/Toast';

import { useAuth } from '../contexts/AuthContext';
import { updatePassword } from 'firebase/auth'; // [NEW] Import updatePassword
import { useSalonInfo } from '../hooks/useSalonInfo';

export function SettingsPage() {
    const { salonInfo, updateSalonInfo } = useSalonInfo();
    const [theme, setTheme] = useState(() => {
        return localStorage.getItem('theme') || 'dark';
    });

    // Set initial theme on mount
    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') || 'dark';
        document.documentElement.setAttribute('data-theme', savedTheme);
        setTheme(savedTheme);
    }, []);

    useEffect(() => {
        localStorage.setItem('theme', theme);
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    const { addToast } = useToast();
    const { currentUser } = useAuth();



    // Helper to update local state field before saving (since hook gives read-only stream mostly, but we need editable form)
    // Actually, useSalonInfo gives the ONE source. 
    // We need a local buffer for inputs to avoid jitter, or just update directly if we trust latency?
    // Let's create a local buffer initialized from hook data.
    const [formData, setFormData] = useState(salonInfo);

    useEffect(() => {
        if (salonInfo) setFormData(salonInfo);
    }, [salonInfo]);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // Override handleSave to use formData
    const saveChanges = async () => {
        try {
            await updateSalonInfo(formData);
            addToast('Nastavení uloženo na cloud ☁️', 'success');
        } catch (error) {
            console.error(error);
            addToast('Chyba při ukládání.', 'error');
        }
    }

    // Password Change Logic
    const [passwords, setPasswords] = useState({ new: '', confirm: '' });

    const handlePasswordChange = async () => {
        if (passwords.new !== passwords.confirm) {
            addToast('Hesla se neshodují', 'error');
            return;
        }
        if (passwords.new.length < 6) {
            addToast('Heslo musí mít alespoň 6 znaků', 'warning');
            return;
        }

        try {
            if (currentUser) {
                await updatePassword(currentUser, passwords.new);
                addToast('Heslo úspěšně změněno 🔐', 'success');
                setPasswords({ new: '', confirm: '' });
            }
        } catch (error) {
            console.error(error);
            if (error.code === 'auth/requires-recent-login') {
                addToast('Pro změnu hesla se prosím odhlašte a znovu přihlašte.', 'warning');
            } else {
                addToast('Chyba při změně hesla: ' + error.message, 'error');
            }
        }
    };



    return (
        <div className="page-layout fade-in">
            <header className="page-header">
                <div>
                    <h2 style={{ fontSize: '1.8rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '2rem' }}>⚙</span>
                        Nastavení
                    </h2>
                    <p className="text-muted">Konfigurace aplikace a informace o salonu</p>
                </div>
            </header>

            <div className="content-area">
                {/* SETTINGS CONTENT */}
                <div style={{ maxWidth: '800px', margin: '0 auto', display: 'grid', gap: 'var(--spacing-lg)' }}>

                    {/* Theme Section */}
                    <div className="card">
                        <h3 style={{ marginBottom: 'var(--spacing-md)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span>◐</span> V vzhled aplikace
                        </h3>

                        <div style={{ display: 'flex', gap: 'var(--spacing-md)', alignItems: 'center' }}>
                            <label style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                                Barevný režim:
                            </label>
                            <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                                <button
                                    onClick={() => setTheme('dark')}
                                    className={theme === 'dark' ? 'btn btn-primary' : 'btn btn-secondary'}
                                    style={{
                                        padding: '8px 16px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem'
                                    }}
                                >
                                    <span>◐</span> Tmavý
                                </button>
                                <button
                                    onClick={() => setTheme('light')}
                                    className={theme === 'light' ? 'btn btn-primary' : 'btn btn-secondary'}
                                    style={{
                                        padding: '8px 16px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem'
                                    }}
                                >
                                    <span>○</span> Světlý
                                </button>
                            </div>
                        </div>

                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 'var(--spacing-md)' }}>
                            Změna se projeví okamžitě
                        </p>
                    </div>



                    {/* Salon Info Section */}
                    <div className="card">
                        <h3 style={{ marginBottom: 'var(--spacing-md)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span>✂</span> Informace o salonu
                        </h3>

                        <div style={{ display: 'grid', gap: 'var(--spacing-md)' }}>
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
                                    Název salonu
                                </label>
                                <input
                                    type="text"
                                    placeholder="Např. HairMaster Salon"
                                    value={formData.name || ''}
                                    onChange={e => handleChange('name', e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px',
                                        borderRadius: '10px',
                                        border: '2px solid var(--border-color)',
                                        background: 'var(--bg-tertiary)',
                                        color: 'var(--text-primary)',
                                        fontSize: '1rem'
                                    }}
                                />
                            </div>

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
                                        <span style={{ fontSize: '1.2rem' }}>☎</span>
                                        Telefon
                                    </label>
                                    <input
                                        type="tel"
                                        placeholder="+420 123 456 789"
                                        value={formData.phone || ''}
                                        onChange={e => handleChange('phone', e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '12px 16px',
                                            borderRadius: '10px',
                                            border: '2px solid var(--border-color)',
                                            background: 'var(--bg-tertiary)',
                                            color: 'var(--text-primary)',
                                            fontSize: '1rem'
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
                                        <span style={{ fontSize: '1.2rem' }}>@</span>
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        placeholder="salon@example.com"
                                        value={formData.email || ''}
                                        onChange={e => handleChange('email', e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '12px 16px',
                                            borderRadius: '10px',
                                            border: '2px solid var(--border-color)',
                                            background: 'var(--bg-tertiary)',
                                            color: 'var(--text-primary)',
                                            fontSize: '1rem'
                                        }}
                                    />
                                </div>
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
                                    <span style={{ fontSize: '1.2rem' }}>◉</span>
                                    Adresa
                                </label>
                                <input
                                    type="text"
                                    placeholder="Ulice 123, 120 00 Praha"
                                    value={formData.address || ''}
                                    onChange={e => handleChange('address', e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px',
                                        borderRadius: '10px',
                                        border: '2px solid var(--border-color)',
                                        background: 'var(--bg-tertiary)',
                                        color: 'var(--text-primary)',
                                        fontSize: '1rem'
                                    }}
                                />
                            </div>

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
                                        <span style={{ fontSize: '1.2rem' }}>•</span>
                                        IČO
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="12345678"
                                        value={formData.ico || ''}
                                        onChange={e => handleChange('ico', e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '12px 16px',
                                            borderRadius: '10px',
                                            border: '2px solid var(--border-color)',
                                            background: 'var(--bg-tertiary)',
                                            color: 'var(--text-primary)',
                                            fontSize: '1rem'
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
                                        <span style={{ fontSize: '1.2rem' }}>•</span>
                                        DIČ
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="CZ12345678"
                                        value={formData.dic || ''}
                                        onChange={e => handleChange('dic', e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '12px 16px',
                                            borderRadius: '10px',
                                            border: '2px solid var(--border-color)',
                                            background: 'var(--bg-tertiary)',
                                            color: 'var(--text-primary)',
                                            fontSize: '1rem'
                                        }}
                                    />
                                </div>
                            </div>
                        </div>

                        <div style={{
                            marginTop: 'var(--spacing-lg)',
                            paddingTop: 'var(--spacing-md)',
                            borderTop: '1px solid var(--border-color)'
                        }}>
                            <button
                                onClick={saveChanges}
                                className="btn btn-primary"
                                style={{ padding: '12px 24px', fontSize: '1rem', fontWeight: 600 }}
                            >
                                ✓ Uložit změny
                            </button>
                        </div>
                    </div>

                    {/* Password Change Section */}
                    <div className="card">
                        <h3 style={{ marginBottom: 'var(--spacing-md)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span>🔐</span> Změna hesla
                        </h3>
                        <div style={{ display: 'grid', gap: 'var(--spacing-md)' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Nové heslo</label>
                                    <input
                                        type="password"
                                        placeholder="Min. 6 znaků"
                                        value={passwords.new}
                                        onChange={e => setPasswords({ ...passwords, new: e.target.value })}
                                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-app)', color: 'var(--text-primary)' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Potvrzení hesla</label>
                                    <input
                                        type="password"
                                        placeholder="Zadejte znovu"
                                        value={passwords.confirm}
                                        onChange={e => setPasswords({ ...passwords, confirm: e.target.value })}
                                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-app)', color: 'var(--text-primary)' }}
                                    />
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <button
                                    className="btn btn-secondary"
                                    onClick={handlePasswordChange}
                                    disabled={!passwords.new || !passwords.confirm}
                                >
                                    Změnit heslo
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* App Info */}
                    <div className="card" style={{ background: 'rgba(139, 92, 246, 0.05)', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                        <h3 style={{ marginBottom: 'var(--spacing-sm)', fontSize: '1rem', color: 'var(--primary)' }}>
                            O aplikaci
                        </h3>
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                            <p style={{ margin: '0 0 0.5rem 0' }}>
                                <strong style={{ color: 'var(--text-primary)' }}>HairMaster</strong> - Moderní systém pro správu kadeřnického salonu
                            </p>
                            <p style={{ margin: 0 }}>
                                Verze: 1.0.0 • © {new Date().getFullYear()} Martin Vítek
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
