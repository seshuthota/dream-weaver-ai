'use client';

import { useState, useRef, useEffect } from 'react';
import { Sparkles, Clock } from 'lucide-react';
import { StoryForm } from '@/components/StoryForm';
import { ProgressStream } from '@/components/ProgressStream';
import { AnimeViewer } from '@/components/AnimeViewer';
import { HistoryPanel } from '@/components/HistoryPanel';
import { ApiKeyInput } from '@/components/ApiKeyInput';
import type { AnimeInput, GenerationResult, GenerationProgress, HistoryEntry } from '@/types';
import { saveToHistory, getHistoryCount } from '@/lib/history';
import { clientApiKey } from '@/lib/apiKeyManager';

export default function Home() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<GenerationProgress | null>(null);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [currentInput, setCurrentInput] = useState<AnimeInput | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyCount, setHistoryCount] = useState(0);
  const progressRef = useRef<GenerationProgress | null>(null);

  useEffect(() => {
    // Update history count on mount and when result changes
    setHistoryCount(getHistoryCount());
  }, [result]);

  const handleGenerate = async (input: AnimeInput) => {
    setIsGenerating(true);
    setProgress(null);
    setResult(null);
    setCurrentInput(input);
    progressRef.current = null;

    try {
      const apiKey = clientApiKey.get();
      if (!apiKey) {
        throw new Error('Please provide your OpenRouter API key');
      }

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        throw new Error('Generation failed');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data: GenerationProgress = JSON.parse(line.slice(6));
              progressRef.current = data;
              setProgress(data);

              // If complete, set the final result and save to history
              if (data.stage === 'complete' && data.data) {
                const generationResult = data.data as GenerationResult;
                setResult(generationResult);

                // Save to history
                if (currentInput) {
                  saveToHistory(currentInput, generationResult);
                  setHistoryCount(getHistoryCount());
                }
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('Generation error:', error);
      setProgress({
        stage: 'error',
        progress: 0,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleViewHistory = (entry: HistoryEntry) => {
    setResult(entry.result);
    setIsHistoryOpen(false);
  };

  const handleEditHistory = (entry: HistoryEntry) => {
    // This will be handled by StoryForm - we need to add a way to set input
    setCurrentInput(entry.input);
    setIsHistoryOpen(false);
    // Note: StoryForm needs to accept input prop to pre-fill
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-purple-900/20 via-pink-900/20 to-blue-900/20">
      {/* Compact Header */}
      <header className="border-b border-white/10 bg-black/30 backdrop-blur-sm flex-shrink-0">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-purple-400" />
            <h1 className="text-2xl font-bold text-white">Anime Maker</h1>
          </div>
          <button
            onClick={() => setIsHistoryOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors group"
          >
            <Clock className="w-5 h-5 text-purple-400" />
            <span className="text-white font-medium">History</span>
            {historyCount > 0 && (
              <span className="bg-purple-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {historyCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Main Split Layout */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Form */}
        <div className="w-96 border-r border-white/10 bg-black/20 backdrop-blur-sm overflow-y-auto flex-shrink-0">
          <div className="p-6">
            <ApiKeyInput />
            <StoryForm
              onSubmit={handleGenerate}
              isGenerating={isGenerating}
              initialInput={currentInput}
            />
          </div>
        </div>

        {/* Right Panel - Viewer */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full p-6">
            {(isGenerating || progress) && !result ? (
              <ProgressStream isGenerating={isGenerating} progress={progress} />
            ) : (
              <AnimeViewer result={result} />
            )}
          </div>
        </div>
      </main>

      {/* History Panel */}
      <HistoryPanel
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onView={handleViewHistory}
        onEdit={handleEditHistory}
      />
    </div>
  );
}
