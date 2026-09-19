import React, { useState } from 'react';
import { NoteEntry, CoursePlaylist } from '../types';
import { Search, Clock, Trash2, FileText, ExternalLink, Bookmark } from 'lucide-react';

interface NotesHubViewProps {
  notes: NoteEntry[];
  courses: CoursePlaylist[];
  onOpenWorkspace: (course: CoursePlaylist) => void;
  onDeleteNote?: (noteId: string) => void;
}

export const NotesHubView: React.FC<NotesHubViewProps> = ({
  notes,
  courses,
  onOpenWorkspace,
  onDeleteNote,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('All');

  const allTags = Array.from(new Set(notes.flatMap((n) => n.tags || [])));

  const filteredNotes = notes.filter((note) => {
    const matchesSearch =
      note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.videoTitle.toLowerCase().includes(searchQuery.toLowerCase());
    if (selectedTag === 'All') return matchesSearch;
    return matchesSearch && note.tags?.includes(selectedTag);
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 font-sans">
      
      {/* Header Section */}
      <div className="border-b border-[#E7E9F0] pb-5">
        <span className="text-xs font-semibold text-[#4F46E5] uppercase tracking-wider block">
          ACTIVE RECALL VAULT
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#0F172A] tracking-tight mt-0.5">
          Notes Hub
        </h1>
        <p className="text-sm text-[#64748B] mt-1">
          Timestamp-anchored study notes automatically linked to video lessons across all active courses.
        </p>
      </div>

      {/* Search & Tag Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-[#E7E9F0] shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-[#94A3B8]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes or video title..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-[#E7E9F0] rounded-lg text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] transition-colors"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedTag('All')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              selectedTag === 'All'
                ? 'bg-[#4F46E5] text-white shadow-sm'
                : 'bg-white text-[#64748B] hover:text-[#0F172A] border border-[#E7E9F0]'
            }`}
          >
            All Notes ({notes.length})
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                selectedTag === tag
                  ? 'bg-[#4F46E5] text-white shadow-sm'
                  : 'bg-white text-[#64748B] hover:text-[#0F172A] border border-[#E7E9F0]'
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>
      </div>

      {/* Notes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredNotes.map((note) => {
          const matchedCourse = courses.find((c) => c.id === note.courseId) || courses[0];

          return (
            <div
              key={note.id}
              className="bg-white border border-[#E7E9F0] rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-sm hover:shadow-md transition-all group"
            >
              <div className="space-y-3">
                {/* Top Row: Timestamp Chip & Trash Icon */}
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-md bg-[#EEF0FE] text-[#4F46E5] text-xs font-bold flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#4F46E5]" />
                    <span>[{note.timestampFormatted}]</span>
                  </span>

                  {onDeleteNote && (
                    <button
                      onClick={() => onDeleteNote(note.id)}
                      className="text-[#94A3B8] hover:text-[#DC2626] transition-colors p-1"
                      title="Delete note"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Content */}
                <p className="text-sm text-[#0F172A] leading-relaxed font-normal">
                  "{note.content}"
                </p>
              </div>

              {/* Card Footer: Video Title, Course Link & Tags */}
              <div className="pt-3 border-t border-[#E7E9F0] space-y-2">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="text-[#64748B] font-medium truncate">
                    {note.videoTitle}
                  </span>
                  {matchedCourse && (
                    <button
                      onClick={() => onOpenWorkspace(matchedCourse)}
                      className="text-[#4F46E5] hover:underline font-semibold text-xs shrink-0 flex items-center gap-1"
                    >
                      <span>Jump</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {note.tags && note.tags.length > 0 && (
                  <div className="flex flex-wrap items-center justify-end gap-1">
                    {note.tags.map((t) => (
                      <span
                        key={t}
                        className="px-2 py-0.5 rounded-full bg-[#F8FAFC] text-[#64748B] border border-[#E7E9F0] text-[11px] font-medium"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {filteredNotes.length === 0 && (
          <div className="col-span-full p-12 text-center bg-white border border-[#E7E9F0] rounded-2xl space-y-3 shadow-sm">
            <Bookmark className="w-10 h-10 text-[#94A3B8] mx-auto" />
            <h3 className="text-base font-bold text-[#0F172A]">No active recall notes found</h3>
            <p className="text-xs text-[#64748B]">Add timestamped notes while watching video lessons in the workspace.</p>
          </div>
        )}
      </div>
    </div>
  );
};
