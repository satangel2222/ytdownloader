import React from 'react';
import { VideoMetadata } from '../types';
import { Sparkles, Tag, PlayCircle } from 'lucide-react';

interface VideoCardProps {
  data: VideoMetadata;
}

export const VideoCard: React.FC<VideoCardProps> = ({ data }) => {
  return (
    <div className="w-full bg-slate-900/50 border border-slate-800 rounded-xl p-4 md:p-6 animate-fade-in-up">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Thumbnail */}
        <div className="relative shrink-0 w-full md:w-64 aspect-video rounded-lg overflow-hidden shadow-lg group">
          <img 
            src={data.thumbnailUrl} 
            alt="Thumbnail" 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <PlayCircle className="w-12 h-12 text-white drop-shadow-lg" />
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 space-y-4">
          <div>
            <h2 className="text-lg md:text-xl font-bold text-white leading-tight mb-2">
              {data.title || 'Loading title...'}
            </h2>
            <p className="text-slate-400 text-sm line-clamp-2">
              {data.description}
            </p>
          </div>

          {/* AI Insight */}
          {data.aiSummary && (
            <div className="bg-brand-900/20 border border-brand-500/20 rounded-lg p-3 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-2 opacity-10">
                <Sparkles className="w-12 h-12 text-brand-500" />
              </div>
              <div className="flex items-start gap-2 relative z-10">
                <Sparkles className="w-4 h-4 text-brand-400 mt-0.5 shrink-0" />
                <p className="text-sm text-brand-100/90">
                  <span className="font-semibold text-brand-400">AI Insight:</span> {data.aiSummary}
                </p>
              </div>
            </div>
          )}

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {data.tags?.map((tag, i) => (
              <span key={i} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
                <Tag className="w-3 h-3" />
                #{tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};