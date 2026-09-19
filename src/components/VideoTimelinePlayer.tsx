import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  FastForward, Play, Pause, Volume2, VolumeX, RotateCcw, AlertTriangle, 
  Sparkles, CheckCircle2, ChevronRight, Bookmark, Clock, Maximize2 
} from 'lucide-react';
import { NoteEntry, GapBand, VideoItem } from '../types';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface VideoTimelinePlayerProps {
  video: VideoItem;
  notes: NoteEntry[];
  gapBands?: GapBand[];
  onSeekTime?: (seconds: number) => void;
  onCurrentTimeChange?: (seconds: number, formatted: string) => void;
}

export const VideoTimelinePlayer: React.FC<VideoTimelinePlayerProps> = ({
  video,
  notes,
  gapBands = [],
  onSeekTime,
  onCurrentTimeChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const timelineTrackRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const pollIntervalRef = useRef<any>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isPlayerReady, setIsPlayerReady] = useState<boolean>(false);
  const [duration, setDuration] = useState<number>(video.durationSeconds || 720);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [hoveredNote, setHoveredNote] = useState<NoteEntry | null>(null);
  const [hoveredNotePos, setHoveredNotePos] = useState<number>(0);
  const [activeIframeId] = useState<string>(`yt-player-${Math.random().toString(36).substring(2, 9)}`);

  // Format seconds to MM:SS or HH:MM:SS
  const formatSeconds = (sec: number): string => {
    if (isNaN(sec) || sec < 0) return '00:00';
    const totalSecs = Math.floor(sec);
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Sort notes by timestamp ascending
  const sortedNotes = useMemo(() => {
    const videoNotes = notes.filter((n) => n.videoId === video.id);
    return [...videoNotes].sort((a, b) => a.timestampSeconds - b.timestampSeconds);
  }, [notes, video.id]);

  // Find next note ahead of current playhead
  const nextNoteAhead = useMemo(() => {
    // Current playhead with 0.5s tolerance to avoid staying on current note
    return sortedNotes.find((n) => n.timestampSeconds > currentTime + 0.8);
  }, [sortedNotes, currentTime]);

  // Load YouTube IFrame API Script
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
    }
  }, []);

  // Initialize YT.Player on video change
  useEffect(() => {
    let playerInstance: any = null;
    let isCancelled = false;

    setIsPlayerReady(false);
    setCurrentTime(0);
    setDuration(video.durationSeconds || 720);

    const initPlayer = () => {
      if (isCancelled || !window.YT || !window.YT.Player) return;

      try {
        if (playerRef.current && typeof playerRef.current.destroy === 'function') {
          playerRef.current.destroy();
        }

        playerInstance = new window.YT.Player(activeIframeId, {
          videoId: video.youtubeVideoId,
          playerVars: {
            autoplay: 0,
            controls: 1,
            modestbranding: 1,
            rel: 0,
            enablejsapi: 1,
            origin: window.location.origin,
          },
          events: {
            onReady: (event: any) => {
              if (isCancelled) return;
              playerRef.current = event.target;
              setIsPlayerReady(true);
              const realDuration = event.target.getDuration();
              if (realDuration && !isNaN(realDuration) && realDuration > 0) {
                setDuration(realDuration);
              }
              startPolling();
            },
            onStateChange: (event: any) => {
              if (isCancelled) return;
              // YT.PlayerState: 1 = PLAYING, 2 = PAUSED, 0 = ENDED
              if (event.data === 1) {
                setIsPlaying(true);
              } else {
                setIsPlaying(false);
                if (event.data === 0) {
                  // Video finished
                  setCurrentTime(duration);
                }
              }
            },
          },
        });
      } catch (err) {
        console.warn('YouTube IFrame API mount issue, using interactive timeline overlay:', err);
      }
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      window.onYouTubeIframeAPIReady = () => {
        initPlayer();
      };
      // Fallback timer if onYouTubeIframeAPIReady already fired
      const timer = setTimeout(() => {
        if (!isPlayerReady && window.YT && window.YT.Player) {
          initPlayer();
        }
      }, 1000);
      return () => clearTimeout(timer);
    }

    return () => {
      isCancelled = true;
      stopPolling();
      if (playerRef.current && typeof playerRef.current.destroy === 'function') {
        try {
          playerRef.current.destroy();
        } catch (_) {}
      }
    };
  }, [video.id, video.youtubeVideoId, activeIframeId]);

  const onCurrentTimeChangeRef = useRef(onCurrentTimeChange);
  useEffect(() => {
    onCurrentTimeChangeRef.current = onCurrentTimeChange;
  }, [onCurrentTimeChange]);

  // Polling playback time
  const startPolling = () => {
    stopPolling();
    pollIntervalRef.current = setInterval(() => {
      if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
        try {
          const curr = playerRef.current.getCurrentTime();
          const dur = playerRef.current.getDuration();
          if (dur && !isNaN(dur) && dur > 0) {
            setDuration(dur);
          }
          if (curr !== undefined && !isNaN(curr)) {
            setCurrentTime(curr);
            onCurrentTimeChangeRef.current?.(curr, formatSeconds(curr));
          }
        } catch (_) {}
      }
    }, 350);
  };

  const stopPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  };

  // Safe seek handler
  const seekToSeconds = (targetSec: number) => {
    const clamped = Math.max(0, Math.min(targetSec, duration));
    setCurrentTime(clamped);
    onCurrentTimeChangeRef.current?.(clamped, formatSeconds(clamped));
    onSeekTime?.(clamped);

    if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
      try {
        playerRef.current.seekTo(clamped, true);
      } catch (err) {
        console.warn('seekTo error:', err);
      }
    }
  };

  // Skip button click: jump to next note ahead
  const handleSkipToNextNote = () => {
    if (nextNoteAhead) {
      seekToSeconds(nextNoteAhead.timestampSeconds);
    }
  };

  // Play / Pause toggle
  const handleTogglePlay = () => {
    if (playerRef.current) {
      try {
        if (isPlaying) {
          playerRef.current.pauseVideo();
          setIsPlaying(false);
        } else {
          playerRef.current.playVideo();
          setIsPlaying(true);
        }
      } catch (_) {
        // Fallback state toggle
        setIsPlaying(!isPlaying);
      }
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  // Mute toggle
  const handleToggleMute = () => {
    if (playerRef.current) {
      try {
        if (isMuted) {
          playerRef.current.unMute();
          setIsMuted(false);
        } else {
          playerRef.current.mute();
          setIsMuted(true);
        }
      } catch (_) {}
    } else {
      setIsMuted(!isMuted);
    }
  };

  // Timeline click / scrub handler
  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineTrackRef.current || duration <= 0) return;
    const rect = timelineTrackRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const targetSeconds = ratio * duration;
    seekToSeconds(targetSeconds);
  };

  // Drag scrub support
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    handleTrackClick(e);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !timelineTrackRef.current || duration <= 0) return;
      const rect = timelineTrackRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const ratio = Math.max(0, Math.min(1, clickX / rect.width));
      const targetSeconds = ratio * duration;
      seekToSeconds(targetSeconds);
    };

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
      }
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, duration]);

  // Derived percentages with divide-by-zero guards
  const safeDuration = duration > 0 ? duration : 1;
  const playheadPercent = Math.max(0, Math.min(100, (currentTime / safeDuration) * 100));

  // Determine Skip Button State & Label
  const skipButtonInfo = useMemo(() => {
    if (!isPlayerReady && duration <= 0) {
      return {
        disabled: true,
        label: 'Loading...',
        targetTime: null,
      };
    }
    if (sortedNotes.length === 0) {
      return {
        disabled: true,
        label: 'No notes yet',
        targetTime: null,
      };
    }
    if (!nextNoteAhead) {
      return {
        disabled: true,
        label: 'No more notes',
        targetTime: null,
      };
    }
    return {
      disabled: false,
      label: 'Skip to next note',
      targetTime: formatSeconds(nextNoteAhead.timestampSeconds),
    };
  }, [isPlayerReady, duration, sortedNotes.length, nextNoteAhead]);

  return (
    <div className="space-y-4 font-sans" ref={containerRef} id="learnsync-video-player-container">
      
      {/* Trivial / Non-Study Video Warning Banner if detected */}
      {video.isStudyRelated === false && (
        <div className="bg-[#FEF3C7] border border-[#FDE68A] text-[#92400E] rounded-2xl p-4 flex items-start gap-3 shadow-xs">
          <AlertTriangle className="w-5 h-5 text-[#D97706] shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <div className="font-bold flex items-center gap-1.5">
              <span>Non-Study / Trivial Video Detected</span>
              <span className="px-2 py-0.5 rounded-full bg-white/80 text-[#B45309] font-bold text-[10px] uppercase border border-[#FCD34D]">
                {video.studySuitability || 'LOW SIGNAL'}
              </span>
            </div>
            <p className="text-[#78350F] leading-relaxed">
              {video.warningMessage || 'This video appears to be entertainment, music, or non-educational content. LearnSync AI active recall quizzes and gap analysis perform best on structured academic lectures, tech tutorials, and study modules.'}
            </p>
          </div>
        </div>
      )}

      {/* Main YouTube Player Frame */}
      <div className="bg-[#0F172A] rounded-2xl overflow-hidden border border-[#E7E9F0] shadow-md relative aspect-video w-full">
        <div id={activeIframeId} className="w-full h-full" />
      </div>

      {/* TIMELINE & SKIP BUTTON UI SPEC COMPONENT */}
      <div className="bg-white border border-[#E7E9F0] rounded-2xl p-5 shadow-sm space-y-4" id="timeline-skip-controls">
        
        {/* Track Area Container */}
        <div className="relative pt-2 pb-1 select-none">
          
          {/* Main Track (8px tall, rounded, light lavender #E7E5FB) */}
          <div
            ref={timelineTrackRef}
            onClick={handleTrackClick}
            onMouseDown={handleMouseDown}
            className="w-full h-2 rounded-full bg-[#E7E5FB] relative cursor-pointer group"
          >
            {/* Watched Fill (Indigo #5B4FE9) */}
            <div
              className="h-full rounded-full bg-[#5B4FE9] transition-all duration-75 pointer-events-none"
              style={{ width: `${playheadPercent}%` }}
            />

            {/* Gap Bands (AI-Flagged Weak Concepts from Quiz) */}
            {gapBands.map((gap) => {
              const leftPercent = Math.max(0, Math.min(100, (gap.startSeconds / safeDuration) * 100));
              const widthPercent = Math.max(
                1,
                Math.min(100 - leftPercent, ((gap.endSeconds - gap.startSeconds) / safeDuration) * 100)
              );
              return (
                <div
                  key={gap.id}
                  className="absolute top-0 h-2 bg-[#FEE2E2] border border-[#DC2626] rounded-xs opacity-90 pointer-events-none z-10"
                  style={{
                    left: `${leftPercent}%`,
                    width: `${widthPercent}%`,
                  }}
                  title={`AI Identified Gap: ${gap.topic}`}
                />
              );
            })}

            {/* Note Markers (Small amber pins #D97706 with white outline ring) */}
            {sortedNotes.map((note) => {
              const notePercent = Math.max(0, Math.min(100, (note.timestampSeconds / safeDuration) * 100));
              return (
                <div
                  key={note.id}
                  onMouseEnter={() => {
                    setHoveredNote(note);
                    setHoveredNotePos(notePercent);
                  }}
                  onMouseLeave={() => setHoveredNote(null)}
                  onClick={(e) => {
                    e.stopPropagation();
                    seekToSeconds(note.timestampSeconds);
                  }}
                  className="absolute top-1/2 -translate-y-1/2 -ml-1.5 w-3.5 h-3.5 rounded-full bg-[#D97706] ring-2 ring-white shadow-xs cursor-pointer hover:scale-130 transition-transform z-20"
                  style={{ left: `${notePercent}%` }}
                />
              );
            })}

            {/* Active Playhead (Indigo circle, white border, sits on top) */}
            <div
              className="absolute top-1/2 -translate-y-1/2 -ml-2 w-4 h-4 rounded-full bg-[#5B4FE9] border-2 border-white shadow-md cursor-pointer hover:scale-125 transition-transform z-30 pointer-events-none"
              style={{ left: `${playheadPercent}%` }}
            />
          </div>

          {/* Hover Note Tooltip Popup */}
          {hoveredNote && (
            <div
              className="absolute bottom-6 -translate-x-1/2 bg-[#0F172A] text-white p-3 rounded-xl shadow-xl z-40 text-xs pointer-events-none border border-slate-700 min-w-[200px] max-w-[280px] space-y-1 animate-in fade-in zoom-in-95 duration-100"
              style={{ left: `${hoveredNotePos}%` }}
            >
              <div className="flex items-center justify-between text-[11px] font-mono text-amber-400 border-b border-slate-700/60 pb-1">
                <span className="font-bold flex items-center gap-1">
                  <Bookmark className="w-3 h-3" />
                  {hoveredNote.timestampFormatted || formatSeconds(hoveredNote.timestampSeconds)}
                </span>
                <span className="text-[10px] text-slate-400">Click to seek</span>
              </div>
              <p className="text-slate-200 line-clamp-2 leading-relaxed text-[11px]">
                {hoveredNote.content}
              </p>
            </div>
          )}
        </div>

        {/* Row 2: Time Labels & Skip Button (Opposite aligned) */}
        <div className="flex items-center justify-between pt-1 text-xs">
          
          {/* Current Time / Total Duration */}
          <div className="font-mono text-[#0F172A] font-semibold flex items-center gap-2">
            <span className="text-[#5B4FE9] font-bold text-sm">
              {formatSeconds(currentTime)}
            </span>
            <span className="text-[#94A3B8]">/</span>
            <span className="text-[#64748B] text-sm">
              {formatSeconds(duration)}
            </span>
          </div>

          {/* Skip Button */}
          <button
            onClick={handleSkipToNextNote}
            disabled={skipButtonInfo.disabled}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-xs ${
              skipButtonInfo.disabled
                ? 'bg-[#F1F5F9] text-[#94A3B8] border border-[#E2E8F0] cursor-not-allowed opacity-80'
                : 'bg-[#FFFBEB] hover:bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A] hover:border-[#FCD34D] cursor-pointer shadow-xs active:scale-98'
            }`}
            id="btn-skip-to-next-note"
          >
            <FastForward className={`w-4 h-4 ${skipButtonInfo.disabled ? 'text-[#94A3B8]' : 'text-[#D97706]'}`} />
            <span>{skipButtonInfo.label}</span>
            {skipButtonInfo.targetTime && (
              <span className="font-mono font-bold bg-[#FDE68A]/60 px-1.5 py-0.5 rounded text-[11px]">
                {skipButtonInfo.targetTime}
              </span>
            )}
          </button>
        </div>

        {/* Row 3: Legend Bar (as documented in PDF spec page 4) */}
        <div className="flex flex-wrap items-center gap-5 pt-3 border-t border-[#E7E9F0] text-xs text-[#64748B]">
          
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#5B4FE9] inline-block" />
            <span className="font-medium text-[#0F172A]">Watched</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#E7E5FB] inline-block border border-[#D5D2F8]" />
            <span>Unwatched</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#D97706] ring-1 ring-white inline-block" />
            <span>Active-recall note</span>
          </div>

        </div>

      </div>

    </div>
  );
};
