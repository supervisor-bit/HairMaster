import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = 'info') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);

        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 3000);
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ addToast, removeToast }}>
            {children}
            <div style={{
                position: 'fixed',
                bottom: '20px',
                right: '20px',
                zIndex: 9999,
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                pointerEvents: 'none'
            }}>
                {toasts.map(toast => (
                    <Toast key={toast.id} {...toast} onClose={() => removeToast(toast.id)} />
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within ToastProvider');
    }
    return context;
}

function Toast({ id, message, type, onClose }) {
    const colors = {
        success: { bg: 'rgba(16, 185, 129, 0.95)', border: '#10b981', icon: '✓' },
        error: { bg: 'rgba(239, 68, 68, 0.95)', border: '#ef4444', icon: '✕' },
        info: { bg: 'rgba(59, 130, 246, 0.95)', border: '#3b82f6', icon: 'ℹ' },
        warning: { bg: 'rgba(245, 158, 11, 0.95)', border: '#f59e0b', icon: '⚠' }
    };

    const style = colors[type] || colors.info;

    return (
        <div
            className="fade-in"
            style={{
                background: style.bg,
                color: 'white',
                padding: '12px 16px',
                borderRadius: '8px',
                border: `1px solid ${style.border}`,
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                backdropFilter: 'blur(10px)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                minWidth: '250px',
                maxWidth: '400px',
                pointerEvents: 'auto',
                cursor: 'pointer',
                animation: 'slideIn 0.3s ease-out'
            }}
            onClick={onClose}
        >
            <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{style.icon}</span>
            <span style={{ flex: 1, fontSize: '0.9rem' }}>{message}</span>
        </div>
    );
}
