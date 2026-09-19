import { HealthScore, HealthZone, CoursePlaylist, QuizResult, NoteEntry } from '../types';

export function calculateHealthScore(
  courses: CoursePlaylist[],
  quizResults: QuizResult[],
  notes: NoteEntry[],
  streakDays: number
): HealthScore {
  // 1. Quiz Performance (40% Weight)
  let quizPerfScore = 0; // Default baseline
  const topicScoresMap: Record<string, { total: number; correct: number }> = {};

  if (quizResults.length > 0) {
    let totalScoreSum = 0;
    quizResults.forEach((res) => {
      totalScoreSum += res.score;
      res.weakTopicsIdentified.forEach((topic) => {
        if (!topicScoresMap[topic]) {
          topicScoresMap[topic] = { total: 0, correct: 0 };
        }
        topicScoresMap[topic].total += 1;
      });
    });
    quizPerfScore = Math.min(100, Math.round(totalScoreSum / quizResults.length));
  }

  // 2. Video Completion Ratio (30% Weight)
  let videoCompletionScore = 0;
  if (courses.length > 0) {
    let totalVideos = 0;
    let completedVideos = 0;
    courses.forEach((course) => {
      totalVideos += course.totalVideos;
      completedVideos += course.completedVideos;
    });
    videoCompletionScore = totalVideos > 0 ? Math.round((completedVideos / totalVideos) * 100) : 0;
  } else {
    videoCompletionScore = 0;
  }

  // 3. Consistency & Streak (20% Weight)
  // Max streak benchmark: 14 days = 100%
  const streakScore = Math.min(100, Math.round((streakDays / 14) * 100));

  // 4. Active Recall & Note Quality (10% Weight)
  // Depth based on total notes and average length per note
  let noteQualityScore = 0;
  if (notes.length > 0) {
    const avgLength = notes.reduce((acc, n) => acc + n.content.length, 0) / notes.length;
    // Benchmarks: 10+ notes with avg length > 100 chars
    const countFactor = Math.min(1, notes.length / 8);
    const lengthFactor = Math.min(1, avgLength / 120);
    noteQualityScore = Math.round((countFactor * 0.6 + lengthFactor * 0.4) * 100);
  }

  // Weighted Health Score Calculation
  const totalScore = Math.round(
    quizPerfScore * 0.4 +
    videoCompletionScore * 0.3 +
    streakScore * 0.2 +
    noteQualityScore * 0.1
  );

  let zone: HealthZone = 'YELLOW';
  let feedback = '';

  if (totalScore >= 80) {
    zone = 'GREEN';
    feedback = 'High Mastery — Ready to advance to complex topics and industry projects!';
  } else if (totalScore >= 50) {
    zone = 'YELLOW';
    feedback = 'Moderate Retention — Revise weak concepts and complete pending video quizzes before proceeding.';
  } else {
    zone = 'RED';
    feedback = 'Critical Gaps — High drop-off or failing quiz scores detected. Mandatory topic review recommended.';
  }

  // Identify weak & strong topics
  const weakTopics = Object.keys(topicScoresMap);
  const strongTopics: string[] = [];

  return {
    totalScore,
    zone,
    feedback,
    breakdown: {
      quizPerformance: quizPerfScore,
      videoCompletionRatio: videoCompletionScore,
      consistencyStreak: streakScore,
      noteQualityDepth: noteQualityScore,
    },
    weakTopics,
    strongTopics,
  };
}
