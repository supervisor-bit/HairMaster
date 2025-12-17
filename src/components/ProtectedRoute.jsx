import { useAuth } from '../contexts/AuthContext';
import { LoginPage } from '../pages/LoginPage';

export function ProtectedRoute({ children }) {
    const { currentUser } = useAuth();

    if (!currentUser) {
        return <LoginPage />;
    }

    return children;
}
