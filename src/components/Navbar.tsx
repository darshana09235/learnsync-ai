import React from 'react';
import { PlayCircle, Flame, Activity, FileCode2, PlusCircle, Sparkles, BookOpen, Server, ShieldCheck } from 'lucide-react';
import { HealthScore, UserProfile } from '../types';

export type ActiveTabType = 
  | 'dashboard' 
  | 'courses' 
  | 'workspace' 
  | 'recommendations' 
  | 'analytics' 
  | 'notes' 
  | 'profile' 
  | 'blueprint' 
  | 'admin';

interface NavbarProps {
  user: UserProfile;
  healthScore: HealthScore;
  activeTab: ActiveTabType;
  setActiveTab: (tab: ActiveTabType) => void;
  onOpenImportModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  healthScore,
  activeTab,
  setActiveTab,
  onOpenImportModal,
}) => {
  const getZoneBadgeClass = () => {
    switch (healthScore.zone) {
      case 'GREEN':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'YELLOW':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'RED':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-slate-100">
      {/* Top Emerald Accent Line */}
      <div className="h-0.5 bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-500 w-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Brand Logo - Geometric Balance Style */}
        <div 
          onClick={() => setActiveTab('dashboard')} 
          className="flex items-center gap-3 cursor-pointer group shrink-0"
          id="navbar-brand-logo"
        >
          <div className="w-8 h-8 bg-cyan-400 rounded-sm flex items-center justify-center font-bold text-slate-950 text-base shadow-[0_0_12px_rgba(34,211,238,0.4)] group-hover:scale-105 transition-transform">
            L
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white">
              LearnSync <span className="text-cyan-400">AI</span>
            </h1>
            <span className="hidden xl:inline-block px-2 py-0.5 bg-slate-800 rounded text-[10px] font-mono text-slate-400 border border-slate-700">
              v2.0-Production
            </span>
          </div>
        </div>

        {/* Navigation Tabs - Full Scope matching learnsync.md */}
        <nav className="hidden lg:flex items-center gap-0.5 bg-slate-950/80 p-1 rounded-lg border border-slate-800 text-[11px] font-mono font-medium overflow-x-auto">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded transition-all whitespace-nowrap ${
              activeTab === 'dashboard'
                ? 'text-cyan-400 bg-slate-900 border-b-2 border-cyan-400 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Dashboard
          </button>

          <button
            onClick={() => setActiveTab('courses')}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded transition-all whitespace-nowrap ${
              activeTab === 'courses'
                ? 'text-cyan-400 bg-slate-900 border-b-2 border-cyan-400 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Courses
          </button>

          <button
            onClick={() => setActiveTab('workspace')}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded transition-all whitespace-nowrap ${
              activeTab === 'workspace'
                ? 'text-cyan-400 bg-slate-900 border-b-2 border-cyan-400 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Workspace
          </button>

          <button
            onClick={() => setActiveTab('recommendations')}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded transition-all whitespace-nowrap ${
              activeTab === 'recommendations'
                ? 'text-cyan-400 bg-slate-900 border-b-2 border-cyan-400 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Recommendations
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded transition-all whitespace-nowrap ${
              activeTab === 'analytics'
                ? 'text-cyan-400 bg-slate-900 border-b-2 border-cyan-400 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Progress
          </button>

          <button
            onClick={() => setActiveTab('notes')}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded transition-all whitespace-nowrap ${
              activeTab === 'notes'
                ? 'text-cyan-400 bg-slate-900 border-b-2 border-cyan-400 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Notes
          </button>

          <button
            onClick={() => setActiveTab('blueprint')}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded transition-all whitespace-nowrap ${
              activeTab === 'blueprint'
                ? 'text-cyan-400 bg-slate-900 border-b-2 border-cyan-400 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Blueprint
          </button>

          <button
            onClick={() => setActiveTab('admin')}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded transition-all whitespace-nowrap ${
              activeTab === 'admin'
                ? 'text-cyan-400 bg-slate-900 border-b-2 border-cyan-400 font-bold'
                : 'text-cyan-300/80 hover:text-cyan-300'
            }`}
          >
            Admin
          </button>
        </nav>

        {/* Right Section: Health Pill, Streak, Import Button, Profile */}
        <div className="flex items-center gap-2.5 shrink-0">
          
          {/* Health Score Pill */}
          <div 
            onClick={() => setActiveTab('analytics')} 
            title="Click to view AI Health Score Matrix"
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono font-bold cursor-pointer transition-transform hover:scale-105 border ${getZoneBadgeClass()}`}
            id="navbar-health-score-pill"
          >
            <Activity className="w-3.5 h-3.5 animate-pulse" />
            <span>Score: {healthScore.totalScore}/100</span>
          </div>

          {/* Streak Indicator */}
          <div className="flex items-center gap-1 px-2.5 py-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-mono font-bold">
            <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
            <span>{user.streakDays}d</span>
          </div>

          {/* Import YouTube Playlist Action */}
          <button
            onClick={onOpenImportModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-bold transition-all shadow-[0_0_10px_rgba(34,211,238,0.25)]"
            id="navbar-btn-import-course"
          >
            <PlusCircle className="w-3.5 h-3.5 text-slate-950" />
            <span className="hidden sm:inline">+ Import</span>
          </button>

          {/* User Profile Avatar */}
          <div 
            onClick={() => setActiveTab('profile')}
            className="flex items-center gap-2 cursor-pointer pl-1.5 border-l border-slate-800"
            title="Open Profile & Settings"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-violet-500 border border-slate-700 p-0.5">
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-full h-full rounded-full object-cover"
              />
            </div>
          </div>
        </div>

      </div>

      {/* Mobile Navigation Sub-bar */}
      <div className="lg:hidden flex items-center justify-around bg-slate-950 py-2 border-t border-slate-800 px-2 text-[10px] font-mono overflow-x-auto">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center gap-0.5 ${activeTab === 'dashboard' ? 'text-cyan-400 font-bold' : 'text-slate-400'}`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          Dashboard
        </button>
        <button
          onClick={() => setActiveTab('courses')}
          className={`flex flex-col items-center gap-0.5 ${activeTab === 'courses' ? 'text-cyan-400 font-bold' : 'text-slate-400'}`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          Courses
        </button>
        <button
          onClick={() => setActiveTab('workspace')}
          className={`flex flex-col items-center gap-0.5 ${activeTab === 'workspace' ? 'text-cyan-400 font-bold' : 'text-slate-400'}`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          Workspace
        </button>
        <button
          onClick={() => setActiveTab('recommendations')}
          className={`flex flex-col items-center gap-0.5 ${activeTab === 'recommendations' ? 'text-cyan-400 font-bold' : 'text-slate-400'}`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          Recs
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex flex-col items-center gap-0.5 ${activeTab === 'analytics' ? 'text-cyan-400 font-bold' : 'text-slate-400'}`}
        >
          <Activity className="w-3.5 h-3.5" />
          Progress
        </button>
        <button
          onClick={() => setActiveTab('notes')}
          className={`flex flex-col items-center gap-0.5 ${activeTab === 'notes' ? 'text-cyan-400 font-bold' : 'text-slate-400'}`}
        >
          <FileCode2 className="w-3.5 h-3.5" />
          Notes
        </button>
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center gap-0.5 ${activeTab === 'profile' ? 'text-cyan-400 font-bold' : 'text-slate-400'}`}
        >
          <Server className="w-3.5 h-3.5" />
          Profile
        </button>
      </div>
    </header>
  );
};
