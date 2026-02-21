import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import CustomerList from './pages/CustomerList';
import CustomerRegistration from './pages/CustomerRegistration';
import VisitRecordList from './pages/VisitRecordList';
import DailySalesEntry from './pages/DailySalesEntry';
import DailyExpenseEntry from './pages/DailyExpenseEntry';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-washi">
        <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-card">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center h-14 gap-6">
            <Link
              to="/"
              className="text-gray-800 font-medium text-sm hover:text-sakura-500 transition-colors"
            >
              ホーム
            </Link>
            <Link
              to="/customers"
              className="text-gray-600 text-sm hover:text-sakura-500 transition-colors"
            >
              お客様一覧
            </Link>
            <Link
              to="/customers/register"
              className="text-gray-600 text-sm hover:text-sakura-500 transition-colors"
            >
              お客様登録
            </Link>
            <Link
              to="/visit-records"
              className="text-gray-600 text-sm hover:text-sakura-500 transition-colors"
            >
              来店記録
            </Link>
            <Link
              to="/daily-sales"
              className="text-gray-600 text-sm hover:text-sakura-500 transition-colors"
            >
              日次売上
            </Link>
            <Link
              to="/daily-expenses"
              className="text-gray-600 text-sm hover:text-sakura-500 transition-colors"
            >
              日次経費
            </Link>
          </div>
        </nav>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/customers" element={<CustomerList />} />
          <Route path="/customers/register" element={<CustomerRegistration />} />
          <Route path="/visit-records" element={<VisitRecordList />} />
          <Route path="/daily-sales" element={<DailySalesEntry />} />
          <Route path="/daily-expenses" element={<DailyExpenseEntry />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
