import { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AppLayout from './pages/AppLayout';

export default function App() {
  const { user, loading, error, login, register, logout, isAuthenticated } = useAuth();
  const [page, setPage] = useState<'login' | 'register' | 'app'>('login');

  // If token exists in localStorage, go straight to app
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#6DADD1] to-[#4A90D9] flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  // Auto-redirect to app if authenticated
  if (isAuthenticated && page !== 'app') {
    setPage('app');
  }

  if (page === 'register') {
    return <RegisterPage onRegister={register} onGoLogin={() => setPage('login')} error={error} />;
  }

  if (page === 'app') {
    return <AppLayout user={user} onLogout={() => { logout(); setPage('login'); }} />;
  }

  return <LoginPage onLogin={login} onGoRegister={() => setPage('register')} error={error} />;
}
