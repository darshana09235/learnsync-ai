import React, { useState, useMemo } from 'react';
import { 
  Sidebar 
} from './components/Sidebar';
import { 
  HeaderTopBar 
} from './components/HeaderTopBar';
import { 
  LoginView 
} from './components/LoginView';
import { 
  HealthScoreGauge 
} from './components/HealthScoreGauge';
import { 
  CourseCard 
} from './components/CourseCard';
import { 
  CoursesView 
} from './components/CoursesView';
import { 
  YouTubePlayerWorkspace 
} from './components/YouTubePlayerWorkspace';
import { 
  RecommendationsView 
} from './components/RecommendationsView';
import { 
  AnalyticsView 
} from './components/AnalyticsView';
import { 
  NotesHubView 
} from './components/NotesHubView';
import { 
  ProfileSettingsView 
} from './components/ProfileSettingsView';
import { 
  BlueprintExplorer 
} from './components/BlueprintExplorer';
import { 
  AdminConsoleView 
} from './components/AdminConsoleView';
import { 
  ImportCourseModal 
} from './components/ImportCourseModal';

import { 
  INITIAL_USER, 
  INITIAL_COURSES, 
  INITIAL_NOTES, 
  INITIAL_QUIZZES, 
  INITIAL_QUIZ_RESULTS, 
  INITIAL_RECOMMENDATIONS 
} from './data/initialData';

import { 
  CoursePlaylist, 
  NoteEntry, 
  Quiz, 
  QuizResult, 
  AIRecommendation, 
  UserProfile,
  ImportCourseResponse
} from './types';

import { calculateHealthScore } from './utils/healthScore';
import { BookOpen, Plus, FileCode2, Server } from 'lucide-react';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(true);
  const [user, setUser] = useState<UserProfile>(INITIAL_USER);
  const [courses, setCourses] = useState<CoursePlaylist[]>(INITIAL_COURSES);
  const [notes, setNotes] = useState<NoteEntry[]>(INITIAL_NOTES);
  const [quizzes, setQuizzes] = useState<Quiz[]>(INITIAL_QUIZZES);
  const [quizResults, setQuizResults] = useState<QuizResult[]>(INITIAL_QUIZ_RESULTS);
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>(INITIAL_RECOMMENDATIONS);

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedCourse, setSelectedCourse] = useState<CoursePlaylist>(INITIAL_COURSES[0]);
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);

  // Load persisted server state on startup
  React.useEffect(() => {
    fetch('/api/v1/state')
      .then((res) => res.json())
      .then((data) => {
        if (data.courses && data.courses.length > 0) {
          setCourses((prev) => {
            const combined = [...data.courses];
            // ensure initial courses remain if not already in db
            prev.forEach((p) => {
              if (!combined.some((c) => c.id === p.id)) {
                combined.push(p);
              }
            });
            return combined;
          });
        }
        if (data.quizzes && data.quizzes.length > 0) {
          setQuizzes((prev) => {
            const combined = [...data.quizzes];
            prev.forEach((p) => {
              if (!combined.some((q) => q.id === p.id)) combined.push(p);
            });
            return combined;
          });
        }
        if (data.notes && data.notes.length > 0) {
          setNotes((prev) => {
            const combined = [...data.notes];
            prev.forEach((p) => {
              if (!combined.some((n) => n.id === p.id)) combined.push(p);
            });
            return combined;
          });
        }
      })
      .catch((err) => console.warn('Could not sync persisted state:', err));
  }, []);

  // Dynamic Health Score
  const healthScore = useMemo(() => {
    return calculateHealthScore(courses, quizResults, notes, user.streakDays);
  }, [courses, quizResults, notes, user.streakDays]);

  // Auth Handlers
  const handleLogin = (userProfile: UserProfile) => {
    setUser(userProfile);
    setIsLoggedIn(true);
  };

  const handleDeleteCourse = (courseId: string) => {
    setCourses(prev => prev.filter(c => c.id !== courseId));
    if (selectedCourse?.id === courseId) {
      setSelectedCourse(null);
      setActiveTab('dashboard');
    }
  };

  const handleSignOut = () => {
    setIsLoggedIn(false);
  };

  // Toggle Video Completed
  const handleToggleVideoCompleted = (courseId: string, videoId: string) => {
    setCourses((prevCourses) =>
      prevCourses.map((c) => {
        if (c.id !== courseId) return c;

        const updatedVideos = c.videos.map((v) =>
          v.id === videoId ? { ...v, completed: !v.completed } : v
        );

        const completedCount = updatedVideos.filter((v) => v.completed).length;
        const progressPercent = Math.round((completedCount / updatedVideos.length) * 100);

        return {
          ...c,
          videos: updatedVideos,
          completedVideos: completedCount,
          progressPercent,
        };
      })
    );

    setSelectedCourse((prev) => {
      if (prev?.id !== courseId) return prev;
      const updatedVideos = prev.videos.map((v) =>
        v.id === videoId ? { ...v, completed: !v.completed } : v
      );
      
      const completedCount = updatedVideos.filter((v) => v.completed).length;
      return {
        ...prev,
        videos: updatedVideos,
        completedVideos: completedCount,
        progressPercent: Math.round((completedCount / updatedVideos.length) * 100),
      };
    });
  };

  // Delete Video
  const handleDeleteVideo = (courseId: string, videoId: string) => {
    setCourses((prevCourses) =>
      prevCourses.map((c) => {
        if (c.id !== courseId) return c;
        const updatedVideos = c.videos.filter((v) => v.id !== videoId);
        const completedCount = updatedVideos.filter((v) => v.completed).length;
        const progressPercent = updatedVideos.length > 0 
          ? Math.round((completedCount / updatedVideos.length) * 100) 
          : 0;
        return {
          ...c,
          videos: updatedVideos,
          completedVideos: completedCount,
          progressPercent,
        };
      })
    );

    setSelectedCourse((prev) => {
      if (prev?.id !== courseId) return prev;
      const updatedVideos = prev.videos.filter((v) => v.id !== videoId);
      const completedCount = updatedVideos.filter((v) => v.completed).length;
      return {
        ...prev,
        videos: updatedVideos,
        completedVideos: completedCount,
        progressPercent: updatedVideos.length > 0 
          ? Math.round((completedCount / updatedVideos.length) * 100) 
          : 0,
      };
    });
  };

  // Add Note
  const handleAddNote = async (newNoteData: Omit<NoteEntry, 'id' | 'createdAt'>) => {
    const newNote: NoteEntry = {
      ...newNoteData,
      id: 'note_' + Date.now(),
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };
    
    try {
      await fetch('/api/v1/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newNote),
      });
    } catch (err) {
      console.error('Failed to save note to backend', err);
    }

    setNotes((prev) => [newNote, ...prev]);
    setUser((prev) => ({ ...prev, totalNotesCount: prev.totalNotesCount + 1 }));
  };

  // Delete Note
  const handleDeleteNote = (noteId: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
  };

  // Quiz Submit
  const handleQuizSubmit = async (result: QuizResult) => {
    setQuizResults((prev) => [result, ...prev]);
    setUser((prev) => ({ ...prev, quizzesCompletedCount: prev.quizzesCompletedCount + 1 }));

    // Fetch Gap AI recommendations whenever weak topics are identified
    const weakTopics = result.weakTopicsIdentified ?? [];
    if (weakTopics.length > 0) {
      try {
        const res = await fetch('/api/v1/ai/recommendations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ weakTopics, videoId: activeVideoId }),
        });
        if (res.ok) {
          const data = await res.json();
          const newRecs: AIRecommendation[] = Array.isArray(data.recommendations) ? data.recommendations : [];
          if (newRecs.length > 0) {
            setRecommendations((prev) => [...newRecs, ...prev]);
          }
        }
      } catch (err) {
        console.error('Gap AI recommendations fetch error:', err);
      }
    }
  };

  // Import Course with Auto AI Generation
  const handleImportCourse = (importedData: ImportCourseResponse) => {
    const newCourse = importedData.course;
    setCourses((prev) => [newCourse, ...prev]);
    setSelectedCourse(newCourse);

    if (importedData.autoQuiz) {
      setQuizzes((prev) => [importedData.autoQuiz!, ...prev]);
    }

    if (importedData.initialNotes && importedData.initialNotes.length > 0) {
      setNotes((prev) => [...importedData.initialNotes!, ...prev]);
      setUser((prev) => ({
        ...prev,
        totalNotesCount: prev.totalNotesCount + importedData.initialNotes!.length,
      }));
    }

    if (importedData.recommendations && importedData.recommendations.length > 0) {
      setRecommendations((prev) => [...importedData.recommendations!, ...prev]);
    }

    setActiveTab('workspace');
  };

  if (!isLoggedIn) {
    return <LoginView onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-[#F5F6FA] text-[#0F172A] flex flex-col font-sans selection:bg-[#EEF0FE] selection:text-[#4F46E5]">
      
      {/* Top Header */}
      <HeaderTopBar
        user={user}
        onOpenImportModal={() => setIsImportModalOpen(true)}
        onSignOut={handleSignOut}
      />

      {/* Main App Layout */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Left Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          user={user}
          onSignOut={handleSignOut}
        />

        {/* Content View Container */}
        <main className="flex-1 overflow-y-auto pb-12">
          
          {/* Dashboard View */}
          {activeTab === 'dashboard' && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
              
              {/* Health Score Gauge */}
              <HealthScoreGauge
                healthScore={healthScore}
                onRemediateTopic={() => setActiveTab('workspace')}
              />

              {/* Courses Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-[#0F172A] tracking-tight flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-[#4F46E5]" />
                      Active Learning Tracks ({courses.length})
                    </h2>
                    <p className="text-sm text-[#64748B] mt-0.5">
                      Select a track to launch the learning workspace with active recall notes & AI quizzes.
                    </p>
                  </div>

                  <button
                    onClick={() => setIsImportModalOpen(true)}
                    className="px-4 py-2.5 rounded-lg bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm"
                    id="btn-dashboard-import"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Import Playlist</span>
                  </button>
                </div>

                {/* Course Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {courses.map((course) => (
                    <CourseCard
                      key={course.id}
                      course={course}
                      onSelectCourse={(selected) => {
                        setSelectedCourse(selected);
                        setActiveTab('workspace');
                      }}
                      onDeleteCourse={handleDeleteCourse}
                    />
                  ))}
                </div>
              </div>



            </div>
          )}

          {/* Courses View */}
          {activeTab === 'courses' && (
            <CoursesView
              courses={courses}
              onSelectCourse={(selected) => {
                setSelectedCourse(selected);
                setActiveTab('workspace');
              }}
              onOpenImportModal={() => setIsImportModalOpen(true)}
            />
          )}

          {/* Workspace View */}
          {activeTab === 'workspace' && (
            <YouTubePlayerWorkspace
              course={selectedCourse}
              notes={notes}
              quizzes={quizzes}
              recommendations={recommendations}
              onAddNote={handleAddNote}
              onToggleVideoCompleted={handleToggleVideoCompleted}
              onDeleteVideo={handleDeleteVideo}
              onQuizSubmit={handleQuizSubmit}
              onImportNewCourseClick={() => setIsImportModalOpen(true)}
            />
          )}

          {/* Recommendations View */}
          {activeTab === 'recommendations' && (
            <RecommendationsView
              recommendations={recommendations}
              quizResults={quizResults}
              onOpenWorkspace={() => setActiveTab('workspace')}
            />
          )}

          {/* Analytics View */}
          {activeTab === 'analytics' && (
            <AnalyticsView
              user={user}
              healthScore={healthScore}
              notes={notes}
              quizResults={quizResults}
            />
          )}

          {/* Notes Hub View */}
          {activeTab === 'notes' && (
            <NotesHubView
              notes={notes}
              courses={courses}
              onOpenWorkspace={(course) => {
                setSelectedCourse(course);
                setActiveTab('workspace');
              }}
              onDeleteNote={handleDeleteNote}
            />
          )}

          {/* Profile Settings View */}
          {activeTab === 'profile' && (
            <ProfileSettingsView
              user={user}
              healthScore={healthScore}
              courses={courses}
              onSignOut={handleSignOut}
            />
          )}

          {/* Blueprint Explorer */}
          {activeTab === 'blueprint' && <BlueprintExplorer />}

          {/* Admin Console View */}
          {activeTab === 'admin' && <AdminConsoleView user={user} onSignOut={handleSignOut} />}

        </main>

      </div>

      {/* Import Modal */}
      <ImportCourseModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportCourse={handleImportCourse}
      />

    </div>
  );
}
