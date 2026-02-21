import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

export default function Home() {
  const [backendStatus, setBackendStatus] = useState<'checking' | 'ok' | 'error'>('checking');

  useEffect(() => {
    axios
      .get('/api/')
      .then(() => setBackendStatus('ok'))
      .catch(() => setBackendStatus('error'));
  }, []);

  const quickActions = [
    {
      to: '/customers/register',
      label: 'お客様登録',
      description: '新規お客様の基本情報・詳細を登録',
      icon: '👤',
    },
    // Placeholders for future routes
    { to: '/customers', label: 'お客様一覧', description: '登録済みお客様の検索・一覧', icon: '📋' },
    { to: '/visit-records', label: '来店記録', description: '来店・売上記録の入力・照会', icon: '📅' },
    { to: '#', label: '日次サマリー', description: '日別売上・経費・人件費の集計', icon: '📊' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-sakura-50/60 to-washi">
      {/* Hero */}
      <header className="border-b border-gray-100 bg-white/70 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 tracking-tight">
                顧客管理・売上システム
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Customer Management & Sales System
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                  backendStatus === 'ok'
                    ? 'bg-green-50 text-green-700'
                    : backendStatus === 'error'
                    ? 'bg-red-50 text-red-600'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    backendStatus === 'ok' ? 'bg-green-500' : backendStatus === 'error' ? 'bg-red-500' : 'bg-gray-400 animate-pulse'
                  }`}
                />
                {backendStatus === 'ok' ? 'API接続済み' : backendStatus === 'error' ? 'API未接続' : '接続確認中'}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Quick stats placeholder */}
        <section className="mb-10">
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">概要</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: '登録顧客数', value: '—', sub: '件' },
              { label: '今月の新規', value: '—', sub: '件' },
              { label: '今月売上', value: '—', sub: '円' },
              { label: '本日の来店', value: '—', sub: '件' },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl bg-white/80 border border-gray-100 shadow-soft p-4 sm:p-5"
              >
                <p className="text-xs font-medium text-gray-500">{item.label}</p>
                <p className="mt-1 text-xl sm:text-2xl font-semibold text-gray-900">
                  {item.value}
                  <span className="text-sm font-normal text-gray-500 ml-0.5">{item.sub}</span>
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Quick actions */}
        <section>
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">クイックアクション</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action) => {
              const isAvailable = action.to !== '#';
              const cardClass = `rounded-xl border bg-white/90 shadow-soft p-5 transition-all ${
                isAvailable
                  ? 'border-gray-100 hover:border-sakura-200 hover:shadow-md hover:bg-white cursor-pointer'
                  : 'border-gray-100 opacity-75 cursor-not-allowed'
              }`;
              const content = (
                <>
                  <span className="text-2xl" aria-hidden>{action.icon}</span>
                  <h3 className="mt-3 font-medium text-gray-900">{action.label}</h3>
                  <p className="mt-1 text-sm text-gray-500">{action.description}</p>
                  {isAvailable && (
                    <span className="mt-3 inline-block text-sm font-medium text-sakura-500">
                      開く →
                    </span>
                  )}
                </>
              );
              return isAvailable ? (
                <Link key={action.label} to={action.to} className={cardClass}>
                  {content}
                </Link>
              ) : (
                <div key={action.label} className={cardClass}>
                  {content}
                </div>
              );
            })}
          </div>
        </section>

        {/* Footer note */}
        <p className="mt-12 text-center text-xs text-gray-400">
          顧客情報の取り扱いには十分ご注意ください。
        </p>
      </main>
    </div>
  );
}
