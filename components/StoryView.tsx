'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import type { GenerationResult } from '@/types';
import { cn } from '@/lib/utils';

interface StoryViewProps {
  result: GenerationResult;
}

export function StoryView({ result }: StoryViewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showCharacters, setShowCharacters] = useState(false);

  const scenes = result.scenes.filter(s => s.image_url);
  const currentScene = scenes[currentIndex];

  // Extract relevant script section for current scene
  const getScriptSection = (sceneIndex: number): string => {
    if (!result.script) return '';

    const lines = result.script.split('\n');
    const linesPerScene = Math.ceil(lines.length / scenes.length);
    const start = sceneIndex * linesPerScene;
    const end = Math.min(start + linesPerScene, lines.length);

    return lines.slice(start, end).join('\n').trim();
  };

  const scriptSection = getScriptSection(currentIndex);

  const goToNext = () => {
    if (currentIndex < scenes.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  if (!currentScene) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        No scenes available
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <BookOpen className="w-6 h-6 text-purple-400" />
          <div>
            <h3 className="text-white font-bold">Story Mode</h3>
            <p className="text-gray-400 text-sm">
              Scene {currentIndex + 1} of {scenes.length}
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowCharacters(!showCharacters)}
          className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
        >
          {showCharacters ? 'Hide' : 'Show'} Characters
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex gap-4 overflow-hidden">
        {/* Image Panel */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 relative bg-black/20 rounded-xl overflow-hidden">
            <img
              src={currentScene.image_url}
              alt={`Scene ${currentIndex + 1}`}
              className="w-full h-full object-contain"
            />

            {/* Scene Number */}
            <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-sm text-white font-bold px-3 py-2 rounded-lg">
              Scene {currentIndex + 1}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-4">
            <button
              onClick={goToPrevious}
              disabled={currentIndex === 0}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg transition-colors",
                currentIndex === 0
                  ? "bg-white/5 text-gray-600 cursor-not-allowed"
                  : "bg-white/10 hover:bg-white/20 text-white"
              )}
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>

            <div className="flex gap-2">
              {scenes.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all",
                    idx === currentIndex
                      ? "bg-purple-500 w-8"
                      : "bg-white/20 hover:bg-white/40"
                  )}
                />
              ))}
            </div>

            <button
              onClick={goToNext}
              disabled={currentIndex === scenes.length - 1}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg transition-colors",
                currentIndex === scenes.length - 1
                  ? "bg-white/5 text-gray-600 cursor-not-allowed"
                  : "bg-white/10 hover:bg-white/20 text-white"
              )}
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Script Panel */}
        <div className="w-96 flex flex-col bg-white/5 backdrop-blur-sm rounded-xl p-6 overflow-hidden">
          <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
            <span className="text-purple-400">📜</span>
            Script
          </h4>

          <div className="flex-1 overflow-y-auto text-gray-300 text-sm leading-relaxed whitespace-pre-wrap font-mono">
            {scriptSection || 'No script available for this scene.'}
          </div>

          {/* Verification Info */}
          {currentScene.verification && (
            <div className="mt-4 pt-4 border-t border-white/10">
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="text-center">
                  <div className="text-gray-500 mb-1">Character</div>
                  <div className={cn(
                    "font-bold",
                    currentScene.verification.character_consistency_score >= 0.7
                      ? "text-green-400"
                      : "text-yellow-400"
                  )}>
                    {(currentScene.verification.character_consistency_score * 100).toFixed(0)}%
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-gray-500 mb-1">Accuracy</div>
                  <div className={cn(
                    "font-bold",
                    currentScene.verification.scene_accuracy_score >= 0.7
                      ? "text-green-400"
                      : "text-yellow-400"
                  )}>
                    {(currentScene.verification.scene_accuracy_score * 100).toFixed(0)}%
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-gray-500 mb-1">Quality</div>
                  <div className={cn(
                    "font-bold",
                    currentScene.verification.quality_score >= 0.7
                      ? "text-green-400"
                      : "text-yellow-400"
                  )}>
                    {(currentScene.verification.quality_score * 100).toFixed(0)}%
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Characters Sidebar (Collapsible) */}
        {showCharacters && result.characters && Object.keys(result.characters).length > 0 && (
          <div className="w-80 bg-white/5 backdrop-blur-sm rounded-xl p-6 overflow-y-auto">
            <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
              <span className="text-purple-400">👥</span>
              Characters
            </h4>

            <div className="space-y-4">
              {Object.entries(result.characters).map(([name, profile]) => (
                <div
                  key={name}
                  className="bg-black/20 border border-white/10 rounded-lg p-3"
                >
                  <h5 className="font-semibold text-purple-400 mb-2">{profile.name}</h5>
                  <div className="text-xs text-gray-300 space-y-1">
                    <p><span className="text-gray-500">Look:</span> {profile.appearance}</p>
                    <p><span className="text-gray-500">Style:</span> {profile.personality}</p>
                    {profile.color_palette && profile.color_palette.length > 0 && (
                      <div className="flex items-center gap-1 mt-2">
                        {profile.color_palette.map((color, i) => (
                          <div
                            key={i}
                            className="w-5 h-5 rounded-full border border-white/20"
                            style={{ backgroundColor: color }}
                            title={color}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
