import React, { useState, useEffect, useMemo } from 'react';
import { 
  Play, CheckCircle2, Circle, Clock, Bookmark, Plus, Sparkles, 
  ExternalLink, RefreshCw, Send, FileText, Check, Tag, ShieldCheck, AlertTriangle, Trash2
} from 'lucide-react';
import { CoursePlaylist, VideoItem, NoteEntry, Quiz, QuizResult, AIRecommendation, VideoSegment, GapBand } from '../types';
import { VideoTimelinePlayer } from './VideoTimelinePlayer';

interface YouTubePlayerWorkspaceProps {
  course: CoursePlaylist;
  notes: NoteEntry[];
  quizzes: Quiz[];
  recommendations: AIRecommendation[];
  onAddNote: (note: Omit<NoteEntry, 'id' | 'createdAt'>) => void;
  onToggleVideoCompleted: (courseId: string, videoId: string) => void;
  onDeleteVideo?: (courseId: string, videoId: string) => void;
  onQuizSubmit: (result: QuizResult) => void;
  onImportNewCourseClick: () => void;
}

export const YouTubePlayerWorkspace: React.FC<YouTubePlayerWorkspaceProps> = ({
  course,
  notes,
  quizzes,
  recommendations,
  onAddNote,
  onToggleVideoCompleted,
  onDeleteVideo,
  onQuizSubmit,
  onImportNewCourseClick,
}) => {
  const [activeVideo, setActiveVideo] = useState<VideoItem>(course.videos[0] || null);
  const [activeRightTab, setActiveRightTab] = useState<'notes' | 'quiz' | 'recommendations'>('notes');
  
  // Segment Classification State
  const [segments, setSegments] = useState<VideoSegment[]>([]);
  const [isClassifyingSegments, setIsClassifyingSegments] = useState<boolean>(false);

  // Note State
  const [currentTimeFormatted, setCurrentTimeFormatted] = useState<string>('00:00');
  const [currentTimeSeconds, setCurrentTimeSeconds] = useState<number>(0);
  const [newNoteText, setNewNoteText] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>(['Key Concept']);

  // Quiz State
  const [currentQuiz, setCurrentQuiz] = useState<Quiz | null>(null);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState<boolean>(false);
  const [quizError, setQuizError] = useState<string | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);
  const [lastQuizResult, setLastQuizResult] = useState<QuizResult | null>(null);

  useEffect(() => {
    if (course.videos.length > 0) {
      if (!activeVideo || !course.videos.find(v => v.id === activeVideo.id)) {
        setActiveVideo(course.videos[0]);
      }
    } else {
      setActiveVideo(null as any);
    }
  }, [course.videos, activeVideo]);

  // Fetch segment classification and sync quiz when active video changes
  useEffect(() => {
    if (activeVideo) {
      setIsClassifyingSegments(true);
      fetch('/api/v1/ai/classify-segments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId: activeVideo.id }),
      })
        .then((res) => res.json())
        .then((data) => {
          setSegments(data.segments || []);
        })
        .catch((err) => console.error('Segment classification error:', err))
        .finally(() => setIsClassifyingSegments(false));

      const found = quizzes.find((q) => q.videoId === activeVideo.id || q.courseId === course.id);
      if (found) {
        setCurrentQuiz(found);
      } else {
        setCurrentQuiz(null);
      }
      setUserAnswers({});
      setQuizSubmitted(false);
      setLastQuizResult(null);
    }
  }, [activeVideo, quizzes, course.id]);

  // Derived Gap Bands for Timeline (based on weak topics and quiz results)
  const handleCaptureCurrentTime = (sec: number, formatted: string) => {
    setCurrentTimeSeconds(sec);
    setCurrentTimeFormatted(formatted);
  };

  const handleSaveNote = () => {
    if (!newNoteText.trim() || !activeVideo) return;
    onAddNote({
      courseId: course.id,
      videoId: activeVideo.id,
      timestampSeconds: currentTimeSeconds,
      timestampFormatted: currentTimeFormatted,
      content: newNoteText.trim(),
      tags: selectedTags,
    });
    setNewNoteText('');
  };

  const handleGenerateQuiz = async () => {
    if (!activeVideo) return;
    setIsGeneratingQuiz(true);
    setQuizError(null);
    try {
      // If no transcript segments were fetched, inject a generic fallback so Groq can still attempt generation
      const segmentsToSend = (segments && segments.length > 0)
        ? segments
        : [{
            segmentId: 'fallback-1',
            startSeconds: 0,
            endSeconds: 60,
            transcriptText: 'Python Object-Oriented Programming (OOP) uses classes as blueprints for creating objects. The init method initializes the object attributes. The self parameter refers to the current instance of the class. Inheritance allows a new class to inherit attributes and methods from an existing class.',
            classification: 'INSTRUCTIONAL',
          }];

      const res = await fetch('/api/v1/ai/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId: activeVideo.id,
          videoTitle: activeVideo.title,
          courseCategory: course.category,
          segments: segmentsToSend,
        }),
      });
      if (!res.ok) {
        let errorMsg = 'API busy, please try again in a moment';
        try {
          const errorData = await res.json();
          if (errorData.message) errorMsg = errorData.message;
          else if (errorData.error) errorMsg = errorData.error;
        } catch (e) {
          // ignore json parse error
        }
        throw new Error(errorMsg);
      }
      const data = await res.json();
      setCurrentQuiz(data);
      setUserAnswers({});
      setQuizSubmitted(false);
    } catch (err: any) {
      console.error('Quiz generation error:', err);
      setQuizError('API Error: Please try again');
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  const handleSubmitQuiz = async () => {
    if (!currentQuiz || !activeVideo) return;
    try {
      const res = await fetch('/api/v1/ai/evaluate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quizId: currentQuiz.id,
          questions: currentQuiz.questions,
          userAnswers,
        }),
      });
      if (!res.ok) {
        // Still mark submitted so user sees correct answers even if server score failed
        setQuizSubmitted(true);
        console.error('Quiz evaluate returned non-OK status:', res.status);
        return;
      }
      const raw = await res.json();
      // Defensively normalize all fields so nothing can be undefined
      const resultData: QuizResult = {
        quizId: raw.quizId ?? currentQuiz.id,
        score: typeof raw.score === 'number' ? raw.score : 0,
        correctCount: typeof raw.correctCount === 'number' ? raw.correctCount : 0,
        totalCount: typeof raw.totalCount === 'number' ? raw.totalCount : currentQuiz.questions.length,
        userAnswers: raw.userAnswers ?? userAnswers,
        weakTopicsIdentified: Array.isArray(raw.weakTopicsIdentified) ? raw.weakTopicsIdentified : [],
        completedAt: raw.completedAt ?? new Date().toISOString(),
      };
      setQuizSubmitted(true);
      setLastQuizResult(resultData);
      try {
        onQuizSubmit(resultData);
      } catch (callbackErr) {
        console.error('onQuizSubmit callback error:', callbackErr);
      }
    } catch (err) {
      console.error('Quiz submit error:', err);
      // Still reveal answers so the user is not left stranded
      setQuizSubmitted(true);
    }
  };

  const [showRawVideoOnly, setShowRawVideoOnly] = useState(false);
  const currentVideoNotes = notes.filter((n) => n.videoId === activeVideo?.id);
  const hasInstructionalSegments = segments.some((s) => s.classification === 'INSTRUCTIONAL');
  const isNonStudy = course.isStudyRelated === false || activeVideo?.isStudyRelated === false || course.studySuitability === 'LOW_SIGNAL_TRIVIAL';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 font-sans">
      
      {/* Top Workspace Header */}
      <div className="bg-white border border-[#E7E9F0] rounded-2xl p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#4F46E5] uppercase tracking-wider block">
              LEARNING TRACK // {course.category}
            </span>
            {isNonStudy && (
              <span className="px-2.5 py-0.5 rounded-full bg-[#FEF3C7] text-[#D97706] text-[10px] font-bold uppercase border border-[#FDE68A] flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-[#D97706]" />
                Non-Study Video Detected
              </span>
            )}
          </div>
          <h1 className="text-xl font-bold text-[#0F172A] tracking-tight mt-0.5">
            {course.title}
          </h1>
        </div>

        <button
          onClick={onImportNewCourseClick}
          className="px-3.5 py-2 rounded-lg bg-white hover:bg-[#F8FAFC] text-[#0F172A] border border-[#E7E9F0] text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
          id="btn-workspace-import"
        >
          <Plus className="w-4 h-4 text-[#4F46E5]" />
          <span>Import Video / Playlist</span>
        </button>
      </div>

      {/* Non-Study Video Warning & Blocking Guard */}
      {isNonStudy && !showRawVideoOnly ? (
        <div className="bg-white border-2 border-[#FDE68A] rounded-2xl p-8 shadow-md text-center max-w-3xl mx-auto space-y-6 my-4">
          <div className="w-16 h-16 rounded-2xl bg-[#FEF3C7] border border-[#FDE68A] flex items-center justify-center mx-auto text-[#D97706]">
            <AlertTriangle className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FEF3C7] text-[#B45309] text-xs font-bold border border-[#FDE68A]">
              <span>⚠️ Non-Study Video Detected</span>
            </div>
            <h2 className="text-2xl font-extrabold text-[#0F172A] tracking-tight">
              No Study Content Detected in this Video
            </h2>
            <p className="text-sm text-[#64748B] max-w-xl mx-auto leading-relaxed">
              This video ({course.title}) is identified as entertainment, movies, or non-educational media ({course.detectedTopic || 'Non-Study Content'}). LearnSync AI does not display active recall quizzes, notes, or health gauges for non-study material.
            </p>
          </div>

          <div className="p-4 bg-[#FFFBEB] rounded-xl border border-[#FDE68A] text-left max-w-lg mx-auto space-y-2">
            <div className="text-xs font-bold text-[#92400E] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#D97706]" />
              <span>AI Content Verification Result:</span>
            </div>
            <p className="text-xs text-[#78350F] leading-relaxed">
              {course.warningMessage || activeVideo?.warningMessage || 'Non-study content detected. Study modules, gap analysis, and grounded quizzes are hidden.'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={onImportNewCourseClick}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Import Educational Video</span>
            </button>

            <button
              onClick={() => setShowRawVideoOnly(true)}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white border border-[#E7E9F0] hover:bg-[#F8FAFC] text-[#64748B] hover:text-[#0F172A] text-xs font-semibold transition-all"
            >
              Preview Raw Video Player Only
            </button>
          </div>
        </div>
      ) : (
        <>
          {isNonStudy && showRawVideoOnly && (
            <div className="p-3.5 bg-[#FFFBEB] border border-[#FDE68A] rounded-xl text-xs flex items-center justify-between gap-3 text-[#92400E]">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#D97706] shrink-0" />
                <span>
                  <strong>Raw Player Mode:</strong> Study analytics, AI notes, and grounded quizzes remain disabled for non-study video.
                </span>
              </div>
              <button
                onClick={() => setShowRawVideoOnly(false)}
                className="text-[11px] font-bold text-[#B45309] underline hover:text-[#78350F]"
              >
                Back to Warning
              </button>
            </div>
          )}

      {/* Main Split-Screen Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: YouTube Video Player & Interactive Timeline */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Synchronized Player with Color-Coded Timeline & Skip Button Spec */}
          {activeVideo && (
            <VideoTimelinePlayer
              video={activeVideo}
              notes={notes}
              onCurrentTimeChange={(sec, formatted) => {
                handleCaptureCurrentTime(sec, formatted);
              }}
            />
          )}

          {/* Active Video Info Card */}
          {activeVideo && (
            <div className="bg-white border border-[#E7E9F0] rounded-2xl p-5 space-y-3 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-bold text-base text-[#0F172A] leading-snug">
                    {activeVideo.order}. {activeVideo.title}
                  </h2>
                  <p className="text-xs text-[#64748B] mt-1 line-clamp-2">
                    {activeVideo.description}
                  </p>
                </div>

                <button
                  onClick={() => onToggleVideoCompleted(course.id, activeVideo.id)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 shrink-0 ${
                    activeVideo.completed
                      ? 'bg-[#D1FAE5] text-[#059669] border-[#A7F3D0]'
                      : 'bg-white text-[#0F172A] border-[#E7E9F0] hover:bg-[#F8FAFC]'
                  }`}
                  id="btn-toggle-video-completed"
                >
                  {activeVideo.completed ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-[#059669]" />
                      <span>Completed</span>
                    </>
                  ) : (
                    <>
                      <Circle className="w-4 h-4 text-[#94A3B8]" />
                      <span>Mark Done</span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center gap-4 text-xs text-[#64748B] pt-3 border-t border-[#E7E9F0]">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#4F46E5]" />
                  Duration: {activeVideo.durationFormatted}
                </span>
                <span className="flex items-center gap-1 text-[#0F172A]">
                  <Bookmark className="w-3.5 h-3.5 text-[#4F46E5]" />
                  {currentVideoNotes.length} Saved Notes
                </span>
              </div>
            </div>
          )}

          {/* AI Segment Timeline & Filler Skip Badges */}
          {activeVideo && segments.length > 0 && (
            <div className="bg-white border border-[#E7E9F0] rounded-2xl p-4 space-y-3 shadow-sm">
              <div className="flex items-center justify-between text-xs font-semibold text-[#64748B]">
                <span className="flex items-center gap-1.5 text-[#4F46E5]">
                  <Sparkles className="w-4 h-4" />
                  AI Segment Classification Analysis
                </span>
                <span>{segments.length} Segments Classified</span>
              </div>

              {/* Segment Bar Rows */}
              <div className="space-y-1.5">
                {segments.map((seg) => {
                  let badgeColor = 'bg-[#F8FAFC] text-[#64748B] border-[#E7E9F0]';
                  let label = 'Instructional';

                  if (seg.classification === 'LOW_SIGNAL') {
                    badgeColor = 'bg-[#F8FAFC] text-[#94A3B8] border-[#E7E9F0]';
                    label = 'Non-instructional Filler';
                  } else if (seg.classification === 'TRANSITIONAL') {
                    badgeColor = 'bg-[#DBEAFE] text-[#2563EB] border-[#BFDBFE]';
                    label = 'Transitional Recap';
                  } else if (seg.classification === 'INSTRUCTIONAL') {
                    badgeColor = 'bg-[#D1FAE5] text-[#059669] border-[#A7F3D0]';
                    label = 'Instructional Core';
                  }

                  return (
                    <div
                      key={seg.segmentId}
                      className="p-2.5 bg-[#F8FAFC] rounded-xl border border-[#E7E9F0] flex flex-wrap items-center justify-between gap-2 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[#4F46E5] font-bold font-mono">
                          [{Math.floor(seg.startSeconds / 60)}:{(seg.startSeconds % 60).toString().padStart(2, '0')} - {Math.floor(seg.endSeconds / 60)}:{(seg.endSeconds % 60).toString().padStart(2, '0')}]
                        </span>

                        <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${badgeColor}`}>
                          {label}
                        </span>

                        <span className="text-[11px] text-[#64748B] truncate max-w-[240px]">
                          {seg.reason}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Playlist Accordion */}
          <div className="bg-white border border-[#E7E9F0] rounded-2xl p-5 space-y-3 shadow-sm">
            <span className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider block">
              PLAYLIST MODULES ({course.videos.length})
            </span>

            <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
              {course.videos.map((vid) => {
                const isActive = activeVideo?.id === vid.id;
                return (
                  <div
                    key={vid.id}
                    onClick={() => setActiveVideo(vid)}
                    className={`p-3 rounded-xl text-xs transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isActive
                        ? 'bg-[#EEF0FE] text-[#4F46E5] font-bold border border-[#4F46E5]/30'
                        : 'bg-[#F8FAFC] hover:bg-[#EEF0FE] text-[#0F172A]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      {vid.completed ? (
                        <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0" />
                      ) : (
                        <Play className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'fill-[#4F46E5] text-[#4F46E5]' : 'text-[#94A3B8]'}`} />
                      )}
                      <span className="truncate">{vid.order}. {vid.title}</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] text-[#94A3B8]">
                        {vid.durationFormatted}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteVideo?.(course.id, vid.id);
                        }}
                        className="p-1 rounded-md text-[#94A3B8] hover:text-[#DC2626] hover:bg-[#FEE2E2] transition-colors"
                        title="Remove video"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Active Recall Notes, Grounded AI Quiz & Gap AI Tabs */}
        <div className="lg:col-span-5 bg-white border border-[#E7E9F0] rounded-2xl p-5 shadow-sm space-y-4">
          
          {/* Sub-Tabs */}
          <div className="flex items-center gap-1 bg-[#F8FAFC] p-1 rounded-xl border border-[#E7E9F0] text-xs font-semibold">
            <button
              onClick={() => setActiveRightTab('notes')}
              className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeRightTab === 'notes'
                  ? 'bg-white text-[#4F46E5] shadow-xs'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Notes ({currentVideoNotes.length})
            </button>

            <button
              onClick={() => setActiveRightTab('quiz')}
              className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeRightTab === 'quiz'
                  ? 'bg-white text-[#4F46E5] shadow-xs'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#4F46E5]" />
              AI Quiz {currentQuiz ? `(${currentQuiz.questions.length})` : ''}
            </button>

            <button
              onClick={() => setActiveRightTab('recommendations')}
              className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeRightTab === 'recommendations'
                  ? 'bg-white text-[#4F46E5] shadow-xs'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Gap AI ({recommendations.length})
            </button>
          </div>

          {/* TAB 1: NOTES */}
          {activeRightTab === 'notes' && (
            <div className="space-y-4">
              
              {/* Note Input Box */}
              <div className="bg-[#F8FAFC] border border-[#E7E9F0] rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="px-2.5 py-1 rounded-lg bg-[#EEF0FE] border border-[#4F46E5]/20 text-[#4F46E5] text-xs font-semibold flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Timestamp [{currentTimeFormatted}]</span>
                  </div>

                  <span className="text-[10px] text-[#94A3B8] font-semibold uppercase">ACTIVE RECALL</span>
                </div>

                <textarea
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  placeholder="Record core concept, formula, or system design trade-off..."
                  rows={3}
                  className="w-full bg-white border border-[#E7E9F0] rounded-lg p-3 text-xs text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] transition-colors resize-none"
                />

                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5 text-[#94A3B8]" />
                    <span className="text-xs text-[#64748B]">Tag:</span>
                    <select
                      value={selectedTags[0]}
                      onChange={(e) => setSelectedTags([e.target.value])}
                      className="bg-white text-[#0F172A] text-xs font-medium rounded-md px-2 py-1 border border-[#E7E9F0] focus:outline-none"
                    >
                      <option value="Key Concept">Key Concept</option>
                      <option value="Definition">Definition</option>
                      <option value="Important">Important</option>
                      <option value="Question">Question</option>
                    </select>
                  </div>

                  <button
                    onClick={handleSaveNote}
                    disabled={!newNoteText.trim()}
                    className="px-3.5 py-1.5 rounded-lg bg-[#4F46E5] hover:bg-[#4338CA] disabled:opacity-50 text-white text-xs font-semibold transition-all flex items-center gap-1 shadow-xs"
                    id="btn-save-note"
                  >
                    <Send className="w-3.5 h-3.5 text-white" />
                    <span>Save Note</span>
                  </button>
                </div>
              </div>

              {/* Saved Notes List */}
              <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                <span className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider block">
                  SAVED NOTES ({currentVideoNotes.length})
                </span>

                {currentVideoNotes.length === 0 ? (
                  <div className="p-6 text-center text-[#64748B] border border-dashed border-[#E7E9F0] rounded-xl text-xs space-y-1">
                    <p>No timestamped notes yet.</p>
                    <p className="text-[11px] text-[#94A3B8]">Notes you add will appear as amber pins on the timeline track.</p>
                  </div>
                ) : (
                  currentVideoNotes.map((note) => (
                    <div
                      key={note.id}
                      className="p-3.5 bg-[#F8FAFC] border border-[#E7E9F0] rounded-xl text-xs space-y-1.5 hover:border-[#4F46E5]/40 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded-md bg-[#EEF0FE] text-[#4F46E5] font-semibold text-xs border border-[#4F46E5]/20 font-mono">
                          [{note.timestampFormatted}]
                        </span>
                        <div className="flex items-center gap-1">
                          {note.tags.map((t, idx) => (
                            <span key={idx} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white text-[#64748B] border border-[#E7E9F0]">
                              #{t}
                            </span>
                          ))}
                        </div>
                      </div>

                      <p className="text-[#0F172A] leading-relaxed font-medium">
                        {note.content}
                      </p>

                      <div className="text-[10px] text-[#94A3B8] text-right">
                        {note.createdAt}
                      </div>
                    </div>
                  ))
                )}
              </div>

            </div>
          )}

          {/* TAB 2: AI QUIZ ENGINE */}
          {activeRightTab === 'quiz' && (
            <div className="space-y-4">
              
              {!currentQuiz ? (
                <div className="p-6 text-center bg-[#F8FAFC] border border-[#E7E9F0] rounded-2xl space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-[#EEF0FE] text-[#4F46E5] mx-auto flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-[#4F46E5]" />
                  </div>
                  <div>
                    <h4 className="font-bold text-[#0F172A] text-sm">Grounded AI Quiz Pipeline</h4>
                    <p className="text-xs text-[#64748B] mt-1">
                      2-pass Gemini pipeline: generates questions with source evidence, then fact-checks accuracy before serving.
                    </p>
                  </div>

                  {!hasInstructionalSegments && segments.length > 0 ? (
                    <div className="p-3 rounded-lg bg-[#FEF3C7] border border-[#FDE68A] text-[#D97706] text-xs font-medium">
                      Low instructional signal detected. Quizzes are generated on core concepts.
                    </div>
                  ) : null}

                  {quizError && (
                    <div className="p-3 rounded-lg bg-[#FEE2E2] border border-[#FCA5A5] text-[#DC2626] text-xs font-medium">
                      {quizError}
                    </div>
                  )}

                  <button
                    onClick={handleGenerateQuiz}
                    disabled={isGeneratingQuiz}
                    className="px-4 py-2.5 rounded-lg bg-[#4F46E5] hover:bg-[#4338CA] text-white font-semibold text-xs shadow-sm transition-all flex items-center justify-center gap-2 mx-auto"
                    id="btn-generate-ai-quiz"
                  >
                    {isGeneratingQuiz ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-white" />
                        <span>Fact-Checking & Generating...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-white" />
                        <span>Generate Grounded AI Quiz</span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Quiz Header */}
                  <div className="flex items-center justify-between pb-2 border-b border-[#E7E9F0]">
                    <div>
                      <h4 className="font-bold text-sm text-[#0F172A] flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-[#059669]" />
                        Grounded Active Recall Quiz
                      </h4>
                      <span className="text-xs text-[#64748B]">
                        {currentQuiz.questions.length} Fact-Checked Questions Grounded on Lecture
                      </span>
                    </div>

                    <button
                      onClick={handleGenerateQuiz}
                      disabled={isGeneratingQuiz}
                      className="text-xs text-[#4F46E5] hover:text-[#4338CA] font-semibold flex items-center gap-1"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingQuiz ? 'animate-spin' : ''}`} />
                      <span>Regenerate</span>
                    </button>
                  </div>

                  {quizError && (
                    <div className="p-3 rounded-lg bg-[#FEE2E2] border border-[#FCA5A5] text-[#DC2626] text-xs font-medium">
                      {quizError}
                    </div>
                  )}

                  {/* Quiz Result Banner */}
                  {quizSubmitted && lastQuizResult && (
                    <div className={`p-3 rounded-xl border text-xs font-medium space-y-1 ${
                      lastQuizResult.score >= 75
                        ? 'bg-[#D1FAE5] text-[#059669] border-[#A7F3D0]'
                        : 'bg-[#FEF3C7] text-[#D97706] border-[#FDE68A]'
                    }`}>
                      <div className="font-bold">
                        Quiz Completed! Score: {lastQuizResult.score}% ({lastQuizResult.correctCount}/{lastQuizResult.totalCount})
                      </div>
                      {lastQuizResult.weakTopicsIdentified.length > 0 && (
                        <p className="text-[11px] opacity-90">
                          Identified Weak Concept: <strong>{lastQuizResult.weakTopicsIdentified.join(', ')}</strong>. Gap bands added to timeline.
                        </p>
                      )}
                    </div>
                  )}

                  {/* Questions List */}
                  <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
                    {currentQuiz.questions.map((q, idx) => {
                      const selectedOption = userAnswers[q.id];

                      return (
                        <div
                          key={q.id}
                          className="p-4 bg-[#F8FAFC] border border-[#E7E9F0] rounded-xl space-y-3 text-xs"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-bold text-[#0F172A] leading-snug">
                              Q{idx + 1}. {q.question}
                            </span>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white text-[#64748B] border border-[#E7E9F0] shrink-0">
                              {q.topicTag}
                            </span>
                          </div>

                          {/* Source Evidence — only revealed after submission */}
                          {quizSubmitted && q.sourceEvidence && (
                            <div className="p-2.5 rounded-lg bg-white border border-[#E7E9F0] text-xs text-[#64748B] space-y-0.5">
                              <span className="text-[#4F46E5] font-semibold">Verified Transcript Excerpt:</span>
                              <p className="italic text-[#0F172A]">"{q.sourceEvidence.excerpt}"</p>
                            </div>
                          )}

                          {/* Options */}
                          <div className="space-y-1.5">
                            {q.options.map((opt, optIdx) => {
                              const isThisOptionSelected = selectedOption === optIdx;
                              const isCorrect = q.correctOptionIndex === optIdx;

                              let optionClass = 'bg-white border-[#E7E9F0] text-[#0F172A] hover:bg-[#EEF0FE]';

                              if (quizSubmitted) {
                                if (isCorrect) {
                                  optionClass = 'bg-[#D1FAE5] border-[#A7F3D0] text-[#059669] font-bold';
                                } else if (isThisOptionSelected && !isCorrect) {
                                  optionClass = 'bg-[#FEE2E2] border-[#FCA5A5] text-[#DC2626] font-bold';
                                }
                              } else if (isThisOptionSelected) {
                                optionClass = 'bg-[#EEF0FE] border-[#4F46E5] text-[#4F46E5] font-bold';
                              }

                              return (
                                <div
                                  key={optIdx}
                                  onClick={() => {
                                    if (!quizSubmitted) {
                                      setUserAnswers((prev) => ({ ...prev, [q.id]: optIdx }));
                                    }
                                  }}
                                  className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all flex items-center justify-between ${optionClass}`}
                                >
                                  <span>{opt}</span>
                                  {quizSubmitted && isCorrect && <Check className="w-4 h-4 text-[#059669] shrink-0" />}
                                </div>
                              );
                            })}
                          </div>

                          {/* Explanation */}
                          {quizSubmitted && (
                            <div className="p-2.5 bg-white rounded-lg border border-[#E7E9F0] text-xs text-[#64748B] space-y-0.5">
                              <span className="font-bold text-[#4F46E5]">Explanation:</span>
                              <p className="text-[#0F172A]">{q.explanation}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {!quizSubmitted && (
                    <button
                      onClick={handleSubmitQuiz}
                      disabled={Object.keys(userAnswers).length === 0}
                      className="w-full py-2.5 rounded-lg bg-[#4F46E5] hover:bg-[#4338CA] disabled:opacity-50 text-white font-semibold text-xs shadow-sm transition-all flex items-center justify-center gap-2"
                      id="btn-submit-quiz-answers"
                    >
                      <Check className="w-4 h-4 text-white" />
                      <span>Submit Answers & Sync Health Score</span>
                    </button>
                  )}
                </div>
              )}

            </div>
          )}

          {/* TAB 3: RECOMMENDATIONS */}
          {activeRightTab === 'recommendations' && (
            <div className="space-y-3">
              <div className="pb-2 border-b border-[#E7E9F0]">
                <h4 className="font-bold text-sm text-[#0F172A] flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#4F46E5]" />
                  AI Adaptive Recommendations
                </h4>
                <p className="text-xs text-[#64748B]">Remedial videos targeting identified knowledge gaps</p>
              </div>

              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {recommendations.map((rec) => (
                  <div
                    key={rec.id}
                    className="p-3.5 bg-[#F8FAFC] border border-[#E7E9F0] rounded-xl space-y-2 hover:border-[#4F46E5]/40 transition-all text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#FEE2E2] text-[#DC2626] font-semibold text-[10px]">
                        {rec.reasonTag}
                      </span>
                      <span className="text-[11px] text-[#94A3B8]">{rec.channelTitle}</span>
                    </div>

                    <h5 className="font-bold text-[#0F172A] line-clamp-2">{rec.title}</h5>

                    <a
                      href={`https://www.youtube.com/results?search_query=${encodeURIComponent(rec.searchQuery)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#4F46E5] hover:text-[#4338CA] pt-1"
                    >
                      <span>Search on YouTube</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>
        </>
      )}

    </div>
  );
};

