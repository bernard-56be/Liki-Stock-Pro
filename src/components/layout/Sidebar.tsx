'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LogOut, LayoutDashboard, Package, Users, Bell, Settings, History, UserCog, X } from 'lucide-react';
import { useMenu } from '@/app/dashboard/(shell)/DashboardClientLayout';
import { createClient } from '@/lib/supabase/client';

export type DashboardRole = 'owner' | 'employee';

type NavItem = { 
  href: string; 
  label: string; 
  icon?: React.ReactNode;
};

const ownerNav: NavItem[] = [
  { href: '/dashboard/owner/dashboard', label: 'Accueil', icon: <LayoutDashboard className="h-4 w-4" /> },
  { href: '/dashboard/owner/inventaire', label: 'Inventaire', icon: <Package className="h-4 w-4" /> },
  { href: '/dashboard/owner/validation', label: 'Validation', icon: <Users className="h-4 w-4" /> },
  { href: '/dashboard/owner/historique', label: 'Historique', icon: <History className="h-4 w-4" /> },
  { href: '/dashboard/manage-employees', label: 'Gestion des employés', icon: <UserCog className="h-4 w-4" /> },
  { href: '/dashboard/notifications', label: 'Notifications', icon: <Bell className="h-4 w-4" /> },
  { href: '/settings', label: 'Paramètres', icon: <Settings className="h-4 w-4" /> },
];

const employeeNav: NavItem[] = [
  { href: '/dashboard/employee/ventes', label: 'Ventes', icon: <LayoutDashboard className="h-4 w-4" /> },
  { href: '/dashboard/notifications', label: 'Notifications', icon: <Bell className="h-4 w-4" /> },
  { href: '/settings', label: 'Paramètres', icon: <Settings className="h-4 w-4" /> },
];

function navForRole(role: DashboardRole): NavItem[] {
  return role === 'owner' ? ownerNav : employeeNav;
}

export function Sidebar({
  role,
  shopCode,
  shopName,
}: {
  role: DashboardRole;
  shopCode?: string | null;
  shopName?: string | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { isMenuOpen, closeMenu } = useMenu();
  const items = navForRole(role);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    closeMenu();
  }, [pathname, closeMenu]);

  useEffect(() => {
    if (!isMenuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMenu();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isMenuOpen, closeMenu]);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push('/auth/login');
      router.refresh();
    } catch (error) {
      console.error('Erreur lors de la déconnexion', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const isOwner = role === 'owner';
  const label = isOwner ? 'Code' : 'Boutique';
  const displayValue = isOwner
    ? (shopCode ? shopCode.toUpperCase() : 'LIKI-PRO')
    : (shopName || 'Boutique inconnue');

  return (
    <>
      {/* Overlay mobile */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={closeMenu}
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-40 flex w-[280px] flex-col border-r border-gray-200 bg-white p-4 shadow-xl
          transition-transform duration-300 ease-in-out
          md:relative md:z-auto md:w-56 md:translate-x-0 md:bg-white/40 md:backdrop-blur-sm md:shadow-none
          ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* En-tête avec bouton fermeture mobile */}
        <div className="flex items-center justify-between mb-6 md:block">
          <div className="flex items-center gap-2 rounded-xl bg-purple-50 px-3 py-2 border border-purple-100 w-full">
            <span className="text-xs font-semibold uppercase tracking-wider text-purple-700/80">
              {label}
            </span>
            <span className={isOwner ? 'font-mono text-sm font-bold text-gray-800 tracking-wider' : 'text-sm font-bold text-gray-800'}>
              {displayValue}
            </span>
          </div>
          <button
            onClick={closeMenu}
            className="md:hidden p-1 rounded-full hover:bg-gray-100"
            aria-label="Fermer le menu"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto">
          {items.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMenu}
                className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-colors min-h-[44px] ${
                  active
                    ? 'bg-purple-700 text-white shadow-md'
                    : 'text-gray-700 hover:bg-purple-50 hover:text-purple-700'
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Déconnexion */}
        <div className="mt-4 border-t border-gray-200 pt-3 space-y-2">
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50 min-h-[44px]"
          >
            <LogOut className="h-4 w-4" />
            {isLoggingOut ? 'Déconnexion...' : 'Se déconnecter'}
          </button>
          <p className="text-xs text-gray-400 px-2">
            {role === 'owner' ? 'Espace propriétaire' : 'Espace employé'}
          </p>
        </div>
      </aside>
    </>
  );
}