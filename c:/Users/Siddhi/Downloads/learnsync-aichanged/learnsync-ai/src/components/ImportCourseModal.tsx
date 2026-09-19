import React, { useState, useEffect } from 'react';
import { X, Youtube, Sparkles, PlusCircle, AlertTriangle, CheckCircle2, ShieldAlert, Loader2, ArrowRight, BookOpen, Film } from 'lucide-react';
import { CoursePlaylist, ImportCourseResponse } from '../types';

interface ImportCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportCourse: (importedData: ImportCourseResponse) => void;
}

export const ImportCourseModal: React.FC<ImportCourseModalProps> = ({
  isOpen,
  onClose,
  onImportCourse,
}) => {
  const [playlistUrl, setPlaylistUrl] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [relevanceCheck, setRelevanceCheck] = useState<{
    isStudyRelated: boolean;
    studySuitability: 'HIGH' | 'MODERATE' | 'LOW_SIGNAL_TRIVIAL';
    warningMessage?: string;
    detectedTopic?: string;
    videoTitle?: string;
    authorName?: string;
    thumbnailUrl?: string;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Live URL Verification when user pastes/types
  useEffect(() => {
    if (!playlistUrl.trim() || playlistUrl.length < 5) {
      setRelevanceCheck(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsVerifying(true);
      try {
        const res = await fetch('/api/v1/ai/verify-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: playlistUrl }),
        });
        if (res.ok) {
          const data = await res.json();
          setRelevanceCheck(data);
        }
      } catch (err) {
        console.warn('URL verification ping error:', err);
      } finally {
        setIsVerifying(false);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [playlistUrl]);

  if (!isOpen) return null;

  const handleSubmit = async (e?: React.FormEvent, forcedUrl?: string) => {
    if (e) e.preventDefault();
    const targetUrl = (forcedUrl || playlistUrl).trim();
    if (!targetUrl) return;

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/v1/courses/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playlistUrl: targetUrl }),
      });

      if (!res.ok) {
        throw new Error('Failed to import YouTube video metadata and generate AI course material');
      }

      const responseData = await res.json();

      // Normalize if backend returned direct course or wrapped response
      const normalizedResponse: ImportCourseResponse = responseData.course
        ? responseData
        : {
            course: responseData as CoursePlaylist,
            isStudyRelated: responseData.isStudyRelated ?? true,
            studySuitability: responseData.studySuitability ?? 'HIGH',
            warningMessage: responseData.warningMessage,
            detectedTopic: responseData.detectedTopic,
          };

      onImportCourse(normalizedResponse);
      setPlaylistUrl('');
      setRelevanceCheck(null);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error importing course');
    } finally {
      setIsSubmitting(false);
    }
  };



  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs font-sans" id="import-course-modal">
      <div className="bg-white border border-[#E7E9F0] rounded-2xl max-w-lg w-full p-6 text-[#0F172A] shadow-xl relative space-y-5 max-h-[90vh] overflow-y-auto">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#E7E9F0] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#FEE2E2] text-[#DC2626] flex items-center justify-center shrink-0">
              <Youtube className="w-5 h-5 text-[#DC2626]" />
            </div>
            <div>
              <h2 className="font-bold text-base text-[#0F172A]">Import YouTube Video / Course</h2>
              <p className="text-xs text-[#64748B]">Auto-verifies study content and generates grounded AI quizzes</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[#F8FAFC] text-[#94A3B8] hover:text-[#0F172A] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[#0F172A]">
                YouTube Video or Playlist URL / Topic
              </label>
              {isVerifying && (
                <span className="text-[11px] text-[#4F46E5] flex items-center gap-1 font-medium">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Verifying with Gemini...
                </span>
              )}
            </div>
            <input
              type="text"
              value={playlistUrl}
              onChange={(e) => setPlaylistUrl(e.target.value)}
              placeholder="e.g. https://www.youtube.com/watch?v=... or Avengers / System Design"
              className="w-full bg-white border border-[#E7E9F0] rounded-lg px-3.5 py-2.5 text-xs text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] transition-colors"
              required
            />
          </div>

          {/* Live Relevance Warning / Status Banner */}
          {relevanceCheck && (
            <div className="space-y-2">
              {!relevanceCheck.isStudyRelated || relevanceCheck.studySuitability === 'LOW_SIGNAL_TRIVIAL' ? (
                <div className="p-4 rounded-xl bg-[#FFFBEB] border-2 border-[#FDE68A] text-[#92400E] text-xs space-y-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-bold text-sm text-[#B45309]">
                      <AlertTriangle className="w-4.5 h-4.5 text-[#D97706] shrink-0" />
                      <span>Warning: No Study Content Detected</span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A]">
                      Non-Study Media
                    </span>
                  </div>

                  <div className="space-y-1.5 bg-white/80 p-3 rounded-lg border border-[#FDE68A]">
                    <div className="font-bold text-[#0F172A] text-xs flex items-center gap-1.5">
                      <Film className="w-4 h-4 text-[#D97706]" />
                      <span>Detected: {relevanceCheck.videoTitle || 'Entertainment / Movie Media'}</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-[#78350F]">
                      {relevanceCheck.warningMessage || 'This video contains movie, gaming, or entertainment content with no academic or instructional coursework. LearnSync AI will disable study analytics, quizzes, and learning notes for this video.'}
                    </p>
                  </div>

                  {/* Explicit Action Buttons */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setPlaylistUrl('https://www.youtube.com/watch?v=i53Gi_K3o7I')}
                      className="p-2.5 rounded-lg bg-[#4F46E5] hover:bg-[#4338CA] text-white text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all text-center shadow-xs"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Switch to Study Course</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSubmit(undefined, playlistUrl)}
                      disabled={isSubmitting}
                      className="p-2.5 rounded-lg bg-white border border-[#FDE68A] hover:bg-[#FEF3C7] text-[#B45309] text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all text-center"
                    >
                      <span>Proceed (Study Tools Disabled)</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-[#D1FAE5] border border-[#A7F3D0] text-[#065F46] text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0" />
                    <span>
                      Verified Study Topic: <strong>{relevanceCheck.detectedTopic || 'Academic Subject'}</strong>
                    </span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-[#059669] border border-[#A7F3D0]">
                    High Signal
                  </span>
                </div>
              )}
            </div>
          )}

          {errorMessage && (
            <div className="p-3 rounded-lg bg-[#FEE2E2] border border-[#FCA5A5] text-[#DC2626] text-xs font-medium">
              {errorMessage}
            </div>
          )}


          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E7E9F0]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-white hover:bg-[#F8FAFC] text-[#64748B] text-xs font-semibold border border-[#E7E9F0] transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting || !playlistUrl.trim()}
              className="px-4 py-2 rounded-lg bg-[#4F46E5] hover:bg-[#4338CA] disabled:opacity-50 text-white text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm"
              id="btn-import-submit"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Generating AI Material...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Import & Auto-Generate</span>
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

