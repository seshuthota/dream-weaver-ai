'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Play, Pause, RefreshCw } from 'lucide-react';
import type { GenerationResult } from '@/types';
import { cn } from '@/lib/utils';

interface SlideshowViewProps {
  result: GenerationResult;
  onRegenerateScene?: (sceneId: string, modifications?: string) => Promise<void>;
}

export function SlideshowView({ result, onRegenerateScene }: SlideshowViewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const scenes = result.scenes.filter(s => s.image_url);
  const currentScene = scenes[currentIndex];

  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goToPrevious();
      if (e.key === 'ArrowRight') goToNext();
      if (e.key === ' ') {
        e.preventDefault();
        setIsPlaying(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, [currentIndex, scenes.length]);

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % scenes.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [isPlaying, scenes.length]);

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % scenes.length);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + scenes.length) % scenes.length);
  };

  if (!currentScene) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        No scenes available
      </div>
    );
  }

  const score = currentScene.verification
    ? (
        currentScene.verification.character_consistency_score +
        currentScene.verification.scene_accuracy_score +
        currentScene.verification.quality_score
      ) / 3
    : 0;

  return (
    <div className="h-full flex flex-col">
      {/* Image Container */}
      <div className="flex-1 relative bg-black/20 rounded-xl overflow-hidden">
        <img
          src={currentScene.image_url}
          alt={`Scene ${currentIndex + 1}`}
          className="w-full h-full object-contain"
        />

        {/* Navigation Arrows */}
        <button
          onClick={goToPrevious}
          className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-black/90 backdrop-blur-sm p-3 rounded-full transition-all"
        >
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>

        <button
          onClick={goToNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-black/90 backdrop-blur-sm p-3 rounded-full transition-all"
        >
          <ChevronRight className="w-6 h-6 text-white" />
        </button>

        {/* Score Badge */}
        {currentScene.verification && (
          <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-black/70 backdrop-blur-sm text-white text-sm font-medium">
            ⭐ {(score * 100).toFixed(0)}%
          </div>
        )}

        {/* Scene Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-6 pt-12">
          <div className="max-w-4xl">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-purple-400 font-semibold text-lg">
                Scene {currentIndex + 1} of {scenes.length}
              </span>
              {currentScene.verification?.issues && currentScene.verification.issues.length > 0 && (
                <span className="text-yellow-400 text-sm">
                  ⚠️ {currentScene.verification.issues.length} issue{currentScene.verification.issues.length > 1 ? 's' : ''}
                </span>
              )}
            </div>
            <p className="text-white text-base leading-relaxed">
              {currentScene.description || 'AI-generated anime scene'}
            </p>
            {currentScene.dialogue && (
              <p className="text-purple-300 text-sm mt-2 italic">
                💬 {currentScene.dialogue}
              </p>
            )}
            {currentScene.setting && (
              <p className="text-gray-400 text-xs mt-1">
                📍 {currentScene.setting}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="mt-4 flex items-center justify-between gap-4">
        {/* Thumbnails */}
        <div className="flex-1 flex gap-2 overflow-x-auto">
          {scenes.map((scene, idx) => (
            <button
              key={scene.scene_id}
              onClick={() => setCurrentIndex(idx)}
              className={cn(
                "flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all",
                idx === currentIndex
                  ? "border-purple-500 scale-110"
                  : "border-white/20 hover:border-white/40 opacity-60 hover:opacity-100"
              )}
            >
              <img
                src={scene.image_url}
                alt={`Scene ${idx + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>

        {/* Regenerate Button */}
        {onRegenerateScene && (
          <button
            onClick={() => onRegenerateScene(currentScene.scene_id)}
            className="flex-shrink-0 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full transition-colors"
            title="Regenerate this scene"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        )}

        {/* Play/Pause */}
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="flex-shrink-0 bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-full transition-colors"
        >
          {isPlaying ? (
            <Pause className="w-5 h-5" fill="currentColor" />
          ) : (
            <Play className="w-5 h-5" fill="currentColor" />
          )}
        </button>
      </div>
    </div>
  );
}
