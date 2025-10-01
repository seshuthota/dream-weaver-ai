'use client';

import { Eye, Trash2, Edit3, Calendar, Image as ImageIcon } from 'lucide-react';
import type { HistoryEntry } from '@/types';
import { cn } from '@/lib/utils';

interface HistoryItemProps {
  entry: HistoryEntry;
  onView: (entry: HistoryEntry) => void;
  onEdit: (entry: HistoryEntry) => void;
  onDelete: (id: string) => void;
}

export function HistoryItem({ entry, onView, onEdit, onDelete }: HistoryItemProps) {
  const timeAgo = getTimeAgo(entry.timestamp);
  const sceneCount = entry.result.scenes.length;
  const passedCount = entry.result.metadata.passed_verification;

  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden hover:border-purple-500/50 transition-all group">
      {/* Thumbnail */}
      <div className="relative aspect-video bg-black/40 overflow-hidden">
        {entry.thumbnail ? (
          <img
            src={entry.thumbnail}
            alt={entry.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="w-12 h-12 text-gray-600" />
          </div>
        )}

        {/* Style Badge */}
        <div className="absolute top-2 right-2 px-2 py-1 bg-purple-600/90 backdrop-blur-sm text-white text-xs font-bold rounded-full">
          {entry.input.style}
        </div>

        {/* Scene Count Badge */}
        <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/80 backdrop-blur-sm text-white text-xs font-medium rounded-full flex items-center gap-1">
          <ImageIcon className="w-3 h-3" />
          {sceneCount}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title */}
        <h3 className="text-white font-semibold text-sm mb-2 line-clamp-2 leading-tight">
          {entry.title}
        </h3>

        {/* Meta Info */}
        <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {timeAgo}
          </div>
          <div className="flex items-center gap-1">
            <span className={cn(
              "font-medium",
              passedCount === sceneCount ? "text-green-400" : "text-yellow-400"
            )}>
              {passedCount}/{sceneCount} ✓
            </span>
          </div>
          {entry.input.comicMode && (
            <div className="text-amber-400 font-medium">💬 Comic</div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => onView(entry)}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium rounded-lg transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            View
          </button>
          <button
            onClick={() => onEdit(entry)}
            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-medium rounded-lg transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5" />
            Edit
          </button>
          <button
            onClick={() => onDelete(entry.id)}
            className="flex items-center justify-center px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-medium rounded-lg transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function getTimeAgo(timestamp: string): string {
  const now = new Date();
  const past = new Date(timestamp);
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;

  return past.toLocaleDateString();
}
