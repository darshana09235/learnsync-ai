import React from 'react';
import { ShieldCheck, AlertTriangle, AlertCircle, RefreshCw, Zap } from 'lucide-react';
import { HealthScore } from '../types';

interface HealthScoreGaugeProps {
  healthScore: HealthScore;
  onRecalculate?: () => void;
  onRemediateTopic?: (topic: string) => void;
}

export const HealthScoreGauge: React.FC<HealthScoreGaugeProps> = ({
  healthScore,
  onRecalculate,
  onRemediateTopic,
}) => {
  const { totalScore, zone, feedback, breakdown, weakTopics } = healthScore;

  const getZoneTheme = () => {
    switch (zone) {
      case 'GREEN':
        return {
          badgeText: 'Optimal Health',
          badgeBg: 'bg-[#D1FAE5] text-[#059669]',
          strokeColor: '#059669',
          icon: <ShieldCheck className="w-3.5 h-3.5 text-[#059669]" />,
        };
      case 'YELLOW':
        return {
          badgeText: 'Moderate Risk',
          badgeBg: 'bg-[#FEF3C7] text-[#D97706]',
          strokeColor: '#D97706',
          icon: <AlertTriangle className="w-3.5 h-3.5 text-[#D97706]" />,
        };
      case 'RED':
        return {
          badgeText: 'Needs review',
          badgeBg: 'bg-[#FEE2E2] text-[#DC2626]',
          strokeColor: '#DC2626',
          icon: <AlertCircle className="w-3.5 h-3.5 text-[#DC2626]" />,
        };
    }
  };

  const theme = getZoneTheme();

  return (
    <div className="bg-white border border-[#E7E9F0] rounded-2xl p-6 text-[#0F172A] shadow-sm relative" id="health-score-widget">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#E7E9F0]">
        <div>
          <span className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider block">
            LEARNING HEALTH
          </span>
          <h2 className="text-xl font-bold text-[#0F172A] tracking-tight mt-0.5">
            Retention & Active Recall Matrix
          </h2>
          <p className="text-sm text-[#64748B] mt-0.5">
            Real-time score dynamically generated from quiz accuracy, streak consistency, and note depth.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${theme.badgeBg}`}>
            {theme.icon}
            {theme.badgeText}
          </span>
          {onRecalculate && (
            <button
              onClick={onRecalculate}
              className="p-1.5 rounded-lg bg-[#F8FAFC] hover:bg-[#EEF0FE] text-[#64748B] hover:text-[#4F46E5] border border-[#E7E9F0] transition-colors"
              title="Recalculate Health Score"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Gauge + Breakdown Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        
        {/* Health score ring */}
        <div className="md:col-span-4 flex flex-col items-center justify-center p-6 border border-[#E7E9F0] rounded-xl bg-[#F8FAFC] relative">
          <div className="relative w-36 h-36 flex flex-col items-center justify-center">
            {/* SVG Arc Gauge */}
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="#DCDCF7"
                strokeWidth="8"
                fill="transparent"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke={theme.strokeColor}
                strokeWidth="8"
                strokeDasharray={251.2}
                strokeDashoffset={251.2 - (251.2 * totalScore) / 100}
                strokeLinecap="round"
                fill="transparent"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-extrabold text-[#0F172A] tracking-tight">{totalScore}</span>
              <span className="text-xs font-medium text-[#64748B]">/ 100</span>
            </div>
          </div>

          <p className="text-xs text-center font-medium text-[#64748B] mt-4 px-2 italic border-t border-[#E7E9F0] pt-3">
            "{feedback}"
          </p>
        </div>

        {/* Weighted Progress Rows */}
        <div className="md:col-span-8 space-y-4">
          
          {/* Factor 1: Quiz Performance */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-[#0F172A]">Quiz Performance <span className="text-[#64748B] font-normal">(40% weight)</span></span>
              <span className="text-[#4F46E5] font-bold">{breakdown.quizPerformance}%</span>
            </div>
            <div className="h-2 bg-[#DCDCF7] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#4F46E5] transition-all duration-700 rounded-full"
                style={{ width: `${breakdown.quizPerformance}%` }}
              />
            </div>
          </div>

          {/* Factor 2: Video Completion */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-[#0F172A]">Completion Ratio <span className="text-[#64748B] font-normal">(30% weight)</span></span>
              <span className="text-[#4F46E5] font-bold">{breakdown.videoCompletionRatio}%</span>
            </div>
            <div className="h-2 bg-[#DCDCF7] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#4F46E5] transition-all duration-700 rounded-full"
                style={{ width: `${breakdown.videoCompletionRatio}%` }}
              />
            </div>
          </div>

          {/* Factor 3: Consistency Streak */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-[#0F172A]">Consistency & Streak <span className="text-[#64748B] font-normal">(20% weight)</span></span>
              <span className="text-[#D97706] font-bold">{breakdown.consistencyStreak}%</span>
            </div>
            <div className="h-2 bg-[#DCDCF7] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#D97706] transition-all duration-700 rounded-full"
                style={{ width: `${breakdown.consistencyStreak}%` }}
              />
            </div>
          </div>

          {/* Factor 4: Active Recall Depth */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-[#0F172A]">Active Recall Depth <span className="text-[#64748B] font-normal">(10% weight)</span></span>
              <span className="text-[#059669] font-bold">{breakdown.noteQualityDepth}%</span>
            </div>
            <div className="h-2 bg-[#DCDCF7] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#059669] transition-all duration-700 rounded-full"
                style={{ width: `${breakdown.noteQualityDepth}%` }}
              />
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
