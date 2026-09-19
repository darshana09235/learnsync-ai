export type HealthZone = 'GREEN' | 'YELLOW' | 'RED';

export interface HealthScoreBreakdown {
  quizPerformance: number; // 0-100 (40% weight)
  videoCompletionRatio: number; // 0-100 (30% weight)
  consistencyStreak: number; // 0-100 (20% weight)
  noteQualityDepth: number; // 0-100 (10% weight)
}

export interface HealthScore {
  totalScore: number; // 0-100
  zone: HealthZone;
  feedback: string;
  breakdown: HealthScoreBreakdown;
  weakTopics: string[];
  strongTopics: string[];
}

export interface VideoItem {
  id: string;
  youtubeVideoId: string;
  title: string;
  description: string;
  durationSeconds: number;
  durationFormatted: string;
  thumbnailUrl: string;
  order: number;
  completed: boolean;
  lastWatchTimeSeconds: number;
  isStudyRelated?: boolean;
  studySuitability?: 'HIGH' | 'MODERATE' | 'LOW_SIGNAL_TRIVIAL';
  warningMessage?: string;
  detectedTopic?: string;
}

export interface CoursePlaylist {
  id: string;
  youtubePlaylistId?: string;
  title: string;
  category: string;
  description: string;
  thumbnailUrl: string;
  totalVideos: number;
  completedVideos: number;
  progressPercent: number;
  authorName: string;
  videos: VideoItem[];
  createdDate: string;
  isStudyRelated?: boolean;
  studySuitability?: 'HIGH' | 'MODERATE' | 'LOW_SIGNAL_TRIVIAL';
  warningMessage?: string;
  detectedTopic?: string;
}

export interface GapBand {
  id: string;
  startSeconds: number;
  endSeconds: number;
  topic: string;
}

export interface ImportCourseResponse {
  course: CoursePlaylist;
  autoQuiz?: Quiz;
  initialNotes?: NoteEntry[];
  initialSegments?: VideoSegment[];
  gapBands?: GapBand[];
  recommendations?: AIRecommendation[];
  isStudyRelated: boolean;
  studySuitability: 'HIGH' | 'MODERATE' | 'LOW_SIGNAL_TRIVIAL';
  warningMessage?: string;
  detectedTopic?: string;
}

export interface NoteEntry {
  id: string;
  courseId: string;
  videoId: string;
  timestampSeconds: number;
  timestampFormatted: string;
  content: string;
  tags: string[];
  createdAt: string;
}

export interface VideoSegment {
  segmentId: string;
  startSeconds: number;
  endSeconds: number;
  classification: 'INSTRUCTIONAL' | 'LOW_SIGNAL' | 'TRANSITIONAL';
  confidence: number;
  reason: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
  topicTag: string;
  segmentId?: string;
  sourceEvidence?: {
    startSeconds: number;
    endSeconds: number;
    excerpt: string;
  };
  verificationStatus?: 'VERIFIED' | 'REJECTED';
  confidenceScore?: number;
}

export interface Quiz {
  id: string;
  courseId?: string;
  videoId: string;
  videoTitle: string;
  questions: QuizQuestion[];
  skippedSegments?: number;
  createdDate: string;
}

export interface QuizResult {
  quizId: string;
  score: number; // percentage
  correctCount: number;
  totalCount: number;
  userAnswers: Record<string, number>; // questionId -> selectedIndex
  weakTopicsIdentified: string[];
  completedAt: string;
}

export interface AIRecommendation {
  id: string;
  title: string;
  channelTitle: string;
  youtubeVideoId: string;
  thumbnailUrl: string;
  reasonTag: string;
  weakTopicTarget: string;
  searchQuery: string;
  resourceUrl?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  streakDays: number;
  lastActiveDate: string;
  targetDailyMinutes: number;
  minutesWatchedToday: number;
  totalNotesCount: number;
  quizzesCompletedCount: number;
}

export interface BlueprintModule {
  id: number;
  title: string;
  shortTitle: string;
  description: string;
  iconName: string;
  sections: {
    heading: string;
    content: string; // Markdown / styled text
    codeBlock?: {
      language: string;
      code: string;
    };
  }[];
}
