import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, NavLink, useLocation } from 'react-router-dom';
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
import DailyReportList from './pages/DailyReportList';
import StoreList from './pages/StoreList';
import UserList from './pages/UserList';
import StaffMemberList from './pages/StaffMemberList';
import MyPage from './pages/MyPage';
import PerformanceTargetList from './pages/PerformanceTargetList';
import StoreTargetList from './pages/StoreTargetList';
import StoreCastOverview from './pages/StoreCastOverview';
import MonthlyStoreRankings from './pages/MonthlyStoreRankings';
import HostSalarySettings from './pages/HostSalarySettings';
import PersonalLedger from './pages/PersonalLedger';
import type { AuthUser } from './types/auth';

const NAV_LINKS: { to: string; label: string }[] = [
  { to: '/', label: 'ホーム' },
  { to: '/my-page', label: 'マイページ' },
  { to: '/performance-targets', label: '売上目標' },
  { to: '/store-targets', label: '店舗目標' },
  { to: '/store-cast-overview', label: 'キャスト状況' },
  { to: '/customers', label: 'お客様一覧' },
  { to: '/customers/register', label: 'お客様登録' },
  { to: '/visit-records', label: '来店記録' },
  { to: '/daily-sales', label: '日次売上' },
  { to: '/daily-expenses', label: '日次経費' },
  { to: '/daily-reports', label: '日報' },
  { to: '/personal-ledger', label: '家計簿' },
  { to: '/host-salary-settings', label: '給与設定(ホスト)' },
  { to: '/stores', label: '店舗管理' },
  { to: '/users', label: 'ユーザー管理' },
  { to: '/staff-members', label: 'スタッフ管理' },
  { to: '/monthly-rankings', label: '当月ランキング' },
];

function SidebarLayout({ children, user }: { children: React.ReactNode; user: AuthUser }) {
  const { logout, isAllowed } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const navLinks = NAV_LINKS.filter(({ to }) => isAllowed(to.replace(/\/$/, '') || '/'));

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    [
      'block rounded-lg px-3 py-2 text-sm transition-colors',
      isActive ? 'bg-sakura-50 font-medium text-sakura-700' : 'text-gray-700 hover:bg-gray-50 hover:text-sakura-600',
    ].join(' ');

  return (
    <div className="flex min-h-screen bg-washi">
      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/30 md:hidden"
          aria-label="メニューを閉じる"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[15.5rem] flex-col border-r border-gray-100 bg-white shadow-sm transition-transform duration-200 ease-out md:static md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-14 shrink-0 items-center gap-2 border-b border-gray-100 px-3 md:h-[3.75rem]">
          <span className="min-w-0 flex-1 truncate text-sm font-semibold leading-tight text-gray-900">
            顧客管理・売上
          </span>
          <button
            type="button"
            className="shrink-0 rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-800 md:hidden"
            aria-label="サイドバーを閉じる"
            onClick={() => setMobileOpen(false)}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto overscroll-contain px-2 py-3" aria-label="メインメニュー">
          {navLinks.map(({ to, label }) => (
            <NavLink key={to} to={to} end={to === '/'} className={navLinkClass}>
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="shrink-0 border-t border-gray-100 p-3">
          <p className="truncate text-xs text-gray-500" title={user.email}>
            {user.email}
          </p>
          <p className="text-xs text-gray-400">{USER_ROLE_LABELS[user.role] ?? user.role}</p>
          <button
            type="button"
            onClick={logout}
            className="mt-2 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-gray-600 hover:bg-red-50 hover:text-red-700"
          >
            <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h4a2 2 0 012 2v1" />
            </svg>
            ログアウト
          </button>
        </div>
      </aside>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-gray-100 bg-white/95 px-4 backdrop-blur md:hidden">
          <button
            type="button"
            className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            aria-expanded={mobileOpen}
            aria-label="メニューを開く"
            onClick={() => setMobileOpen(true)}
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="truncate text-sm font-medium text-gray-800">メニュー</span>
        </header>
        <main className="min-h-0 flex-1">{children}</main>
      </div>
    </div>
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

  const appRoutes = (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/" replace /> : <Register />} />
      <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
      <Route path="/customers" element={<ProtectedRoute><CustomerList /></ProtectedRoute>} />
      <Route path="/customers/register" element={<ProtectedRoute><CustomerRegistration /></ProtectedRoute>} />
      <Route path="/visit-records" element={<ProtectedRoute><VisitRecordList /></ProtectedRoute>} />
      <Route path="/daily-sales" element={<ProtectedRoute><DailySalesEntry /></ProtectedRoute>} />
      <Route path="/daily-expenses" element={<ProtectedRoute><DailyExpenseEntry /></ProtectedRoute>} />
      <Route path="/daily-reports" element={<ProtectedRoute><DailyReportList /></ProtectedRoute>} />
      <Route path="/store-targets" element={<ProtectedRoute><StoreTargetList /></ProtectedRoute>} />
      <Route path="/stores" element={<ProtectedRoute><StoreList /></ProtectedRoute>} />
      <Route path="/users" element={<ProtectedRoute><UserList /></ProtectedRoute>} />
      <Route path="/staff-members" element={<ProtectedRoute><StaffMemberList /></ProtectedRoute>} />
      <Route path="/my-page" element={<ProtectedRoute><MyPage /></ProtectedRoute>} />
      <Route path="/performance-targets" element={<ProtectedRoute><PerformanceTargetList /></ProtectedRoute>} />
      <Route path="/store-cast-overview" element={<ProtectedRoute><StoreCastOverview /></ProtectedRoute>} />
      <Route path="/monthly-rankings" element={<ProtectedRoute><MonthlyStoreRankings /></ProtectedRoute>} />
      <Route path="/host-salary-settings" element={<ProtectedRoute><HostSalarySettings /></ProtectedRoute>} />
      <Route path="/personal-ledger" element={<ProtectedRoute><PersonalLedger /></ProtectedRoute>} />
    </Routes>
  );

  if (!user) {
    return <div className="min-h-screen bg-washi">{appRoutes}</div>;
  }

  return <SidebarLayout user={user}>{appRoutes}</SidebarLayout>;
}

export default App;
