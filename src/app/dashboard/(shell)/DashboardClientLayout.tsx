'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Header } from '@/components/layout/Header';
import { Sidebar, type DashboardRole } from '@/components/layout/Sidebar';
import { RateProvider } from '@/contexts/RateContext';

type MenuContextType = {
  isMenuOpen: boolean;
  toggleMenu: () => void;
  closeMenu: () => void;
};

const MenuContext = createContext<MenuContextType | undefined>(undefined);

export const useMenu = () => {
  const ctx = useContext(MenuContext);
  if (!ctx) throw new Error('useMenu must be used within DashboardClientLayout');
  return ctx;
};

interface DashboardClientLayoutProps {
  children: ReactNode;
  role: DashboardRole;
  userName: string;
  userAvatar: string | null;
  currentRate: number;
  shopCode?: string | null;
  shopName?: string | null; 
}

export function DashboardClientLayout({
  children,
  role,
  userName,
  userAvatar,
  currentRate,
  shopCode,
  shopName,
}: DashboardClientLayoutProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = useCallback(() => setIsMenuOpen((v) => !v), []);
  const closeMenu = useCallback(() => setIsMenuOpen(false), []);

  return (
    <RateProvider rate={currentRate}>
      <MenuContext.Provider value={{ isMenuOpen, toggleMenu, closeMenu }}>
        <div className="flex min-h-screen flex-col bg-gray-50 w-full">
          <Header userName={userName} userAvatar={userAvatar} currentRate={currentRate} />
          <div className="flex flex-1 flex-col md:flex-row">
            <Sidebar role={role} shopCode={shopCode} shopName={shopName} />
            <main className="flex-1 overflow-x-hidden p-3 md:p-6 max-w-full">
              {children}
            </main>
          </div>
        </div>
      </MenuContext.Provider>
    </RateProvider>
  );
}