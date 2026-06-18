import { Link, useLocation, Navigate } from 'react-router-dom';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Printer, Tags, FileStack, PenTool, Sliders, Store, LogOut, Lock } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { AdminLoginModal } from './AdminLoginModal';
import { api } from '../services/api';

const userNav = [
  { to: '/', label: 'Print Labels', icon: Printer },
  { to: '/labels', label: 'Label Data', icon: Tags },
];

const adminNav = [
  { to: '/admin/formats', label: 'Sticker Formats', icon: FileStack },
  { to: '/admin/designs', label: 'Label Design', icon: PenTool },
  { to: '/admin/adjustment', label: 'Print Adjustment', icon: Sliders },
  { to: '/admin/shop', label: 'Shop Setup', icon: Store },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { isAdmin, login, setup, logout } = useAuthStore();
  const [showLogin, setShowLogin] = useState(false);

  const { data: adminStatus } = useQuery({
    queryKey: ['adminStatus'],
    queryFn: api.settings.getAdminStatus,
  });

  return (
    <div className="flex min-h-screen">
      <aside className="no-print fixed left-0 top-0 z-40 flex h-full w-72 flex-col border-r border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-6 py-6">
          <h1 className="text-xl font-bold text-brand-700">Label Print</h1>
          <p className="text-sm text-slate-500">Jewellery Sticker System</p>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {userNav.map(({ to, label, icon: Icon }) => {
            const active = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={`flex min-h-[52px] items-center gap-3 rounded-2xl px-5 py-4 text-xl font-bold transition ${
                  active
                    ? 'bg-brand-600 text-white shadow-md'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Icon className="h-7 w-7" />
                {label}
              </Link>
            );
          })}

          {isAdmin && (
            <>
              <div className="my-4 border-t border-slate-200 pt-4">
                <p className="mb-2 px-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                  Admin
                </p>
              </div>
              {adminNav.map(({ to, label, icon: Icon }) => {
                const active = location.pathname === to;
                return (
                  <Link
                    key={to}
                    to={to}
                    className={`flex min-h-[48px] items-center gap-3 rounded-2xl px-5 py-3 text-lg font-semibold transition ${
                      active
                        ? 'bg-slate-800 text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="h-6 w-6" />
                    {label}
                  </Link>
                );
              })}
            </>
          )}
        </nav>

        <div className="border-t border-slate-200 p-4">
          {isAdmin ? (
            <button
              type="button"
              onClick={logout}
              className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl text-base font-semibold text-slate-600 hover:bg-slate-100"
            >
              <LogOut className="h-5 w-5" />
              Lock Admin
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowLogin(true)}
              className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl text-base font-semibold text-slate-500 hover:bg-slate-100"
            >
              <Lock className="h-5 w-5" />
              Admin
            </button>
          )}
        </div>
      </aside>

      <main className="no-print ml-72 flex-1 p-6 sm:p-8">{children}</main>

      <AdminLoginModal
        open={showLogin}
        passwordSet={adminStatus?.passwordSet ?? false}
        onClose={() => setShowLogin(false)}
        onLogin={login}
        onSetup={setup}
      />
    </div>
  );
}

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const isAdmin = useAuthStore((s) => s.isAdmin);
  if (!isAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

export function EmptyState({
  message,
  action,
}: {
  message: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="card flex flex-col items-center py-16 text-center">
      <p className="text-xl text-slate-600">{message}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
    </div>
  );
}
