import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/Toast';

export function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);
    const [loading, setLoading] = useState(false);
    const { login, signup } = useAuth();
    const { addToast } = useToast();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (password.length < 6) {
            addToast('Heslo musí mít alespoň 6 znaků.', 'warning');
            return;
        }

        try {
            setLoading(true);
            if (isRegistering) {
                await signup(email, password);
                addToast('Účet vytvořen! Vítejte.', 'success');
            } else {
                await login(email, password);
                addToast('Vítejte zpět!', 'success');
            }
            // Redirection handled by ProtectedRoute
        } catch (error) {
            console.error(error);
            let msg = 'Chyba přihlášení.';
            if (error.code === 'auth/email-already-in-use') msg = 'Email je již registrován.';
            if (error.code === 'auth/wrong-password') msg = 'Špatné heslo.';
            if (error.code === 'auth/user-not-found') msg = 'Uživatel nenalezen.';
            if (error.code === 'auth/weak-password') msg = 'Heslo je příliš slabé.';
            addToast(msg, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            // background: 'var(--bg-app)', // OFF: Let global mesh gradient show
            padding: '20px'
        }}>
            <div className="card fade-in" style={{
                width: '100%',
                maxWidth: '420px',
                padding: 'var(--spacing-xl)',
                background: 'rgba(30, 41, 59, 0.3)', // More transparent
                backdropFilter: 'blur(20px)',         // Strong blur
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                borderRadius: 'var(--radius-xl)'
            }}>
                <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-xl)' }}>
                    <h1 style={{
                        fontSize: '2.5rem',
                        fontWeight: '800',
                        marginBottom: 'var(--spacing-xs)',
                        background: 'linear-gradient(to right, #fff, #94a3b8)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}>
                        HairMaster <span style={{ fontSize: '2rem' }}>🔐</span>
                    </h1>
                    <p className="text-muted" style={{ fontSize: '1.1rem' }}>
                        {isRegistering ? 'Vytvořit nový účet' : 'Vítejte zpět'}
                    </p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Email</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '14px',
                                borderRadius: '12px',
                                border: '1px solid rgba(255,255,255,0.1)',
                                background: 'rgba(0,0,0,0.2)',
                                color: 'white',
                                fontSize: '1rem',
                                transition: 'all 0.2s'
                            }}
                            onFocus={(e) => {
                                e.target.style.background = 'rgba(0,0,0,0.4)';
                                e.target.style.borderColor = 'var(--primary)';
                            }}
                            onBlur={(e) => {
                                e.target.style.background = 'rgba(0,0,0,0.2)';
                                e.target.style.borderColor = 'rgba(255,255,255,0.1)';
                            }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Heslo</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder={isRegistering ? 'Min. 6 znaků' : ''}
                            style={{
                                width: '100%',
                                padding: '14px',
                                borderRadius: '12px',
                                border: '1px solid rgba(255,255,255,0.1)',
                                background: 'rgba(0,0,0,0.2)',
                                color: 'white',
                                fontSize: '1rem',
                                transition: 'all 0.2s'
                            }}
                            onFocus={(e) => {
                                e.target.style.background = 'rgba(0,0,0,0.4)';
                                e.target.style.borderColor = 'var(--primary)';
                            }}
                            onBlur={(e) => {
                                e.target.style.background = 'rgba(0,0,0,0.2)';
                                e.target.style.borderColor = 'rgba(255,255,255,0.1)';
                            }}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="btn"
                        style={{
                            width: '100%',
                            padding: '14px',
                            marginTop: 'var(--spacing-sm)',
                            fontSize: '1.1rem',
                            fontWeight: '600',
                            background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                            border: 'none',
                            borderRadius: '12px',
                            color: 'white',
                            cursor: loading ? 'wait' : 'pointer',
                            boxShadow: '0 10px 20px -5px rgba(139, 92, 246, 0.4)',
                            transition: 'transform 0.1s'
                        }}
                        onMouseDown={!loading ? e => e.target.style.transform = 'scale(0.98)' : null}
                        onMouseUp={!loading ? e => e.target.style.transform = 'scale(1)' : null}
                    >
                        {loading ? 'Pracuji...' : (isRegistering ? 'Vytvořit účet' : 'Přihlásit se')}
                    </button>

                    <div style={{ textAlign: 'center', marginTop: 'var(--spacing-sm)' }}>
                        <button
                            type="button"
                            className="btn btn-ghost"
                            onClick={() => setIsRegistering(!isRegistering)}
                            style={{ fontSize: '0.9rem', opacity: 0.7, color: 'var(--text-secondary)' }}
                        >
                            {isRegistering ? 'Již máte účet? Přihlásit se' : 'Nemáte účet? Registrovat'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
