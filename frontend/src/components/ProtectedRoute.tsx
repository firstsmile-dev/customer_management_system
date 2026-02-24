import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** Path pattern for this route (e.g. /customers). Used for role check. */
  path?: string;
}

/**
 * Requires user to be logged in. If not, redirects to /login?next=currentPath.
 * If user is logged in but their role cannot access this path, redirects to /.
 */
export default function ProtectedRoute({ children, path: routePath }: ProtectedRouteProps) {
  const { user, loading, isAllowed } = useAuth();
  const location = useLocation();
  const currentPath = location.pathname || '/';

  if (loading) {
    return (
      <div className="min-h-screen bg-washi flex items-center justify-center">
        <p className="text-gray-500">読み込み中…</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  }

  const pathToCheck = routePath ?? currentPath;
  const normalized = pathToCheck.replace(/\/$/, '') || '/';
  if (!isAllowed(normalized)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
