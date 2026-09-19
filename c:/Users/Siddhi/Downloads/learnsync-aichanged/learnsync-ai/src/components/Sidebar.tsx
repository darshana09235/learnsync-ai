import React from 'react';
import { 
  LayoutDashboard, 
  BookOpen, 
  Sparkles, 
  BarChart3, 
  FileText, 
  FileCode2, 
  ShieldCheck, 
  User, 
  Settings, 
  LogOut, 
  GraduationCap 
} from 'lucide-react';
import { ActiveTabType } from './Navbar';
import { UserProfile } from '../types';

interface SidebarProps {
  activeTab: ActiveTabType;
  setActiveTab: (tab: ActiveTabType) => void;
  user: UserProfile;
  onSignOut: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  user,
  onSignOut,
}) => {
  const navItems = [
    { id: 'dashboard' as ActiveTabType, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'courses' as ActiveTabType, label: 'Courses', icon: BookOpen },
    { id: 'recommendations' as ActiveTabType, label: 'Recommendations', icon: Sparkles },
    { id: 'analytics' as ActiveTabType, label: 'Progress', icon: BarChart3 },
    { id: 'notes' as ActiveTabType, label: 'Notes', icon: FileText },
  ];

  return (
    <aside className="w-72 bg-white border-r border-[#E7E9F0] flex flex-col justify-between shrink-0 select-none min-h-screen">
      <div>
        {/* Logo Header */}
        <div 
          onClick={() => setActiveTab('dashboard')}
          className="p-5 flex items-center gap-3 cursor-pointer group border-b border-[#E7E9F0]"
          id="sidebar-brand-logo"
        >
          <div className="w-10 h-10 bg-[#4F46E5] rounded-xl flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform shrink-0">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-base font-bold text-[#0F172A] leading-snug tracking-tight">
              LearnSync
            </h1>
            <p className="text-[11px] font-medium text-[#64748B]">
              AI Learning Studio
            </p>
          </div>
        </div>

        {/* Navigation Section */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-[#EEF0FE] text-[#4F46E5] font-semibold'
                    : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
                }`}
                id={`sidebar-nav-${item.id}`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#4F46E5]' : 'text-[#64748B]'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Pinned Section */}
      <div className="p-3 border-t border-[#E7E9F0] space-y-1">
        <button
          onClick={() => setActiveTab('profile')}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'profile'
              ? 'bg-[#EEF0FE] text-[#4F46E5] font-semibold'
              : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
          }`}
          id="sidebar-nav-profile"
        >
          <User className="w-4 h-4 text-[#64748B]" />
          <span>Profile</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] transition-all"
          id="sidebar-nav-settings"
        >
          <Settings className="w-4 h-4 text-[#64748B]" />
          <span>Settings</span>
        </button>

        {/* User Card with Sign Out */}
        <div className="pt-2 mt-2 border-t border-[#E7E9F0] flex items-center justify-between px-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="w-8 h-8 rounded-lg object-cover border border-[#E7E9F0] shrink-0"
            />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[#0F172A] truncate leading-tight">
                {user.name}
              </p>
              <p className="text-[10px] text-[#64748B] truncate">
                {user.email}
              </p>
            </div>
          </div>

          <button
            onClick={onSignOut}
            className="p-2 text-[#64748B] hover:text-[#DC2626] hover:bg-[#FEE2E2] rounded-lg transition-colors"
            title="Sign out"
            id="sidebar-btn-signout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
