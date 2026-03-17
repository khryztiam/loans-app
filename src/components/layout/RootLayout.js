'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/prestamos', label: 'Préstamos' },
  { href: '/asignaciones', label: 'Asignaciones' },
  { href: '/usuarios', label: 'Usuarios' },
];

export function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    const success = await logout();
    if (success) {
      router.push('/');
    }
  };

  return (
    <>
      {/* Top Header */}
      <header className="bg-gradient-to-r from-blue-800 via-blue-700 to-blue-600 text-white shadow-lg">
        <div className="container flex justify-between items-center py-4">
          <div className="flex items-center gap-3">
            <img src="/yazaki-logo.jpg" alt="Logo" className="h-10 rounded" />
            <h1 className="text-2xl font-bold">Gestión de Activos IT</h1>
          </div>

          <div className="flex items-center gap-4">
            {user && (
              <>
                <span className="text-sm text-blue-100">{user.email}</span>
                <button
                  onClick={handleLogout}
                  className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white font-semibold py-2 px-4 rounded-lg transition-all"
                >
                  Cerrar sesión
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b-2 border-gray-100 sticky top-0 z-40 shadow-sm">
        <div className="container flex gap-8">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`py-4 px-3 border-b-4 font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? 'border-blue-600 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-700 hover:text-blue-600 hover:border-blue-300'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}

export function RootLayout({ children, showHeader = true }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {showHeader && <Header />}
      <main className="container py-6">{children}</main>
    </div>
  );
}
