'use client';

import type { GenerationResult } from '@/types';
import { cn } from '@/lib/utils';

interface ComicBookViewProps {
  result: GenerationResult;
}

export function ComicBookView({ result }: ComicBookViewProps) {
  const scenes = result.scenes.filter(s => s.image_url);

  // Extract dialogue from script if available
  const getSceneDialogue = (sceneIndex: number): string[] => {
    if (!result.script) return [];

    // Simple heuristic: extract dialogue lines (lines with quotes or character names followed by colon)
    const lines = result.script.split('\n');
    const dialoguePattern = /^[A-Z][a-zA-Z\s]+:\s*(.+)$/;
    const quotePattern = /"([^"]+)"/g;

    const dialogue: string[] = [];
    lines.forEach(line => {
      const match = line.match(dialoguePattern);
      if (match) {
        dialogue.push(match[1]);
      } else {
        const quotes = Array.from(line.matchAll(quotePattern));
        quotes.forEach(q => dialogue.push(q[1]));
      }
    });

    // Return a subset for this scene
    const perScene = Math.ceil(dialogue.length / scenes.length);
    return dialogue.slice(sceneIndex * perScene, (sceneIndex + 1) * perScene);
  };

  return (
    <div className="h-full overflow-y-auto px-4 py-6" style={{
      background: 'linear-gradient(to bottom, #1a1a1a 0%, #0a0a0a 100%)',
    }}>
      <div className="max-w-4xl mx-auto space-y-6">
        {scenes.map((scene, index) => {
          const dialogue = getSceneDialogue(index);
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
              className="relative"
              style={{
                marginBottom: index < scenes.length - 1 ? '2rem' : '0',
              }}
            >
              {/* Comic Panel */}
              <div className={cn(
                "relative border-4 shadow-2xl",
                "transform hover:scale-[1.02] transition-transform"
              )}
              style={{
                borderColor: '#000',
                backgroundColor: '#fff',
                padding: '8px',
                boxShadow: '8px 8px 0px rgba(0,0,0,0.8), 12px 12px 0px rgba(0,0,0,0.4)'
              }}>
                {/* Panel Number */}
                <div className="absolute -top-4 -left-4 bg-red-600 text-white font-black px-4 py-2 rounded-full border-4 border-black z-10 text-lg"
                  style={{
                    fontFamily: 'Impact, Arial Black, sans-serif',
                    textShadow: '2px 2px 0px rgba(0,0,0,0.5)'
                  }}>
                  #{index + 1}
                </div>

                {/* Score Badge */}
                {scene.verification && (
                  <div className="absolute -top-4 -right-4 bg-yellow-400 text-black font-black px-4 py-2 rounded-full border-4 border-black z-10 text-sm"
                    style={{
                      fontFamily: 'Impact, Arial Black, sans-serif',
                      textShadow: '1px 1px 0px rgba(255,255,255,0.5)'
                    }}>
                    ⭐ {(score * 100).toFixed(0)}
                  </div>
                )}

                {/* Image */}
                <div className="relative border-2 border-black" style={{ backgroundColor: '#000' }}>
                  <img
                    src={scene.image_url}
                    alt={`Panel ${index + 1}`}
                    className="w-full h-auto"
                    style={{
                      maxHeight: '600px',
                      objectFit: 'contain',
                      imageRendering: 'crisp-edges'
                    }}
                  />

                  {/* Speech Bubbles Overlay */}
                  {dialogue.length > 0 && (
                    <div className="absolute bottom-4 left-4 right-4 flex flex-col gap-2">
                      {dialogue.slice(0, 2).map((line, idx) => (
                        <div
                          key={idx}
                          className="bg-white border-3 border-black rounded-2xl px-4 py-3 shadow-lg relative"
                          style={{
                            maxWidth: '80%',
                            alignSelf: idx % 2 === 0 ? 'flex-start' : 'flex-end',
                          }}
                        >
                          {/* Speech bubble tail */}
                          <div
                            className="absolute -bottom-3 bg-white border-black"
                            style={{
                              width: '20px',
                              height: '20px',
                              clipPath: 'polygon(50% 100%, 0 0, 100% 0)',
                              left: idx % 2 === 0 ? '20px' : 'auto',
                              right: idx % 2 === 1 ? '20px' : 'auto',
                              borderLeft: idx % 2 === 0 ? '2px solid black' : 'none',
                              borderRight: idx % 2 === 1 ? '2px solid black' : 'none',
                            }}
                          />
                          <p className="text-black font-medium text-sm leading-tight">
                            {line}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Narrative Box (if no dialogue or additional text) */}
                {dialogue.length === 0 && scene.verification?.suggestions && (
                  <div className="mt-2 bg-yellow-100 border-3 border-black p-3 shadow-md"
                    style={{
                      borderWidth: '3px',
                      fontFamily: 'Arial, sans-serif'
                    }}>
                    <p className="text-black text-sm font-bold italic leading-tight">
                      {scene.verification.suggestions}
                    </p>
                  </div>
                )}
              </div>

              {/* Panel Gutter (space between panels) */}
              {index < scenes.length - 1 && (
                <div className="h-8 relative">
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white/20 text-xs">
                    • • •
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* End Page */}
        <div className="text-center py-12">
          <div className="inline-block bg-black text-white font-black px-12 py-6 border-4 border-white rounded-lg text-3xl relative"
            style={{
              fontFamily: 'Impact, Arial Black, sans-serif',
              textShadow: '3px 3px 0px rgba(255,255,255,0.3)',
              boxShadow: '0 8px 0 rgba(0,0,0,0.5)'
            }}>
            THE END
            <div className="absolute -top-2 -right-2 bg-red-600 text-white text-xs px-2 py-1 rounded-full border-2 border-white">
              {scenes.length} PANELS
            </div>
          </div>
          <p className="text-gray-400 mt-6 text-sm font-bold tracking-wider">
            🎨 CREATED WITH ANIME MAKER
          </p>
        </div>
      </div>
    </div>
  );
}
