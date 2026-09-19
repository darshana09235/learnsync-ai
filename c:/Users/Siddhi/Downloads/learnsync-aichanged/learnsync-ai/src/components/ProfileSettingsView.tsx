import React, { useState } from 'react';
import { UserProfile, HealthScore, CoursePlaylist } from '../types';
import { User, Settings, Bell, Flame, BookOpen, FileText, Award, LogOut } from 'lucide-react';

interface ProfileSettingsViewProps {
  user: UserProfile;
  healthScore: HealthScore;
  courses: CoursePlaylist[];
  onSignOut?: () => void;
}

export const ProfileSettingsView: React.FC<ProfileSettingsViewProps> = ({
  user,
  healthScore,
  courses,
  onSignOut,
}) => {
  const [dailyGoal, setDailyGoal] = useState('30 minutes / day');
  const [reminders, setReminders] = useState(true);
  const [autoQuiz, setAutoQuiz] = useState(true);
  const [weeklySummary, setWeeklySummary] = useState(false);

  // Compute completed videos
  const totalCompletedVideos = courses.reduce((acc, course) => acc + (course.completedVideos || 0), 0);
  const totalVideos = courses.reduce((acc, course) => acc + (course.totalVideos || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-sans">
      
      {/* Header Section */}
      <div className="border-b border-[#E7E9F0] pb-5">
        <span className="text-xs font-semibold text-[#4F46E5] uppercase tracking-wider block">
          LEARNER PROFILE & PREFERENCES
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#0F172A] tracking-tight mt-0.5">
          Profile & Settings
        </h1>
        <p className="text-sm text-[#64748B] mt-1">
          Manage your account identity, learning cadence, and study notification settings.
        </p>
      </div>

      {/* Identity Profile Card */}
      <div className="bg-white border border-[#E7E9F0] rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#4F46E5] flex items-center justify-center text-white font-bold text-xl shadow-xs shrink-0 overflow-hidden">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <span>{user.name.substring(0, 2).toUpperCase()}</span>
            )}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-[#0F172A]">{user.name}</h2>
            </div>
            <p className="text-xs font-medium text-[#64748B]">{user.email}</p>
            <p className="text-xs text-[#94A3B8]">
              Active recall learning • Health Score: <span className="text-[#4F46E5] font-bold">{healthScore.totalScore}/100</span>
            </p>
          </div>
        </div>

        {onSignOut && (
          <button
            onClick={onSignOut}
            className="px-4 py-2 rounded-lg bg-white hover:bg-[#F8FAFC] text-[#DC2626] font-semibold text-xs border border-[#E7E9F0] transition-all flex items-center gap-2 shadow-2xs"
            id="btn-profile-signout"
          >
            <LogOut className="w-4 h-4 text-[#DC2626]" />
            <span>Sign out</span>
          </button>
        )}
      </div>

      {/* Stats Summary Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Streak */}
        <div className="bg-white border border-[#E7E9F0] rounded-2xl p-6 space-y-3 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-[#FEF3C7] flex items-center justify-center text-[#D97706]">
            <Flame className="w-5 h-5 fill-[#D97706]" />
          </div>
          <span className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider block">
            ACTIVE STREAK
          </span>
          <p className="text-3xl font-extrabold text-[#0F172A] tracking-tight">{user.streakDays} days</p>
          <p className="text-xs text-[#64748B]">Daily active retention</p>
        </div>

        {/* Lessons */}
        <div className="bg-white border border-[#E7E9F0] rounded-2xl p-6 space-y-3 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-[#DBEAFE] flex items-center justify-center text-[#2563EB]">
            <BookOpen className="w-5 h-5" />
          </div>
          <span className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider block">
            LESSONS DONE
          </span>
          <p className="text-3xl font-extrabold text-[#0F172A] tracking-tight">{totalCompletedVideos} / {totalVideos}</p>
          <p className="text-xs text-[#64748B]">Completed video modules</p>
        </div>

        {/* Notes */}
        <div className="bg-white border border-[#E7E9F0] rounded-2xl p-6 space-y-3 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-[#D1FAE5] flex items-center justify-center text-[#059669]">
            <FileText className="w-5 h-5" />
          </div>
          <span className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider block">
            NOTES
          </span>
          <p className="text-3xl font-extrabold text-[#0F172A] tracking-tight">{user.totalNotesCount}</p>
          <p className="text-xs text-[#64748B]">Timestamped notes</p>
        </div>

        {/* Quizzes */}
        <div className="bg-white border border-[#E7E9F0] rounded-2xl p-6 space-y-3 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-[#EEF0FE] flex items-center justify-center text-[#4F46E5]">
            <Award className="w-5 h-5" />
          </div>
          <span className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider block">
            QUIZZES
          </span>
          <p className="text-3xl font-extrabold text-[#0F172A] tracking-tight">{user.quizzesCompletedCount}</p>
          <p className="text-xs text-[#64748B]">Fact-checked attempts</p>
        </div>

      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Daily Target */}
        <div className="bg-white border border-[#E7E9F0] rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 text-[#4F46E5] text-xs font-semibold">
            <Settings className="w-4 h-4" />
            <span>Daily Study Target</span>
          </div>
          <p className="text-xs text-[#64748B]">Select your daily active recall commitment level.</p>

          <select
            value={dailyGoal}
            onChange={(e) => setDailyGoal(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-white border border-[#E7E9F0] rounded-lg text-sm text-[#0F172A] focus:outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] transition-colors"
          >
            <option value="15 minutes / day">15 minutes / day (Light)</option>
            <option value="30 minutes / day">30 minutes / day (Standard)</option>
            <option value="45 minutes / day">45 minutes / day (Intensive)</option>
            <option value="60 minutes / day">60 minutes / day (Mastery)</option>
          </select>
        </div>

        {/* Settings Rows with Indigo Toggles */}
        <div className="bg-white border border-[#E7E9F0] rounded-2xl p-6 space-y-5 shadow-sm">
          <div className="flex items-center gap-2 text-[#4F46E5] text-xs font-semibold">
            <Bell className="w-4 h-4" />
            <span>Learning Preferences</span>
          </div>

          <div className="space-y-4">
            
            {/* Toggle Row 1 */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-[#0F172A]">Daily study streak reminders</p>
                <p className="text-xs text-[#64748B]">Receive notification before streak breaks</p>
              </div>
              <button
                type="button"
                onClick={() => setReminders(!reminders)}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                  reminders ? 'bg-[#4F46E5]' : 'bg-[#E2E8F0]'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    reminders ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Toggle Row 2 */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-[#0F172A]">Auto-generate AI quiz after lesson</p>
                <p className="text-xs text-[#64748B]">Automatically prompt active recall quiz</p>
              </div>
              <button
                type="button"
                onClick={() => setAutoQuiz(!autoQuiz)}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                  autoQuiz ? 'bg-[#4F46E5]' : 'bg-[#E2E8F0]'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    autoQuiz ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Toggle Row 3 */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-[#0F172A]">Weekly Health Score summary report</p>
                <p className="text-xs text-[#64748B]">Email progress & topic breakdown</p>
              </div>
              <button
                type="button"
                onClick={() => setWeeklySummary(!weeklySummary)}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                  weeklySummary ? 'bg-[#4F46E5]' : 'bg-[#E2E8F0]'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    weeklySummary ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
