'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Settings, User, Menu } from 'lucide-react';
import { useMenu } from '@/app/dashboard/(shell)/DashboardClientLayout';
import NotificationPopover from '@/components/NotificationPopover';

interface HeaderProps {
  userName: string;
  userAvatar: string | null;
  currentRate: number;
}

export function Header({ userName, userAvatar, currentRate }: HeaderProps) {
  const { toggleMenu } = useMenu();

  const isValidRate = typeof currentRate === 'number' && currentRate > 0;
  const formattedRate = isValidRate 
    ? new Intl.NumberFormat('fr-FR').format(currentRate) 
    : "---";

  return (
    <header className="sticky top-0 z-20 border-b bg-white/80 backdrop-blur-md shadow-sm">
      <div className="mx-auto flex h-14 md:h-16 max-w-7xl items-center justify-between px-3 sm:px-6 lg:px-8">
        
        {/* Logo + Menu mobile */}
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={toggleMenu}
            className="rounded-full p-1.5 md:p-2 text-gray-500 transition-colors hover:bg-gray-100 md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-base md:text-xl font-bold text-purple-700 truncate">
            Liki-Stock Pro
          </span>
        </div>

        {/* Droite : Taux + Notifications + Avatar */}
        <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
          
          {/* Taux - version desktop */}
          <div className={`hidden sm:flex items-center gap-1 rounded-full border px-2 py-0.5 md:px-3 md:py-1 text-[10px] md:text-xs font-semibold ${
            isValidRate 
              ? 'border-purple-100 bg-purple-50/60 text-purple-700' 
              : 'border-gray-100 bg-gray-50 text-gray-500'
          }`}>
            <span className="relative flex h-1.5 w-1.5">
              {isValidRate && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              )}
              <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${isValidRate ? 'bg-purple-600' : 'bg-gray-400'}`}></span>
            </span>
            <div className="flex items-center gap-0.5">
              <span className="text-gray-500 font-normal hidden xl:inline">Taux :</span>
              <span className="font-bold text-purple-950">1 $</span>
              <span className="text-purple-400 font-normal">=</span>
              <span className={`font-bold ${isValidRate ? 'text-purple-950' : 'text-gray-400'}`}>
                {formattedRate} FC
              </span>
            </div>
          </div>

          {/* Version mobile simplifiée du taux */}
          {isValidRate && (
            <div className="sm:hidden flex items-center gap-0.5 text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-1 rounded-full min-h-[32px]">
              <span>1$</span>
              <span className="text-purple-400">=</span>
              <span>{formattedRate}</span>
            </div>
          )}

          <NotificationPopover />

          <Link
            href="/settings"
            className="rounded-full p-1.5 md:p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Paramètres"
          >
            <Settings className="h-4 w-4 md:h-5 md:w-5" />
          </Link>

          {/* Avatar utilisateur */}
          <div className="flex items-center gap-1.5 pl-1">
            {userAvatar ? (
              <Image
                src={userAvatar}
                alt={userName}
                width={32}
                height={32}
                className="rounded-full object-cover w-7 h-7 md:w-8 md:h-8"
              />
            ) : (
              <div className="flex h-7 w-7 md:h-8 md:w-8 items-center justify-center rounded-full bg-purple-100">
                <User className="h-3.5 w-3.5 md:h-4 md:w-4 text-purple-600" />
              </div>
            )}
            <span className="hidden md:block text-sm font-medium text-gray-700 max-w-[80px] truncate">
              {userName}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}