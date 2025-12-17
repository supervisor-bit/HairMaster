export function ConfirmDialog({ message, onConfirm, onCancel, confirmText = 'Potvrdit', cancelText = 'Zrušit' }) {
    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.8)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(5px)'
        }}>
            <div className="card fade-in" style={{
                maxWidth: '400px',
                width: '90%',
                border: '1px solid var(--border-color)',
                animation: 'fadeIn 0.2s ease-out'
            }}>
                <h3 style={{ marginBottom: 'var(--spacing-lg)', fontSize: '1.2rem' }}>
                    Potvrzení
                </h3>
                <p style={{ marginBottom: 'var(--spacing-xl)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {message}
                </p>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button
                        className="btn btn-secondary"
                        onClick={onCancel}
                        style={{ flex: 1 }}
                    >
                        {cancelText}
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={onConfirm}
                        style={{ flex: 1 }}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
