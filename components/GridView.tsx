'use client';

import { useState } from 'react';
import { X, Download, RefreshCw } from 'lucide-react';
import type { GenerationResult } from '@/types';
import { cn } from '@/lib/utils';

interface GridViewProps {
  result: GenerationResult;
  onRegenerateScene?: (sceneId: string, modifications?: string) => Promise<void>;
}

export function GridView({ result, onRegenerateScene }: GridViewProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const scenes = result.scenes.filter(s => s.image_url);

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

  const selectedScene = selectedIndex !== null ? scenes[selectedIndex] : null;
  const selectedScore = selectedScene?.verification
    ? (
        selectedScene.verification.character_consistency_score +
        selectedScene.verification.scene_accuracy_score +
        selectedScene.verification.quality_score
      ) / 3
    : 0;

  return (
    <div className="h-full flex flex-col">
      {/* Grid Container */}
      <div className="flex-1 overflow-y-auto px-2 py-2">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {scenes.map((scene, index) => {
            const score = scene.verification
              ? (
                  scene.verification.character_consistency_score +
                  scene.verification.scene_accuracy_score +
                  scene.verification.quality_score
                ) / 3
              : 0;

            return (
              <div
                key={scene.scene_id}
                onClick={() => setSelectedIndex(index)}
                className={cn(
                  "relative aspect-square rounded-xl overflow-hidden border-2 cursor-pointer transition-all group",
                  "hover:scale-105 hover:shadow-2xl",
                  scene.verification?.passed
                    ? "border-green-500/50 hover:border-green-500"
                    : "border-yellow-500/50 hover:border-yellow-500"
                )}
              >
                <img
                  src={scene.image_url}
                  alt={`Scene ${index + 1}`}
                  className="w-full h-full object-cover"
                />

                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white font-bold text-lg">
                        Scene {index + 1}
                      </span>
                      <span className="text-white text-sm">
                        ⭐ {(score * 100).toFixed(0)}%
                      </span>
                    </div>
                    {scene.description && (
                      <p className="text-white text-xs leading-tight line-clamp-2">
                        {scene.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Scene Number Badge */}
                <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm text-white font-bold px-2 py-1 rounded-lg text-sm">
                  {index + 1}
                </div>

                {/* Score Badge */}
                {scene.verification && (
                  <div className={cn(
                    "absolute top-2 right-2 px-2 py-1 rounded-lg text-xs font-bold",
                    scene.verification.passed
                      ? "bg-green-500/90 text-white"
                      : "bg-yellow-500/90 text-black"
                  )}>
                    {(score * 100).toFixed(0)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Lightbox Modal */}
      {selectedScene && selectedIndex !== null && (
        <div
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedIndex(null)}
        >
          <div
            className="relative max-w-5xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedIndex(null)}
              className="absolute -top-12 right-0 bg-white/10 hover:bg-white/20 backdrop-blur-sm p-2 rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>

            {/* Image */}
            <div className="bg-black rounded-xl overflow-hidden">
              <img
                src={selectedScene.image_url}
                alt={`Scene ${selectedIndex + 1}`}
                className="w-full h-auto max-h-[80vh] object-contain"
              />
            </div>

            {/* Info Bar */}
            <div className="mt-4 bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="text-white font-bold text-lg">
                    Scene {selectedIndex + 1} of {scenes.length}
                  </span>
                  <span className="text-purple-400 ml-3">
                    ⭐ {(selectedScore * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {onRegenerateScene && (
                    <button
                      onClick={() => onRegenerateScene(selectedScene.scene_id)}
                      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Regenerate
                    </button>
                  )}
                  <button
                    onClick={() => downloadImage(selectedScene.image_url, selectedScene.scene_id)}
                    className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                </div>
              </div>

              {/* Scene Description */}
              {selectedScene.description && (
                <div className="mt-3 p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                  <p className="text-white text-sm leading-relaxed">
                    {selectedScene.description}
                  </p>
                  {selectedScene.dialogue && (
                    <p className="text-purple-300 text-sm mt-2 italic">
                      💬 {selectedScene.dialogue}
                    </p>
                  )}
                  {selectedScene.setting && (
                    <p className="text-gray-400 text-xs mt-1">
                      📍 {selectedScene.setting}
                    </p>
                  )}
                </div>
              )}

              {/* Verification Details */}
              {selectedScene.verification && (
                <div className="grid grid-cols-3 gap-4 mt-3">
                  <div className="text-center">
                    <div className="text-gray-400 text-xs mb-1">Character</div>
                    <div className={cn(
                      "text-lg font-bold",
                      selectedScene.verification.character_consistency_score >= 0.7
                        ? "text-green-400"
                        : "text-yellow-400"
                    )}>
                      {(selectedScene.verification.character_consistency_score * 100).toFixed(0)}%
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-400 text-xs mb-1">Accuracy</div>
                    <div className={cn(
                      "text-lg font-bold",
                      selectedScene.verification.scene_accuracy_score >= 0.7
                        ? "text-green-400"
                        : "text-yellow-400"
                    )}>
                      {(selectedScene.verification.scene_accuracy_score * 100).toFixed(0)}%
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-400 text-xs mb-1">Quality</div>
                    <div className={cn(
                      "text-lg font-bold",
                      selectedScene.verification.quality_score >= 0.7
                        ? "text-green-400"
                        : "text-yellow-400"
                    )}>
                      {(selectedScene.verification.quality_score * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>
              )}

              {/* Issues */}
              {selectedScene.verification?.issues && selectedScene.verification.issues.length > 0 && (
                <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <div className="text-yellow-300 text-xs font-bold mb-1">Issues:</div>
                  <ul className="text-yellow-200 text-xs space-y-1">
                    {selectedScene.verification.issues.map((issue, i) => (
                      <li key={i}>• {issue}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-center gap-4 mt-4">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedIndex(prev => prev! > 0 ? prev! - 1 : scenes.length - 1);
                }}
                className="bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white px-6 py-2 rounded-lg transition-colors"
              >
                Previous
              </button>
              <span className="text-white/60 text-sm">
                {selectedIndex + 1} / {scenes.length}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedIndex(prev => (prev! + 1) % scenes.length);
                }}
                className="bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white px-6 py-2 rounded-lg transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
