import React from 'react';
import { Activity, Flame, Clock, FileText, Sparkles, TrendingUp, Award, CheckCircle2 } from 'lucide-react';
import { HealthScore, UserProfile, NoteEntry, QuizResult } from '../types';

interface AnalyticsViewProps {
  user: UserProfile;
  healthScore: HealthScore;
  notes: NoteEntry[];
  quizResults: QuizResult[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  user,
  healthScore,
  notes,
  quizResults,
}) => {
  const topicsData = [
    ...(healthScore?.strongTopics ?? []).map((t) => ({ name: t, mastery: 85, status: 'Strong' })),
    ...(healthScore?.weakTopics ?? []).map((t) => ({ name: t, mastery: 40, status: 'Needs review' })),
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-sans">
      
      {/* Header Section */}
      <div className="border-b border-[#E7E9F0] pb-5">
        <span className="text-xs font-semibold text-[#4F46E5] uppercase tracking-wider block">
          ANALYTICS & RETENTION
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#0F172A] tracking-tight mt-0.5">
          Progress Overview
        </h1>
        <p className="text-sm text-[#64748B] mt-1">
          Real-time retention, active recall, and completion overview.
        </p>
      </div>

      {/* Top 4 Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Active Streak */}
        <div className="bg-white border border-[#E7E9F0] rounded-2xl p-6 space-y-3 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-[#FEF3C7] flex items-center justify-center text-[#D97706]">
            <Flame className="w-5 h-5 fill-[#D97706]" />
          </div>
          <span className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider block">
            ACTIVE STREAK
          </span>
          <p className="text-3xl font-extrabold text-[#0F172A] tracking-tight">{user?.streakDays ?? 0} days</p>
          <p className="text-xs text-[#059669] font-medium">Daily goal on track</p>
        </div>

        {/* Watch Time */}
        <div className="bg-white border border-[#E7E9F0] rounded-2xl p-6 space-y-3 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-[#DBEAFE] flex items-center justify-center text-[#2563EB]">
            <Clock className="w-5 h-5" />
          </div>
          <span className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider block">
            LESSONS DONE
          </span>
          <p className="text-3xl font-extrabold text-[#0F172A] tracking-tight">{user?.minutesWatchedToday ?? 0} mins</p>
          <p className="text-xs text-[#64748B]">Target: {user?.targetDailyMinutes ?? 45} mins/day</p>
        </div>

        {/* Active Notes */}
        <div className="bg-white border border-[#E7E9F0] rounded-2xl p-6 space-y-3 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-[#D1FAE5] flex items-center justify-center text-[#059669]">
            <FileText className="w-5 h-5" />
          </div>
          <span className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider block">
            NOTES
          </span>
          <p className="text-3xl font-extrabold text-[#0F172A] tracking-tight">{notes?.length ?? 0}</p>
          <p className="text-xs text-[#059669] font-medium">Timestamp anchored</p>
        </div>

        {/* Quizzes Taken */}
        <div className="bg-white border border-[#E7E9F0] rounded-2xl p-6 space-y-3 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-[#EEF0FE] flex items-center justify-center text-[#4F46E5]">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider block">
            QUIZZES TAKEN
          </span>
          <p className="text-3xl font-extrabold text-[#0F172A] tracking-tight">{quizResults?.length ?? 0}</p>
          <p className="text-xs text-[#4F46E5] font-medium">40% Health weight</p>
        </div>

      </div>

      {/* Main Grid: Topic Mastery & Weekly Heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Topic Mastery */}
        <div className="lg:col-span-7 bg-white border border-[#E7E9F0] rounded-2xl p-6 space-y-5 shadow-sm">
          <div>
            <h2 className="text-base font-bold text-[#0F172A] flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#4F46E5]" />
              Topic Mastery & Skill Gap Breakdown
            </h2>
            <p className="text-xs text-[#64748B] mt-0.5">Extracted from active recall quiz evaluations</p>
          </div>

          <div className="space-y-4 pt-2">
            {topicsData.length === 0 ? (
              <p className="text-sm text-[#64748B] italic p-4 bg-[#F8FAFC] rounded-lg border border-[#E7E9F0] text-center">
                No active recall data yet. Complete video quizzes to identify mastery gaps.
              </p>
            ) : (
              topicsData.map((topic, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-[#0F172A]">{topic.name}</span>
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] ${
                        topic.mastery >= 80
                          ? 'bg-[#D1FAE5] text-[#059669]'
                          : topic.mastery >= 65
                          ? 'bg-[#FEF3C7] text-[#D97706]'
                          : 'bg-[#FEE2E2] text-[#DC2626]'
                      }`}>
                        {topic.status}
                      </span>
                      <span className="text-[#0F172A] font-bold">{topic.mastery}%</span>
                    </div>
                  </div>

                  <div className="w-full h-2 bg-[#DCDCF7] rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-700 rounded-full ${
                        topic.mastery >= 80
                          ? 'bg-[#059669]'
                          : topic.mastery >= 65
                          ? 'bg-[#D97706]'
                          : 'bg-[#DC2626]'
                      }`}
                      style={{ width: `${topic.mastery}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Weekly Heatmap & Formula */}
        <div className="lg:col-span-5 bg-white border border-[#E7E9F0] rounded-2xl p-6 space-y-5 shadow-sm">
          <h2 className="text-base font-bold text-[#0F172A] flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#4F46E5]" />
            Weekly Activity
          </h2>

          <div className="grid grid-cols-7 gap-2 pt-2">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => {
              const streak = user?.streakDays ?? 0;
              const active = streak > 0 && idx < Math.min(6, streak);
              return (
                <div key={day} className="flex flex-col items-center gap-2">
                  <span className="text-[11px] font-medium text-[#94A3B8] uppercase">{day}</span>
                  <div
                    className={`w-full aspect-square rounded-lg flex items-center justify-center text-xs font-bold transition-all ${
                      active
                        ? 'bg-[#EEF0FE] border border-[#4F46E5]/30 text-[#4F46E5]'
                        : 'bg-[#F8FAFC] border border-[#E7E9F0] text-[#94A3B8]'
                    }`}
                  >
                    {active ? '✓' : ''}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-4 bg-[#F8FAFC] rounded-xl border border-[#E7E9F0] space-y-2 text-xs text-[#0F172A]">
            <span className="font-semibold text-[#4F46E5] flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#4F46E5]" />
              Health Score Matrix Breakdown:
            </span>
            <ul className="space-y-1 text-xs text-[#64748B] pl-4 list-disc">
              <li><strong>40%:</strong> Active Recall Quiz Accuracy</li>
              <li><strong>30%:</strong> Playlist Video Completion Ratio</li>
              <li><strong>20%:</strong> Daily Study Streak Continuity</li>
              <li><strong>10%:</strong> Active Recall Note Length & Depth</li>
            </ul>
          </div>
        </div>

      </div>

    </div>
  );
};
