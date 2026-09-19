import React from 'react';
import { AIRecommendation, QuizResult } from '../types';
import { Sparkles, ExternalLink, ArrowUpRight, AlertCircle, BookOpen } from 'lucide-react';

interface RecommendationsViewProps {
  recommendations: AIRecommendation[];
  quizResults: QuizResult[];
  onOpenWorkspace: () => void;
}

export const RecommendationsView: React.FC<RecommendationsViewProps> = ({
  recommendations,
  quizResults,
  onOpenWorkspace,
}) => {
  const allWeakTopics = Array.from(
    new Set(quizResults.flatMap((r) => r.weakTopicsIdentified))
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 font-sans">
      
      {/* Header Section */}
      <div className="border-b border-[#E7E9F0] pb-5">
        <span className="text-xs font-semibold text-[#4F46E5] uppercase tracking-wider block">
          ADAPTIVE LEARNING
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#0F172A] tracking-tight mt-0.5">
          Recommended for you
        </h1>
        <p className="text-sm text-[#64748B] mt-1">
          Targeted instructional modules dynamically generated based on your quiz retention gaps.
        </p>
      </div>

      {/* Empty State */}
      {recommendations.length === 0 && (
        <div className="bg-white border border-[#E7E9F0] rounded-2xl p-10 shadow-sm flex flex-col items-center justify-center gap-3 text-center">
          <Sparkles className="w-8 h-8 text-[#94A3B8]" />
          <div>
            <h3 className="text-[#0F172A] font-bold text-lg">No Recommendations Yet</h3>
            <p className="text-[#64748B] text-sm mt-1 max-w-sm mx-auto">
              Complete courses and add videos to your workspace to see standard playlist videos here.
            </p>
          </div>
        </div>
      )}

      {/* Recommendations Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recommendations.map((rec) => (
          <div
            key={rec.id}
            className="bg-white border border-[#E7E9F0] rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
          >
            <div>
              {/* Resource Card Header */}
              <div className="p-6 bg-gradient-to-br from-[#EEF0FE] to-[#F8FAFC] border-b border-[#E7E9F0]">
                <div className="w-10 h-10 rounded-xl bg-white border border-[#E7E9F0] shadow-sm flex items-center justify-center mb-4">
                  <BookOpen className="w-5 h-5 text-[#4F46E5]" />
                </div>
                <span className="inline-block px-2.5 py-1 rounded-md bg-[#4F46E5]/10 text-[11px] font-bold text-[#4F46E5] uppercase tracking-wider mb-2">
                  {rec.reasonTag || 'Targeted Remediation'}
                </span>
                <h3 className="text-lg font-bold text-[#0F172A] group-hover:text-[#4F46E5] transition-colors leading-snug line-clamp-3">
                  {rec.title}
                </h3>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="p-5 pt-0 flex items-center justify-between gap-2">
              <a
                href={rec.resourceUrl || (rec.youtubeVideoId ? `https://www.youtube.com/watch?v=${rec.youtubeVideoId}` : `https://www.google.com/search?q=${encodeURIComponent(rec.searchQuery)}`)}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-2 px-3 rounded-lg bg-white hover:bg-[#F8FAFC] border border-[#E7E9F0] text-[#0F172A] text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
              >
                <span>View Resource</span>
                <ExternalLink className="w-3.5 h-3.5 text-[#64748B]" />
              </a>

              <button
                onClick={onOpenWorkspace}
                className="p-2 rounded-lg bg-[#EEF0FE] hover:bg-[#4F46E5] text-[#4F46E5] hover:text-white transition-colors"
                title="Open in Workspace"
              >
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
