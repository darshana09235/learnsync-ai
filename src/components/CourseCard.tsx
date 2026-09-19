import React from 'react';
import { PlayCircle, CheckCircle2, Video } from 'lucide-react';
import { CoursePlaylist } from '../types';

interface CourseCardProps {
  course: CoursePlaylist;
  onSelectCourse: (course: CoursePlaylist) => void;
}

export const CourseCard: React.FC<CourseCardProps> = ({ course, onSelectCourse }) => {
  const isCompleted = course.completedVideos === course.totalVideos && course.totalVideos > 0;

  return (
    <div 
      onClick={() => onSelectCourse(course)}
      className="bg-white border border-[#E7E9F0] rounded-2xl overflow-hidden hover:border-[#4F46E5]/40 transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer flex flex-col group"
      id={`course-card-${course.id}`}
    >
      {/* Thumbnail Banner */}
      <div className="relative aspect-video w-full overflow-hidden bg-[#0F172A]">
        <img
          src={course.thumbnailUrl}
          alt={course.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

        {/* Category Badge */}
        <span className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-black/70 backdrop-blur-xs text-[11px] font-semibold text-white uppercase tracking-wider">
          {course.category}
        </span>

        {/* Video Count Badge */}
        <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-md bg-black/70 backdrop-blur-xs text-[11px] font-medium text-white/90 flex items-center gap-1.5">
          <Video className="w-3.5 h-3.5 text-white/80" />
          <span>{course.totalVideos} lessons</span>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-1.5">
          <span className="text-[11px] font-semibold uppercase text-[#94A3B8] tracking-wider block">
            {course.authorName}
          </span>
          <h3 className="font-bold text-base text-[#0F172A] line-clamp-2 group-hover:text-[#4F46E5] transition-colors leading-snug">
            {course.title}
          </h3>
          <p className="text-xs text-[#64748B] line-clamp-2 leading-relaxed">
            {course.description}
          </p>
        </div>

        <div className="pt-3 border-t border-[#E7E9F0] space-y-2.5">
          {/* Progress Row Header */}
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-[#64748B]">{course.completedVideos}/{course.totalVideos} done</span>
            <span className="text-[#4F46E5] font-bold">{course.progressPercent}%</span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-1.5 bg-[#DCDCF7] rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                isCompleted ? 'bg-[#059669]' : 'bg-[#4F46E5]'
              }`}
              style={{ width: `${course.progressPercent}%` }}
            />
          </div>

          {/* Bottom Action Footer */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-[#64748B]">
              {isCompleted ? (
                <span className="text-[#059669] font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Completed
                </span>
              ) : (
                <span className="text-[#64748B]">Active Track</span>
              )}
            </span>

            <span className="font-semibold text-xs text-[#4F46E5] group-hover:underline flex items-center gap-1">
              <span>{course.progressPercent > 0 ? 'Resume' : 'Start'}</span>
              <PlayCircle className="w-4 h-4 text-[#4F46E5]" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
