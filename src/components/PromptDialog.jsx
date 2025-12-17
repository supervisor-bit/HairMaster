import { useState, useEffect, useRef } from 'react';

export function PromptDialog({ title, message, initialValue = '', placeholder = '', onConfirm, onCancel, confirmText = 'Potvrdit', cancelText = 'Zrušit' }) {
    const [value, setValue] = useState(initialValue);
    const inputRef = useRef(null);

    // Auto-focus input on mount
    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        onConfirm(value);
    };

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
            <form onSubmit={handleSubmit} className="card fade-in" style={{
                maxWidth: '400px',
                width: '90%',
                border: '1px solid var(--border-color)',
                animation: 'fadeIn 0.2s ease-out'
            }}>
                <h3 style={{ marginBottom: 'var(--spacing-md)', fontSize: '1.2rem' }}>
                    {title}
                </h3>
                {message && (
                    <p style={{ marginBottom: 'var(--spacing-md)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        {message}
                    </p>
                )}

                <input
                    ref={inputRef}
                    type="text"
                    value={value}
                    onChange={e => setValue(e.target.value)}
                    placeholder={placeholder}
                    style={{
                        marginBottom: 'var(--spacing-lg)',
                        background: 'var(--bg-tertiary)',
                        border: '1px solid var(--border-color)'
                    }}
                />

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={onCancel}
                        style={{ flex: 1 }}
                    >
                        {cancelText}
                    </button>
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={!value.trim()}
                        style={{ flex: 1 }}
                    >
                        {confirmText}
                    </button>
                </div>
            </form>
        </div>
    );
}
