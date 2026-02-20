import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import CustomerRegistration from './pages/CustomerRegistration';

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
              to="/customers/register"
              className="text-gray-600 text-sm hover:text-sakura-500 transition-colors"
            >
              お客様登録
            </Link>
          </div>
        </nav>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/customers/register" element={<CustomerRegistration />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
