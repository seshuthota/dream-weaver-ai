'use client';

import { Download, ChevronDown, ChevronUp } from 'lucide-react';
import type { GenerationResult } from '@/types';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface ImageGalleryProps {
  result: GenerationResult | null;
}

export function ImageGallery({ result }: ImageGalleryProps) {
  const [showCharacters, setShowCharacters] = useState(true);
  const [showScript, setShowScript] = useState(false);

  if (!result) return null;

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

  return (
    <div className="space-y-6">
      {/* Header with Download All */}
      <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-sm rounded-2xl p-6 border border-green-500/30">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">
              ✨ Your Anime is Ready!
            </h2>
            <p className="text-gray-300">
              {result.metadata.passed_verification} of {result.metadata.total_scenes} scenes generated successfully
            </p>
          </div>
          <button
            onClick={downloadAll}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-colors"
          >
            <Download className="w-5 h-5" />
            Download All
          </button>
        </div>
      </div>

      {/* Characters Section (Collapsible) */}
      {result.characters && Object.keys(result.characters).length > 0 && (
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
          <button
            onClick={() => setShowCharacters(!showCharacters)}
            className="w-full p-6 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
          >
            <h3 className="text-lg font-semibold text-white">👥 Characters</h3>
            {showCharacters ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {showCharacters && (
            <div className="px-6 pb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(result.characters).map(([name, profile]) => (
                  <div
                    key={name}
                    className="bg-black/20 border border-white/10 rounded-xl p-4"
                  >
                    <h4 className="font-semibold text-purple-400 mb-2">{profile.name}</h4>
                    <div className="text-sm text-gray-300 space-y-1">
                      <p><span className="text-gray-500">Appearance:</span> {profile.appearance}</p>
                      <p><span className="text-gray-500">Personality:</span> {profile.personality}</p>
                      {profile.color_palette && profile.color_palette.length > 0 && (
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-gray-500">Colors:</span>
                          <div className="flex gap-1">
                            {profile.color_palette.map((color, i) => (
                              <div
                                key={i}
                                className="w-6 h-6 rounded-full border-2 border-white/20"
                                style={{ backgroundColor: color }}
                                title={color}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Images Gallery */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {result.scenes.map((scene, index) => {
          const passed = scene.verification?.passed ?? false;
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
              className={cn(
                "bg-white/5 backdrop-blur-sm rounded-2xl overflow-hidden border transition-all hover:scale-[1.02] cursor-pointer",
                passed ? "border-green-500/30" : "border-yellow-500/30"
              )}
              onClick={() => scene.image_url && downloadImage(scene.image_url, scene.scene_id)}
            >
              {/* Image */}
              <div className="relative aspect-square bg-black/20">
                {scene.image_url ? (
                  <img
                    src={scene.image_url}
                    alt={`Scene ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-red-400">
                    Failed to generate
                  </div>
                )}

                {/* Score Badge */}
                {scene.verification && (
                  <div className={cn(
                    "absolute top-3 right-3 px-3 py-1.5 rounded-full backdrop-blur-sm font-medium text-sm",
                    passed
                      ? "bg-green-500/90 text-white"
                      : "bg-yellow-500/90 text-black"
                  )}>
                    {(score * 100).toFixed(0)}%
                  </div>
                )}

                {/* Scene Number */}
                <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-full bg-black/70 backdrop-blur-sm text-white text-sm font-medium">
                  Scene {index + 1}
                </div>
              </div>

              {/* Info - Only show if there are issues */}
              {scene.verification?.issues && scene.verification.issues.length > 0 && (
                <div className="p-4">
                  <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                    <div className="text-xs text-yellow-300 font-medium mb-1">
                      Issues:
                    </div>
                    <ul className="text-xs text-yellow-200 space-y-0.5">
                      {scene.verification.issues.slice(0, 2).map((issue, i) => (
                        <li key={i}>• {issue}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Script Section (Collapsible) */}
      {result.script && (
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
          <button
            onClick={() => setShowScript(!showScript)}
            className="w-full p-6 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
          >
            <h3 className="text-lg font-semibold text-white">📜 Full Script</h3>
            {showScript ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {showScript && (
            <div className="px-6 pb-6">
              <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono bg-black/30 p-4 rounded-xl overflow-auto max-h-96">
                {result.script}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
