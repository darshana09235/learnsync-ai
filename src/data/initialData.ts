import { CoursePlaylist, UserProfile, NoteEntry, Quiz, QuizResult, AIRecommendation } from '../types';

export const INITIAL_USER: UserProfile = {
  id: 'usr_student_101',
  name: 'Student',
  email: '',
  avatarUrl: 'https://ui-avatars.com/api/?name=Student&background=random',
  streakDays: 0,
  lastActiveDate: new Date().toISOString().split('T')[0],
  targetDailyMinutes: 45,
  minutesWatchedToday: 0,
  totalNotesCount: 0,
  quizzesCompletedCount: 0,
};

export const INITIAL_COURSES: CoursePlaylist[] = [];
export const INITIAL_NOTES: NoteEntry[] = [];
export const INITIAL_QUIZZES: Quiz[] = [];
export const INITIAL_QUIZ_RESULTS: QuizResult[] = [];
export const INITIAL_RECOMMENDATIONS: AIRecommendation[] = [];

