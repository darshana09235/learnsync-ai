import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { CoursePlaylist, VideoItem, NoteEntry, Quiz, QuizQuestion, QuizResult, AIRecommendation, UserProfile, VideoSegment } from '../src/types';
import { TranscriptSegment } from './transcriptService';
import { INITIAL_COURSES, INITIAL_NOTES, INITIAL_QUIZZES, INITIAL_USER } from '../src/data/initialData';

const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'learnsync.db');

// Ensure directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

export const sqlite = new Database(DB_FILE);

// Enable WAL mode and foreign keys for high performance and integrity
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

// Initialize database schema tables
export function initSchema() {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS user_profile (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT,
      avatar_url TEXT,
      streak_days INTEGER DEFAULT 0,
      last_active_date TEXT,
      target_daily_minutes INTEGER DEFAULT 45,
      minutes_watched_today INTEGER DEFAULT 0,
      total_notes_count INTEGER DEFAULT 0,
      quizzes_completed_count INTEGER DEFAULT 0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS courses (
      id TEXT PRIMARY KEY,
      youtube_playlist_id TEXT,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT,
      thumbnail_url TEXT,
      total_videos INTEGER DEFAULT 0,
      completed_videos INTEGER DEFAULT 0,
      progress_percent INTEGER DEFAULT 0,
      author_name TEXT,
      created_date TEXT,
      is_study_related INTEGER DEFAULT 1,
      study_suitability TEXT DEFAULT 'HIGH',
      warning_message TEXT,
      detected_topic TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS videos (
      id TEXT PRIMARY KEY,
      course_id TEXT NOT NULL,
      youtube_video_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      duration_seconds INTEGER DEFAULT 0,
      duration_formatted TEXT,
      thumbnail_url TEXT,
      video_order INTEGER DEFAULT 1,
      completed INTEGER DEFAULT 0,
      last_watch_time_seconds INTEGER DEFAULT 0,
      is_study_related INTEGER DEFAULT 1,
      study_suitability TEXT DEFAULT 'HIGH',
      warning_message TEXT,
      detected_topic TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS transcripts (
      video_id TEXT PRIMARY KEY,
      has_transcript INTEGER DEFAULT 0,
      segments_json TEXT,
      full_text TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS video_segments (
      id TEXT PRIMARY KEY,
      video_id TEXT NOT NULL,
      segment_id TEXT NOT NULL,
      start_seconds INTEGER NOT NULL,
      end_seconds INTEGER NOT NULL,
      classification TEXT NOT NULL,
      confidence REAL DEFAULT 0.95,
      reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS quizzes (
      id TEXT PRIMARY KEY,
      course_id TEXT,
      video_id TEXT NOT NULL,
      video_title TEXT NOT NULL,
      skipped_segments INTEGER DEFAULT 0,
      created_date TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS quiz_questions (
      id TEXT PRIMARY KEY,
      quiz_id TEXT NOT NULL,
      question TEXT NOT NULL,
      options_json TEXT NOT NULL,
      correct_option_index INTEGER NOT NULL,
      explanation TEXT,
      topic_tag TEXT,
      start_seconds INTEGER,
      end_seconds INTEGER,
      excerpt TEXT,
      verification_status TEXT DEFAULT 'VERIFIED',
      confidence_score REAL DEFAULT 0.98,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS quiz_results (
      id TEXT PRIMARY KEY,
      quiz_id TEXT NOT NULL,
      score INTEGER NOT NULL,
      correct_count INTEGER NOT NULL,
      total_count INTEGER NOT NULL,
      user_answers_json TEXT NOT NULL,
      weak_topics_json TEXT NOT NULL,
      completed_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      course_id TEXT NOT NULL,
      videoId TEXT NOT NULL,
      timestamp_seconds INTEGER NOT NULL,
      timestamp_formatted TEXT NOT NULL,
      content TEXT NOT NULL,
      tags_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS recommendations (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      channel_title TEXT,
      youtube_video_id TEXT NOT NULL,
      thumbnail_url TEXT,
      reason_tag TEXT,
      weak_topic_target TEXT,
      search_query TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_videos_course ON videos(course_id);
    CREATE INDEX IF NOT EXISTS idx_questions_quiz ON quiz_questions(quiz_id);
    CREATE INDEX IF NOT EXISTS idx_notes_video ON notes(videoId);
    CREATE INDEX IF NOT EXISTS idx_notes_course ON notes(course_id);
    CREATE INDEX IF NOT EXISTS idx_segments_video ON video_segments(video_id);
  `);
  try {
    sqlite.exec(`ALTER TABLE user_profile ADD COLUMN password TEXT`);
  } catch (err) {
    // Column might already exist
  }
}

initSchema();

// NUCLEAR PRESENTATION MODE: Purge old templates
try {
  sqlite.exec(`
    DELETE FROM quiz_questions;
    DELETE FROM quizzes;
  `);
  console.log('☢️  NUCLEAR MODE: Old quizzes and questions purged from DB.');
} catch (err) {
  console.warn('Failed to purge old quizzes:', err);
}

// Seed initial database if empty
export function seedInitialDataIfEmpty() {
  const courseCount = (sqlite.prepare('SELECT COUNT(*) as count FROM courses').get() as any).count;
  if (courseCount > 0) return;

  const insertUser = sqlite.prepare(`
    INSERT OR REPLACE INTO user_profile (id, name, email, avatar_url, streak_days, last_active_date, target_daily_minutes, minutes_watched_today, total_notes_count, quizzes_completed_count)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertUser.run(
    INITIAL_USER.id,
    INITIAL_USER.name,
    INITIAL_USER.email,
    INITIAL_USER.avatarUrl,
    INITIAL_USER.streakDays,
    INITIAL_USER.lastActiveDate,
    INITIAL_USER.targetDailyMinutes,
    INITIAL_USER.minutesWatchedToday,
    INITIAL_USER.totalNotesCount,
    INITIAL_USER.quizzesCompletedCount
  );

  const insertCourse = sqlite.prepare(`
    INSERT INTO courses (id, youtube_playlist_id, title, category, description, thumbnail_url, total_videos, completed_videos, progress_percent, author_name, created_date, is_study_related, study_suitability, warning_message, detected_topic)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertVideo = sqlite.prepare(`
    INSERT INTO videos (id, course_id, youtube_video_id, title, description, duration_seconds, duration_formatted, thumbnail_url, video_order, completed, last_watch_time_seconds, is_study_related, study_suitability, warning_message, detected_topic)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertTx = sqlite.transaction(() => {
    for (const c of INITIAL_COURSES) {
      insertCourse.run(
        c.id,
        c.youtubePlaylistId || null,
        c.title,
        c.category,
        c.description,
        c.thumbnailUrl,
        c.totalVideos,
        c.completedVideos,
        c.progressPercent,
        c.authorName,
        c.createdDate,
        c.isStudyRelated === false ? 0 : 1,
        c.studySuitability || 'HIGH',
        c.warningMessage || null,
        c.detectedTopic || c.title
      );

      for (const v of c.videos) {
        insertVideo.run(
          v.id,
          c.id,
          v.youtubeVideoId,
          v.title,
          v.description,
          v.durationSeconds,
          v.durationFormatted,
          v.thumbnailUrl,
          v.order,
          v.completed ? 1 : 0,
          v.lastWatchTimeSeconds,
          v.isStudyRelated === false ? 0 : 1,
          v.studySuitability || 'HIGH',
          v.warningMessage || null,
          v.detectedTopic || v.title
        );
      }
    }

    const insertQuiz = sqlite.prepare(`
      INSERT INTO quizzes (id, course_id, video_id, video_title, skipped_segments, created_date)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const insertQuestion = sqlite.prepare(`
      INSERT INTO quiz_questions (id, quiz_id, question, options_json, correct_option_index, explanation, topic_tag, start_seconds, end_seconds, excerpt, verification_status, confidence_score)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const q of INITIAL_QUIZZES) {
      insertQuiz.run(
        q.id,
        q.courseId || null,
        q.videoId,
        q.videoTitle,
        q.skippedSegments || 0,
        q.createdDate
      );

      for (const ques of q.questions) {
        insertQuestion.run(
          ques.id,
          q.id,
          ques.question,
          JSON.stringify(ques.options),
          ques.correctOptionIndex,
          ques.explanation,
          ques.topicTag,
          ques.sourceEvidence?.startSeconds ?? 60,
          ques.sourceEvidence?.endSeconds ?? 180,
          ques.sourceEvidence?.excerpt ?? ques.explanation,
          ques.verificationStatus || 'VERIFIED',
          ques.confidenceScore || 0.98
        );
      }
    }

    const insertNote = sqlite.prepare(`
      INSERT INTO notes (id, course_id, videoId, timestamp_seconds, timestamp_formatted, content, tags_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const n of INITIAL_NOTES) {
      insertNote.run(
        n.id,
        n.courseId,
        n.videoId,
        n.timestampSeconds,
        n.timestampFormatted,
        n.content,
        JSON.stringify(n.tags),
        n.createdAt
      );
    }
  });

  insertTx();
}

seedInitialDataIfEmpty();

// Database Query APIs
export function getAllCourses(): CoursePlaylist[] {
  const courseRows = sqlite.prepare('SELECT * FROM courses ORDER BY created_at DESC').all() as any[];
  const videoRows = sqlite.prepare('SELECT * FROM videos ORDER BY video_order ASC').all() as any[];

  return courseRows.map((c) => {
    const courseVideos = videoRows
      .filter((v) => v.course_id === c.id)
      .map((v) => ({
        id: v.id,
        youtubeVideoId: v.youtube_video_id,
        title: v.title,
        description: v.description,
        durationSeconds: v.duration_seconds,
        durationFormatted: v.duration_formatted,
        thumbnailUrl: v.thumbnail_url,
        order: v.video_order,
        completed: Boolean(v.completed),
        lastWatchTimeSeconds: v.last_watch_time_seconds,
        isStudyRelated: Boolean(v.is_study_related),
        studySuitability: v.study_suitability,
        warningMessage: v.warning_message || undefined,
        detectedTopic: v.detected_topic || undefined,
      }));

    return {
      id: c.id,
      youtubePlaylistId: c.youtube_playlist_id || undefined,
      title: c.title,
      category: c.category,
      description: c.description,
      thumbnailUrl: c.thumbnail_url,
      totalVideos: c.total_videos,
      completedVideos: c.completed_videos,
      progressPercent: c.progress_percent,
      authorName: c.author_name,
      createdDate: c.created_date,
      isStudyRelated: Boolean(c.is_study_related),
      studySuitability: c.study_suitability,
      warningMessage: c.warning_message || undefined,
      detectedTopic: c.detected_topic || undefined,
      videos: courseVideos,
    };
  });
}

export function getAllQuizzes(): Quiz[] {
  const quizRows = sqlite.prepare('SELECT * FROM quizzes ORDER BY created_at DESC').all() as any[];
  const questionRows = sqlite.prepare('SELECT * FROM quiz_questions').all() as any[];

  return quizRows.map((q) => {
    const questions: QuizQuestion[] = questionRows
      .filter((ques) => ques.quiz_id === q.id)
      .map((ques) => ({
        id: ques.id,
        question: ques.question,
        options: JSON.parse(ques.options_json || '[]'),
        correctOptionIndex: ques.correct_option_index,
        explanation: ques.explanation,
        topicTag: ques.topic_tag,
        sourceEvidence: {
          startSeconds: ques.start_seconds || 0,
          endSeconds: ques.end_seconds || 180,
          excerpt: ques.excerpt || '',
        },
        verificationStatus: ques.verification_status || 'VERIFIED',
        confidenceScore: ques.confidence_score || 0.98,
      }));

    return {
      id: q.id,
      courseId: q.course_id || undefined,
      videoId: q.video_id,
      videoTitle: q.video_title,
      skippedSegments: q.skipped_segments,
      createdDate: q.created_date,
      questions,
    };
  });
}

export function getAllNotes(): NoteEntry[] {
  const rows = sqlite.prepare('SELECT * FROM notes ORDER BY created_at DESC').all() as any[];
  return rows.map((r) => ({
    id: r.id,
    courseId: r.course_id,
    videoId: r.videoId,
    timestampSeconds: r.timestamp_seconds,
    timestampFormatted: r.timestamp_formatted,
    content: r.content,
    tags: JSON.parse(r.tags_json || '[]'),
    createdAt: r.created_at,
  }));
}

export function getAllQuizResults(): QuizResult[] {
  const rows = sqlite.prepare('SELECT * FROM quiz_results ORDER BY completed_at DESC').all() as any[];
  return rows.map((r) => ({
    quizId: r.quiz_id,
    score: r.score,
    correctCount: r.correct_count,
    totalCount: r.total_count,
    userAnswers: JSON.parse(r.user_answers_json || '{}'),
    weakTopicsIdentified: JSON.parse(r.weak_topics_json || '[]'),
    completedAt: r.completed_at,
  }));
}

export function getAllRecommendations(): AIRecommendation[] {
  const rows = sqlite.prepare('SELECT * FROM recommendations ORDER BY created_at DESC').all() as any[];
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    channelTitle: r.channel_title,
    youtubeVideoId: r.youtube_video_id,
    thumbnailUrl: r.thumbnail_url,
    reasonTag: r.reason_tag,
    weakTopicTarget: r.weak_topic_target,
    searchQuery: r.search_query,
  }));
}

export function getUserProfile(): UserProfile {
  const row = sqlite.prepare('SELECT * FROM user_profile LIMIT 1').get() as any;
  if (!row) return INITIAL_USER;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    avatarUrl: row.avatar_url,
    streakDays: row.streak_days,
    lastActiveDate: row.last_active_date,
    targetDailyMinutes: row.target_daily_minutes,
    minutesWatchedToday: row.minutes_watched_today,
    totalNotesCount: row.total_notes_count,
    quizzesCompletedCount: row.quizzes_completed_count,
  };
}

export function getUserByEmail(email: string): any {
  return sqlite.prepare('SELECT * FROM user_profile WHERE email = ?').get(email);
}

export function getAllUsers(): UserProfile[] {
  const rows = sqlite.prepare('SELECT * FROM user_profile').all() as any[];
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    avatarUrl: row.avatar_url,
    streakDays: row.streak_days,
    lastActiveDate: row.last_active_date,
    targetDailyMinutes: row.target_daily_minutes,
    minutesWatchedToday: row.minutes_watched_today,
    totalNotesCount: row.total_notes_count,
    quizzesCompletedCount: row.quizzes_completed_count,
  }));
}

// Full State API for backward compatibility
export function getDatabase() {
  return {
    courses: getAllCourses(),
    quizzes: getAllQuizzes(),
    notes: getAllNotes(),
    quizResults: getAllQuizResults(),
    recommendations: getAllRecommendations(),
    userProfile: getUserProfile(),
  };
}

export function saveDatabase(updated: any) {
  if (updated.courses && Array.isArray(updated.courses)) {
    for (const c of updated.courses) {
      saveCourse(c);
    }
  }
  if (updated.quizzes && Array.isArray(updated.quizzes)) {
    for (const q of updated.quizzes) {
      saveQuiz(q);
    }
  }
  if (updated.notes && Array.isArray(updated.notes)) {
    for (const n of updated.notes) {
      saveNote(n);
    }
  }
  if (updated.quizResults && Array.isArray(updated.quizResults)) {
    for (const r of updated.quizResults) {
      saveQuizResult(r);
    }
  }
  if (updated.userProfile) {
    saveUser(updated.userProfile);
  }
}

export function saveUser(user: UserProfile, password?: string) {
  const stmt = sqlite.prepare(`
    INSERT INTO user_profile 
    (id, name, email, password, avatar_url, streak_days, last_active_date, target_daily_minutes, minutes_watched_today, total_notes_count, quizzes_completed_count)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    user.id,
    user.name,
    user.email,
    password || null,
    user.avatarUrl,
    user.streakDays,
    user.lastActiveDate,
    user.targetDailyMinutes,
    user.minutesWatchedToday,
    user.totalNotesCount,
    user.quizzesCompletedCount
  );
}

// Granular Data Operations
export function saveCourse(course: CoursePlaylist) {
  const insertCourse = sqlite.prepare(`
    INSERT OR REPLACE INTO courses (
      id, youtube_playlist_id, title, category, description, thumbnail_url,
      total_videos, completed_videos, progress_percent, author_name, created_date,
      is_study_related, study_suitability, warning_message, detected_topic
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertVideo = sqlite.prepare(`
    INSERT OR REPLACE INTO videos (
      id, course_id, youtube_video_id, title, description,
      duration_seconds, duration_formatted, thumbnail_url, video_order,
      completed, last_watch_time_seconds, is_study_related, study_suitability,
      warning_message, detected_topic
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const tx = sqlite.transaction(() => {
    insertCourse.run(
      course.id,
      course.youtubePlaylistId || null,
      course.title,
      course.category,
      course.description,
      course.thumbnailUrl,
      course.totalVideos,
      course.completedVideos,
      course.progressPercent,
      course.authorName,
      course.createdDate,
      course.isStudyRelated === false ? 0 : 1,
      course.studySuitability || 'HIGH',
      course.warningMessage || null,
      course.detectedTopic || course.title
    );

    if (course.videos && Array.isArray(course.videos)) {
      for (const v of course.videos) {
        insertVideo.run(
          v.id,
          course.id,
          v.youtubeVideoId,
          v.title,
          v.description,
          v.durationSeconds,
          v.durationFormatted,
          v.thumbnailUrl,
          v.order,
          v.completed ? 1 : 0,
          v.lastWatchTimeSeconds || 0,
          v.isStudyRelated === false ? 0 : 1,
          v.studySuitability || 'HIGH',
          v.warningMessage || null,
          v.detectedTopic || v.title
        );
      }
    }
  });

  tx();
}

export function saveQuiz(quiz: Quiz) {
  const insertQuiz = sqlite.prepare(`
    INSERT OR REPLACE INTO quizzes (id, course_id, video_id, video_title, skipped_segments, created_date)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const insertQuestion = sqlite.prepare(`
    INSERT OR REPLACE INTO quiz_questions (
      id, quiz_id, question, options_json, correct_option_index, explanation,
      topic_tag, start_seconds, end_seconds, excerpt, verification_status, confidence_score
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const tx = sqlite.transaction(() => {
    insertQuiz.run(
      quiz.id,
      quiz.courseId || null,
      quiz.videoId,
      quiz.videoTitle,
      quiz.skippedSegments || 0,
      quiz.createdDate || new Date().toISOString().split('T')[0]
    );

    if (quiz.questions && Array.isArray(quiz.questions)) {
      for (const q of quiz.questions) {
        insertQuestion.run(
          q.id,
          quiz.id,
          q.question,
          JSON.stringify(q.options),
          q.correctOptionIndex,
          q.explanation,
          q.topicTag,
          q.sourceEvidence?.startSeconds ?? 0,
          q.sourceEvidence?.endSeconds ?? 180,
          q.sourceEvidence?.excerpt ?? q.explanation,
          q.verificationStatus || 'VERIFIED',
          q.confidenceScore || 0.98
        );
      }
    }
  });

  tx();
}

export function saveNote(note: NoteEntry) {
  const stmt = sqlite.prepare(`
    INSERT OR REPLACE INTO notes (id, course_id, videoId, timestamp_seconds, timestamp_formatted, content, tags_json, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    note.id,
    note.courseId,
    note.videoId,
    note.timestampSeconds,
    note.timestampFormatted,
    note.content,
    JSON.stringify(note.tags || []),
    note.createdAt || new Date().toISOString().replace('T', ' ').substring(0, 16)
  );

  // Increment user notes count
  sqlite.prepare('UPDATE user_profile SET total_notes_count = total_notes_count + 1').run();
}

export function deleteNote(id: string) {
  sqlite.prepare('DELETE FROM notes WHERE id = ?').run(id);
}

export function saveQuizResult(result: QuizResult) {
  const id = 'qr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
  const stmt = sqlite.prepare(`
    INSERT INTO quiz_results (id, quiz_id, score, correct_count, total_count, user_answers_json, weak_topics_json, completed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    id,
    result.quizId,
    result.score,
    result.correctCount,
    result.totalCount,
    JSON.stringify(result.userAnswers || {}),
    JSON.stringify(result.weakTopicsIdentified || []),
    result.completedAt || new Date().toISOString()
  );

  // Update user profile quiz stats
  sqlite.prepare('UPDATE user_profile SET quizzes_completed_count = quizzes_completed_count + 1').run();
}

export function saveTranscriptCache(videoId: string, transcriptData: {
  hasTranscript: boolean;
  segments: TranscriptSegment[];
  fullText: string;
}) {
  const stmt = sqlite.prepare(`
    INSERT OR REPLACE INTO transcripts (video_id, has_transcript, segments_json, full_text)
    VALUES (?, ?, ?, ?)
  `);
  stmt.run(
    videoId,
    transcriptData.hasTranscript ? 1 : 0,
    JSON.stringify(transcriptData.segments || []),
    transcriptData.fullText || ''
  );
}

export function getTranscriptCache(videoId: string): {
  videoId: string;
  hasTranscript: boolean;
  segments: TranscriptSegment[];
  fullText: string;
} | null {
  const row = sqlite.prepare('SELECT * FROM transcripts WHERE video_id = ?').get(videoId) as any;
  if (!row) return null;
  return {
    videoId: row.video_id,
    hasTranscript: Boolean(row.has_transcript),
    segments: JSON.parse(row.segments_json || '[]'),
    fullText: row.full_text || '',
  };
}

export function saveClassifiedSegments(videoId: string, segments: VideoSegment[]) {
  const insertSegment = sqlite.prepare(`
    INSERT OR REPLACE INTO video_segments (id, video_id, segment_id, start_seconds, end_seconds, classification, confidence, reason)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const tx = sqlite.transaction(() => {
    for (const s of segments) {
      const segId = s.segmentId || `seg_${s.startSeconds}`;
      insertSegment.run(
        `${videoId}_${segId}`,
        videoId,
        segId,
        s.startSeconds,
        s.endSeconds,
        s.classification,
        s.confidence || 0.95,
        s.reason || ''
      );
    }
  });

  tx();
}

export function getClassifiedSegments(videoId: string): VideoSegment[] {
  const rows = sqlite.prepare('SELECT * FROM video_segments WHERE video_id = ? ORDER BY start_seconds ASC').all(videoId) as any[];
  return rows.map((r) => ({
    segmentId: r.segment_id,
    startSeconds: r.start_seconds,
    endSeconds: r.end_seconds,
    classification: r.classification,
    confidence: r.confidence,
    reason: r.reason,
  }));
}

export function updateVideoWatchProgress(videoId: string, lastWatchTimeSeconds: number, completed: boolean) {
  sqlite.prepare(`
    UPDATE videos
    SET last_watch_time_seconds = ?, completed = ?
    WHERE id = ? OR youtube_video_id = ?
  `).run(lastWatchTimeSeconds, completed ? 1 : 0, videoId, videoId);

  // Recalculate course completion & progress
  const video = sqlite.prepare('SELECT course_id FROM videos WHERE id = ? OR youtube_video_id = ? LIMIT 1').get(videoId, videoId) as any;
  if (video && video.course_id) {
    const counts = sqlite.prepare(`
      SELECT COUNT(*) as total, SUM(completed) as completedCount
      FROM videos WHERE course_id = ?
    `).get(video.course_id) as any;

    if (counts && counts.total > 0) {
      const progressPercent = Math.round((counts.completedCount / counts.total) * 100);
      sqlite.prepare(`
        UPDATE courses
        SET completed_videos = ?, progress_percent = ?
        WHERE id = ?
      `).run(counts.completedCount, progressPercent, video.course_id);
    }
  }
}

// Database Diagnostics / Health Check for Admin Console
export function getDatabaseDiagnostics() {
  const stats = {
    driver: 'better-sqlite3',
    databaseFile: DB_FILE,
    journalMode: (sqlite.pragma('journal_mode', { simple: true }) as string).toUpperCase(),
    fileSizeBytes: fs.existsSync(DB_FILE) ? fs.statSync(DB_FILE).size : 0,
    tableCounts: {
      courses: (sqlite.prepare('SELECT COUNT(*) as c FROM courses').get() as any).c,
      videos: (sqlite.prepare('SELECT COUNT(*) as c FROM videos').get() as any).c,
      quizzes: (sqlite.prepare('SELECT COUNT(*) as c FROM quizzes').get() as any).c,
      quizQuestions: (sqlite.prepare('SELECT COUNT(*) as c FROM quiz_questions').get() as any).c,
      quizResults: (sqlite.prepare('SELECT COUNT(*) as c FROM quiz_results').get() as any).c,
      notes: (sqlite.prepare('SELECT COUNT(*) as c FROM notes').get() as any).c,
      transcripts: (sqlite.prepare('SELECT COUNT(*) as c FROM transcripts').get() as any).c,
      videoSegments: (sqlite.prepare('SELECT COUNT(*) as c FROM video_segments').get() as any).c,
    },
    integrityCheck: sqlite.pragma('integrity_check', { simple: true }),
  };
  return stats;
}
