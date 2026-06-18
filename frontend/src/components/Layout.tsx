import { Link, useLocation } from 'react-router-dom';
import { Printer, Tags, PenTool, Sliders, Store, FolderTree } from 'lucide-react';

const nav = [
  { to: '/', label: 'Print Labels', icon: Printer },
  { to: '/labels', label: 'Products', icon: Tags },
  { to: '/admin/categories', label: 'Categories', icon: FolderTree },
  { to: '/admin/designs', label: 'Label Design', icon: PenTool },
  { to: '/admin/adjustment', label: 'Print Adjustment', icon: Sliders },
  { to: '/admin/shop', label: 'Shop Setup', icon: Store },
];

function isNavActive(pathname: string, to: string): boolean {
  if (to === '/') return pathname === '/';
  return pathname === to || pathname.startsWith(`${to}/`);
}

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  return (
    <div className="flex min-h-screen">
      <aside className="no-print fixed left-0 top-0 z-40 flex h-full w-72 flex-col border-r border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-6 py-6">
          <h1 className="text-xl font-bold text-brand-700">Label Print</h1>
          <p className="text-sm text-slate-500">Jewellery Sticker System</p>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {nav.map(({ to, label, icon: Icon }) => {
            const active = isNavActive(location.pathname, to);
            return (
              <Link
                key={to}
                to={to}
                className={`flex min-h-[48px] items-center gap-3 rounded-2xl px-5 py-3 text-lg font-semibold transition ${
                  active
                    ? 'bg-brand-600 text-white shadow-md'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Icon className="h-6 w-6 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <main className="app-main no-print ml-72 min-w-0 flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  );
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
