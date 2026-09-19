import React, { useState } from 'react';
import { Flame, Plus, Menu, LogOut, ShieldCheck, User } from 'lucide-react';
import { UserProfile } from '../types';

interface HeaderTopBarProps {
  user: UserProfile;
  onOpenImportModal: () => void;
  onSignOut: () => void;
  onToggleMobileMenu?: () => void;
}

export const HeaderTopBar: React.FC<HeaderTopBarProps> = ({
  user,
  onOpenImportModal,
  onSignOut,
  onToggleMobileMenu,
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="h-16 bg-white border-b border-[#E7E9F0] px-6 flex items-center justify-between shrink-0 sticky top-0 z-20 font-sans">
      
      {/* Left Mobile Menu Toggle / Context */}
      <div className="flex items-center gap-3">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="p-2 md:hidden text-[#64748B] hover:text-[#0F172A] rounded-lg hover:bg-[#F8FAFC]"
            id="btn-mobile-menu-toggle"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div className="hidden sm:flex items-center gap-2">
          <span className="text-xs font-bold text-[#4F46E5] uppercase tracking-wider">
            LearnSync Studio
          </span>
          <span className="text-xs text-[#94A3B8]">•</span>
          <span className="text-xs text-[#64748B] font-medium">
            Active Recall & Gap AI Engine
          </span>
        </div>
      </div>

      {/* Right Utility Bar Items */}
      <div className="flex items-center gap-3">
        
        {/* Streak Pill */}
        <div className="px-3.5 py-1.5 rounded-full bg-[#FEF3C7] text-[#D97706] text-xs font-semibold flex items-center gap-1.5 shadow-2xs border border-[#FDE68A]/50">
          <Flame className="w-4 h-4 fill-[#D97706] text-[#D97706]" />
          <span>{user.streakDays} day streak</span>
        </div>

        {/* Primary Import Video/Playlist Button */}
        <button
          onClick={onOpenImportModal}
          className="px-3.5 py-2 rounded-lg bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm"
          id="btn-topbar-import-playlist"
        >
          <Plus className="w-4 h-4" />
          <span>Import Video</span>
        </button>

        {/* User Badge & Sign Out Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-[#F8FAFC] border border-transparent hover:border-[#E7E9F0] transition-all"
            id="btn-topbar-user-menu"
          >
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="w-8 h-8 rounded-lg object-cover border border-[#E7E9F0]"
            />
            <div className="hidden md:block text-left text-xs leading-tight pr-1">
              <span className="font-bold text-[#0F172A] block truncate max-w-[120px]">
                {user.name}
              </span>
              <span className="text-[10px] text-[#4F46E5] font-semibold flex items-center gap-0.5">
                <ShieldCheck className="w-3 h-3 text-[#4F46E5]" />
                {user.role}
              </span>
            </div>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-[#E7E9F0] rounded-xl shadow-lg p-2 space-y-1 z-50 text-xs">
              <div className="px-3 py-2 border-b border-[#E7E9F0]">
                <p className="font-bold text-[#0F172A] truncate">{user.name}</p>
                <p className="text-[11px] text-[#64748B] truncate">{user.email}</p>
                <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-[#EEF0FE] text-[#4F46E5] font-semibold text-[10px]">
                  {user.role}
                </span>
              </div>

              <button
                onClick={() => {
                  setShowUserMenu(false);
                  onSignOut();
                }}
                className="w-full px-3 py-2 rounded-lg text-[#DC2626] hover:bg-[#FEE2E2] font-semibold flex items-center gap-2 transition-colors text-left"
                id="topbar-btn-signout"
              >
                <LogOut className="w-4 h-4 text-[#DC2626]" />
                <span>Sign Out ({user.role})</span>
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};
