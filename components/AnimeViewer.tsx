'use client';

import { useState, useEffect } from 'react';
import { Play, Grid3x3, BookOpen, Newspaper, Download } from 'lucide-react';
import type { GenerationResult } from '@/types';
import { cn } from '@/lib/utils';
import { SlideshowView } from './SlideshowView';
import { ComicBookView } from './ComicBookView';
import { GridView } from './GridView';
import { StoryView } from './StoryView';

interface AnimeViewerProps {
  result: GenerationResult | null;
}

type ViewMode = 'slideshow' | 'comic' | 'grid' | 'story';

export function AnimeViewer({ result }: AnimeViewerProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('slideshow');

  // Load saved preference
  useEffect(() => {
    const saved = localStorage.getItem('anime-viewer-mode');
    if (saved && ['slideshow', 'comic', 'grid', 'story'].includes(saved)) {
      setViewMode(saved as ViewMode);
    }
  }, []);

  // Save preference
  useEffect(() => {
    localStorage.setItem('anime-viewer-mode', viewMode);
  }, [viewMode]);

  if (!result) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Play className="w-8 h-8 text-purple-400" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">
            Ready to Create
          </h3>
          <p className="text-gray-400 text-sm">
            Fill in the form and click Generate to start
          </p>
        </div>
      </div>
    );
  }

  const downloadImage = async (imageUrl: string, sceneId: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${sceneId}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const downloadAll = () => {
    result.scenes.forEach((scene, index) => {
      if (scene.image_url) {
        setTimeout(() => downloadImage(scene.image_url, scene.scene_id), index * 200);
      }
    });
  };

  const modes = [
    { id: 'slideshow', label: 'Slideshow', icon: Play },
    { id: 'comic', label: 'Comic', icon: Newspaper },
    { id: 'grid', label: 'Grid', icon: Grid3x3 },
    { id: 'story', label: 'Story', icon: BookOpen },
  ] as const;

  return (
    <div className="h-full flex flex-col">
      {/* Header with Mode Switcher */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/10">
        <div className="flex gap-2">
          {modes.map((mode) => {
            const Icon = mode.icon;
            return (
              <button
                key={mode.id}
                onClick={() => setViewMode(mode.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg transition-all font-medium text-sm",
                  viewMode === mode.id
                    ? "bg-purple-600 text-white shadow-lg shadow-purple-500/30"
                    : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                )}
              >
                <Icon className="w-4 h-4" />
                {mode.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-400">
            {result.metadata.passed_verification} / {result.metadata.total_scenes} scenes
          </div>
          <button
            onClick={downloadAll}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium"
          >
            <Download className="w-4 h-4" />
            Download All
          </button>
        </div>
      </div>

      {/* View Content */}
      <div className="flex-1 overflow-hidden">
        {viewMode === 'slideshow' && <SlideshowView result={result} />}
        {viewMode === 'comic' && <ComicBookView result={result} />}
        {viewMode === 'grid' && <GridView result={result} />}
        {viewMode === 'story' && <StoryView result={result} />}
      </div>
    </div>
  );
}
