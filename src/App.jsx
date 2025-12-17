import { useState, useEffect } from 'react'
import { ClientsPage } from './pages/ClientsPage'
import { ProductsPage } from './pages/ProductsPage'
import { Dashboard } from './components/Dashboard'
import { Layout } from './components/Layout'
import { ToastProvider } from './components/Toast'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import './index.css'

import { StockInPage } from './pages/StockInPage';
import { StockOutPage } from './pages/StockOutPage';
import { StocktakePage } from './pages/StocktakePage';
import { RevenuePage } from './pages/RevenuePage';
import { OrderPage } from './pages/OrderPage';
import { SettingsPage } from './pages/SettingsPage'
import { CalendarPage } from './pages/CalendarPage'

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [pageParams, setPageParams] = useState(null);

  // Initialize theme on app mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const handleNavigate = (page, params = null) => {
    setCurrentPage(page);
    setPageParams(params);
  };

  const renderContent = () => {
    switch (currentPage) {
      case 'calendar':
        return <CalendarPage onNavigate={handleNavigate} />;
      case 'clients':
        return <ClientsPage params={pageParams} />;
      case 'products':
        return <ProductsPage />;
      case 'stockin':
        return <StockInPage />;
      case 'stockout':
        return <StockOutPage />;
      case 'stocktake':
        return <StocktakePage />;
      case 'revenue':
        return <RevenuePage />;
      case 'orders':
        return <OrderPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <Dashboard onNavigate={handleNavigate} />;
    }
  };

  return (
    <ToastProvider>
      <AuthProvider>
        <ProtectedRoute>
          <Layout onNavigate={handleNavigate} currentPage={currentPage}>
            {renderContent()}
          </Layout>
        </ProtectedRoute>
      </AuthProvider>
    </ToastProvider>
  )
}

export default App
