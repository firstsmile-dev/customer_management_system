import React from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import { useAuth, AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import CustomerList from './pages/CustomerList';
import CustomerRegistration from './pages/CustomerRegistration';
import VisitRecordList from './pages/VisitRecordList';
import DailySalesEntry from './pages/DailySalesEntry';
import DailyExpenseEntry from './pages/DailyExpenseEntry';
import StoreList from './pages/StoreList';
import UserList from './pages/UserList';
import StaffMemberList from './pages/StaffMemberList';
import MyPage from './pages/MyPage';

function Nav() {
  const { user, loading, logout, isAllowed } = useAuth();

  if (loading || !user) return null;

  const navLinks: { to: string; label: string }[] = [
    { to: '/', label: 'ホーム' },
    { to: '/my-page', label: 'マイページ' },
    { to: '/customers', label: 'お客様一覧' },
    { to: '/customers/register', label: 'お客様登録' },
    { to: '/visit-records', label: '来店記録' },
    { to: '/daily-sales', label: '日次売上' },
    { to: '/daily-expenses', label: '日次経費' },
    { to: '/stores', label: '店舗管理' },
    { to: '/users', label: 'ユーザー管理' },
    { to: '/staff-members', label: 'スタッフ管理' },
  ].filter(({ to }) => isAllowed(to.replace(/\/$/, '') || '/'));

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-card">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center h-14 gap-6 flex-wrap">
        {navLinks.map(({ to, label }) => (
          <Link
            key={to}
            to={to}
            className="text-gray-600 text-sm hover:text-sakura-500 transition-colors"
          >
            {label}
          </Link>
        ))}
        <div className="ml-auto flex items-center gap-3">
          <span className="text-xs text-gray-500" title={user.email}>
            {user.email}
          </span>
          <span className="text-xs text-gray-400">({user.role})</span>
          <button
            type="button"
            onClick={logout}
            className="text-sm text-gray-500 hover:text-red-600 transition-colors"
          >
            ログアウト
          </button>
        </div>
      </div>
    </nav>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-washi flex items-center justify-center">
        <p className="text-gray-500">読み込み中…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-washi">
      {user && <Nav />}
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
        <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/customers" element={<ProtectedRoute><CustomerList /></ProtectedRoute>} />
        <Route path="/customers/register" element={<ProtectedRoute><CustomerRegistration /></ProtectedRoute>} />
        <Route path="/visit-records" element={<ProtectedRoute><VisitRecordList /></ProtectedRoute>} />
        <Route path="/daily-sales" element={<ProtectedRoute><DailySalesEntry /></ProtectedRoute>} />
        <Route path="/daily-expenses" element={<ProtectedRoute><DailyExpenseEntry /></ProtectedRoute>} />
        <Route path="/stores" element={<ProtectedRoute><StoreList /></ProtectedRoute>} />
        <Route path="/users" element={<ProtectedRoute><UserList /></ProtectedRoute>} />
        <Route path="/staff-members" element={<ProtectedRoute><StaffMemberList /></ProtectedRoute>} />
        <Route path="/my-page" element={<ProtectedRoute><MyPage /></ProtectedRoute>} />
      </Routes>
    </div>
  );
}

export default App;
