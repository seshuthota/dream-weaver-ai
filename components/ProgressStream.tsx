'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, Circle, Loader2, AlertCircle } from 'lucide-react';
import type { GenerationProgress } from '@/types';
import { cn, formatTime } from '@/lib/utils';

interface ProgressStreamProps {
  isGenerating: boolean;
  progress: GenerationProgress | null;
}

export function ProgressStream({ isGenerating, progress }: ProgressStreamProps) {
  const [startTime, setStartTime] = useState<number>(0);
  const [elapsedTime, setElapsedTime] = useState<number>(0);

  useEffect(() => {
    if (isGenerating) {
      setStartTime(Date.now());
      const interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isGenerating, startTime]);

  if (!isGenerating && !progress) return null;

  const stages = [
    { id: 'story', label: 'Story Generation', icon: '📖' },
    { id: 'prompts', label: 'Prompt Engineering', icon: '✏️' },
    { id: 'image', label: 'Image Generation', icon: '🎨' },
    { id: 'verification', label: 'Quality Verification', icon: '🔍' },
  ];

  const getStageStatus = (stageId: string) => {
    if (!progress) return 'pending';
    if (progress.stage === 'error') return 'error';
    
    // Images complete or fully complete - show all stages as completed
    if (progress.stage === 'complete' || progress.stage === 'images_complete') {
      return 'completed';
    }

    const stageIndex = stages.findIndex(s => s.id === stageId);
    const currentIndex = stages.findIndex(s => s.id === progress.stage);

    if (currentIndex > stageIndex) return 'completed';
    if (currentIndex === stageIndex) return 'in-progress';
    return 'pending';
  };

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-white">
          {progress?.stage === 'complete' ? '🎉 Generation Complete!' : 
           progress?.stage === 'images_complete' ? '✅ Images Ready! (Quality check running...)' :
           '⚡ Generating Your Anime...'}
        </h3>
        {isGenerating && (
          <div className="text-sm text-gray-400">
            ⏱️ {formatTime(elapsedTime)}
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-400 mb-2">
          <span>{progress?.message || 'Starting...'}</span>
          <span>{progress?.progress || 0}%</span>
        </div>
        <div className="h-3 bg-black/30 rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full transition-all duration-500 ease-out rounded-full",
              progress?.stage === 'error'
                ? "bg-red-500"
                : "bg-gradient-to-r from-purple-500 to-pink-500"
            )}
            style={{ width: `${progress?.progress || 0}%` }}
          />
        </div>
      </div>

      {/* Scene Progress */}
      {progress?.currentScene && progress?.totalScenes && (
        <div className="mb-6 p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl">
          <div className="text-sm text-purple-300 mb-2">
            Processing Scene {progress.currentScene} of {progress.totalScenes}
          </div>
          <div className="flex gap-2">
            {Array.from({ length: progress.totalScenes }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-2 flex-1 rounded-full transition-all",
                  i < progress.currentScene!
                    ? "bg-green-500"
                    : i === progress.currentScene! - 1
                    ? "bg-purple-500 animate-pulse"
                    : "bg-gray-700"
                )}
              />
            ))}
          </div>
        </div>
      )}

      {/* Stage Indicators */}
      <div className="space-y-3">
        {stages.map((stage) => {
          const status = getStageStatus(stage.id);

          return (
            <div
              key={stage.id}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg transition-all",
                status === 'in-progress' && "bg-purple-500/20 border border-purple-500/30",
                status === 'completed' && "bg-green-500/10",
                status === 'pending' && "bg-black/20"
              )}
            >
              <div className="flex-shrink-0">
                {status === 'completed' && (
                  <CheckCircle2 className="w-6 h-6 text-green-500" />
                )}
                {status === 'in-progress' && (
                  <Loader2 className="w-6 h-6 text-purple-500 animate-spin" />
                )}
                {status === 'pending' && (
                  <Circle className="w-6 h-6 text-gray-600" />
                )}
                {status === 'error' && (
                  <AlertCircle className="w-6 h-6 text-red-500" />
                )}
              </div>

              <div className="flex-1">
                <div className={cn(
                  "font-medium",
                  status === 'completed' && "text-green-400",
                  status === 'in-progress' && "text-purple-400",
                  status === 'pending' && "text-gray-500",
                  status === 'error' && "text-red-400"
                )}>
                  {stage.icon} {stage.label}
                </div>
              </div>

              <div className="text-sm text-gray-400">
                {status === 'completed' && '✓ Done'}
                {status === 'in-progress' && 'In progress...'}
                {status === 'pending' && 'Waiting...'}
              </div>
            </div>
          );
        })}
      </div>

      {/* Error Message */}
      {progress?.stage === 'error' && (
        <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-medium text-red-400 mb-1">Generation Failed</div>
              <div className="text-sm text-red-300">{progress.message}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}