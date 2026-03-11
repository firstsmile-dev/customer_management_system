import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import { useAuth, AuthProvider } from './contexts/AuthContext';
import { USER_ROLE_LABELS } from './types/user';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import CustomerList from './pages/CustomerList';
import CustomerRegistration from './pages/CustomerRegistration';
import VisitRecordList from './pages/VisitRecordList';
import DailySalesEntry from './pages/DailySalesEntry';
import DailyExpenseEntry from './pages/DailyExpenseEntry';
import StoreList from './pages/StoreList';
import UserList from './pages/UserList';
import StaffMemberList from './pages/StaffMemberList';
import MyPage from './pages/MyPage';
import PerformanceTargetList from './pages/PerformanceTargetList';

const HamburgerIcon = ({ open }: { open: boolean }) => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    {open ? (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    ) : (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    )}
  </svg>
);

function Nav() {
  const { user, loading, logout, isAllowed } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  if (loading || !user) return null;

  const navLinks: { to: string; label: string }[] = [
    { to: '/', label: 'ホーム' },
    { to: '/my-page', label: 'マイページ' },
    { to: '/performance-targets', label: '売上目標' },
    { to: '/customers', label: 'お客様一覧' },
    { to: '/customers/register', label: 'お客様登録' },
    { to: '/visit-records', label: '来店記録' },
    { to: '/daily-sales', label: '日次売上' },
    { to: '/daily-expenses', label: '日次経費' },
    { to: '/stores', label: '店舗管理' },
    { to: '/users', label: 'ユーザー管理' },
    { to: '/staff-members', label: 'スタッフ管理' },
  ].filter(({ to }) => isAllowed(to.replace(/\/$/, '') || '/'));

  const linkClass = 'text-gray-600 text-sm hover:text-sakura-500 transition-colors';
  const mobileLinkClass = 'block py-3 px-4 text-gray-700 hover:bg-gray-50 hover:text-sakura-500 border-b border-gray-100 last:border-0';

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Desktop: nav links (hidden below 768px) */}
          <div className="hidden md:flex items-center gap-6 flex-1">
            {navLinks.map(({ to, label }) => (
              <Link key={to} to={to} className={linkClass}>
                {label}
              </Link>
            ))}
          </div>
          {/* Desktop: user + logout (hidden below 768px) */}
          <div className="hidden md:flex items-center gap-3 ml-auto">
            <span className="text-xs text-gray-500" title={user.email}>
              {user.email}
            </span>
            <span className="text-xs text-gray-400">({USER_ROLE_LABELS[user.role] ?? user.role})</span>
            <button
              type="button"
              onClick={logout}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-600 transition-colors"
              aria-label="ログアウト"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h4a2 2 0 012 2v1" />
              </svg>
            </button>
          </div>
          {/* Mobile: hamburger (visible only below 768px) */}
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="md:hidden p-2 -mr-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? 'メニューを閉じる' : 'メニューを開く'}
          >
            <HamburgerIcon open={menuOpen} />
          </button>
        </div>
        {/* Mobile: dropdown menu (visible only below 768px when open) */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-200 ease-out ${
            menuOpen ? 'max-h-[80vh] opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="py-2 border-t border-gray-100 bg-white">
            {navLinks.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={mobileLinkClass}
                onClick={() => setMenuOpen(false)}
              >
                {label}
              </Link>
            ))}
            <div className="px-4 py-3 border-t border-gray-100 mt-2 space-y-1">
              <p className="text-xs text-gray-500 truncate" title={user.email}>
                {user.email}
              </p>
              <p className="text-xs text-gray-400">{USER_ROLE_LABELS[user.role] ?? user.role}</p>
              <button
                type="button"
                onClick={() => { setMenuOpen(false); logout(); }}
                className="mt-2 w-full text-left py-2 px-4 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                ログアウト
              </button>
            </div>
          </div>
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
        <Route path="/register" element={user ? <Navigate to="/" replace /> : <Register />} />
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
        <Route path="/performance-targets" element={<ProtectedRoute><PerformanceTargetList /></ProtectedRoute>} />
      </Routes>
    </div>
  );
}

export default App;
