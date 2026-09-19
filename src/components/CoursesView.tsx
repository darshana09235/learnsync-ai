import React, { useState } from 'react';
import { CoursePlaylist } from '../types';
import { CourseCard } from './CourseCard';
import { Search, Plus, BookOpen } from 'lucide-react';

interface CoursesViewProps {
  courses: CoursePlaylist[];
  onSelectCourse: (course: CoursePlaylist) => void;
  onOpenImportModal: () => void;
}

export const CoursesView: React.FC<CoursesViewProps> = ({
  courses,
  onSelectCourse,
  onOpenImportModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('All');

  const filterCategories = ['All', 'Computer Science', 'Web Development', 'Systems'];

  const filteredCourses = courses.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase());
    if (selectedFilter === 'All') return matchesSearch;
    return (
      matchesSearch &&
      (c.title.toLowerCase().includes(selectedFilter.toLowerCase()) ||
        c.description.toLowerCase().includes(selectedFilter.toLowerCase()))
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 font-sans">
      
      {/* Header Section */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E7E9F0] pb-5">
        <div>
          <span className="text-xs font-semibold text-[#4F46E5] uppercase tracking-wider block">
            LEARNING TRACKS LIBRARY
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0F172A] tracking-tight mt-0.5">
            Courses
          </h1>
          <p className="text-sm text-[#64748B] mt-1">
            Import YouTube playlists or select an active track to launch the learning workspace.
          </p>
        </div>

        <button
          onClick={onOpenImportModal}
          className="px-4 py-2.5 rounded-lg bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-2"
          id="btn-courses-import"
        >
          <Plus className="w-4 h-4" />
          <span>Import Playlist</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-[#E7E9F0] shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-[#94A3B8]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search courses by title or topic..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-[#E7E9F0] rounded-lg text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] transition-colors"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {filterCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                selectedFilter === cat
                  ? 'bg-[#4F46E5] text-white shadow-sm'
                  : 'bg-white text-[#64748B] hover:text-[#0F172A] border border-[#E7E9F0]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Course Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.map((course) => (
          <CourseCard
            key={course.id}
            course={course}
            onSelectCourse={onSelectCourse}
          />
        ))}

        {filteredCourses.length === 0 && (
          <div className="col-span-full p-12 text-center bg-white border border-[#E7E9F0] rounded-2xl space-y-3 shadow-sm">
            <BookOpen className="w-10 h-10 text-[#94A3B8] mx-auto" />
            <h3 className="text-base font-bold text-[#0F172A]">No courses match your search</h3>
            <p className="text-xs text-[#64748B]">Try adjusting your search terms or import a new YouTube playlist.</p>
          </div>
        )}
      </div>
    </div>
  );
};
