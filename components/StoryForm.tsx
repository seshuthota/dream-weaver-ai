'use client';

import { useState, useEffect } from 'react';
import { Plus, X, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import type { AnimeInput, Character } from '@/types';
import { cn, estimateCost } from '@/lib/utils';
import { clientApiKey } from '@/lib/apiKeyManager';

interface StoryFormProps {
  onSubmit: (input: AnimeInput) => void;
  isGenerating: boolean;
  initialInput?: AnimeInput | null;
}

const ANIME_STYLES = [
  { value: 'shoujo', label: 'Shoujo' },
  { value: 'shounen', label: 'Shounen' },
  { value: 'seinen', label: 'Seinen' },
  { value: 'slice-of-life', label: 'Slice of Life' },
  { value: 'fantasy', label: 'Fantasy' },
  { value: 'sci-fi', label: 'Sci-Fi' },
];

export function StoryForm({ onSubmit, isGenerating, initialInput }: StoryFormProps) {
  const [outline, setOutline] = useState('');
  const [characters, setCharacters] = useState<Character[]>([
    { name: '', traits: '' },
  ]);
  const [style, setStyle] = useState('shoujo');
  const [scenesCount, setScenesCount] = useState(3);
  const [showCharacters, setShowCharacters] = useState(true);
  const [comicMode, setComicMode] = useState(false);
  const [isGeneratingIdea, setIsGeneratingIdea] = useState(false);
  const [showIdeaOptions, setShowIdeaOptions] = useState(false);
  const [ideaGenre, setIdeaGenre] = useState('fantasy');
  const [ideaTone, setIdeaTone] = useState('balanced');
  const [ideaComplexity, setIdeaComplexity] = useState('standard');

  // Load initial input when provided (from history)
  useEffect(() => {
    if (initialInput) {
      setOutline(initialInput.outline);
      setCharacters(initialInput.characters);
      setStyle(initialInput.style);
      setScenesCount(initialInput.scenes_per_episode);
      setComicMode(initialInput.comicMode || false);
    }
  }, [initialInput]);

  const addCharacter = () => {
    if (characters.length < 5) {
      setCharacters([...characters, { name: '', traits: '' }]);
    }
  };

  const removeCharacter = (index: number) => {
    if (characters.length > 1) {
      setCharacters(characters.filter((_, i) => i !== index));
    }
  };

  const updateCharacter = (index: number, field: keyof Character, value: string) => {
    const updated = [...characters];
    updated[index][field] = value;
    setCharacters(updated);
  };

  const generateRandomStory = async () => {
    setIsGeneratingIdea(true);
    try {
      const apiKey = clientApiKey.get();
      if (!apiKey) {
        alert('Please provide your OpenRouter API key first');
        setIsGeneratingIdea(false);
        return;
      }

      const response = await fetch('/api/generate-idea', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        body: JSON.stringify({
          genre: ideaGenre,
          tone: ideaTone,
          complexity: ideaComplexity,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate story idea');
      }

      const idea = await response.json();

      // Fill form with generated content
      setOutline(idea.outline);
      setCharacters(idea.characters || [{ name: '', traits: '' }]);
      setStyle(idea.style || 'shoujo');
      setScenesCount(idea.scenes || 3);
      setShowIdeaOptions(false); // Collapse options after generation
    } catch (error) {
      console.error('Story generation error:', error);
      alert('Failed to generate story idea. Please try again.');
    } finally {
      setIsGeneratingIdea(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const validCharacters = characters.filter(c => c.name.trim() && c.traits.trim());

    if (!outline.trim() || validCharacters.length === 0) {
      alert('Please provide a story outline and at least one character');
      return;
    }

    const input: AnimeInput = {
      outline: outline.trim(),
      characters: validCharacters,
      style,
      episodes: 1,
      scenes_per_episode: scenesCount,
      comicMode,
    };

    onSubmit(input);
  };

  const estimatedCost = estimateCost(scenesCount);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* AI Generate Story Section */}
      <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/30 rounded-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <button
            type="button"
            onClick={() => setShowIdeaOptions(!showIdeaOptions)}
            className="flex items-center gap-2 text-sm font-semibold text-white hover:text-indigo-400 transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            AI Story Generator
            {showIdeaOptions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {showIdeaOptions && (
          <div className="space-y-3 mb-3">
            {/* Genre Selection */}
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1.5">Genre</label>
              <div className="grid grid-cols-3 gap-2">
                {['Action', 'Romance', 'Fantasy', 'Slice of Life', 'Mystery', 'Comedy'].map((genre) => (
                  <button
                    key={genre}
                    type="button"
                    onClick={() => setIdeaGenre(genre.toLowerCase())}
                    disabled={isGeneratingIdea || isGenerating}
                    className={cn(
                      "px-2 py-1.5 rounded text-xs font-medium transition-all",
                      ideaGenre === genre.toLowerCase()
                        ? "bg-indigo-600 text-white"
                        : "bg-black/30 text-gray-300 hover:bg-black/50"
                    )}
                  >
                    {genre}
                  </button>
                ))}
              </div>
            </div>

            {/* Tone Selection */}
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1.5">Tone</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'light', label: '☀️ Light', desc: 'Fun & upbeat' },
                  { value: 'balanced', label: '⚖️ Balanced', desc: 'Mix of both' },
                  { value: 'dark', label: '🌙 Dark', desc: 'Serious & intense' }
                ].map((tone) => (
                  <button
                    key={tone.value}
                    type="button"
                    onClick={() => setIdeaTone(tone.value)}
                    disabled={isGeneratingIdea || isGenerating}
                    className={cn(
                      "px-2 py-2 rounded text-xs font-medium transition-all",
                      ideaTone === tone.value
                        ? "bg-purple-600 text-white"
                        : "bg-black/30 text-gray-300 hover:bg-black/50"
                    )}
                  >
                    <div>{tone.label}</div>
                    <div className="text-[10px] text-gray-400 mt-0.5">{tone.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Complexity Selection */}
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1.5">Complexity</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'simple', label: 'Simple', desc: '2-3 chars, 3-4 scenes' },
                  { value: 'standard', label: 'Standard', desc: '3-4 chars, 5-6 scenes' },
                  { value: 'epic', label: 'Epic', desc: '4-5 chars, 7-8 scenes' }
                ].map((complexity) => (
                  <button
                    key={complexity.value}
                    type="button"
                    onClick={() => {
                      setIdeaComplexity(complexity.value);
                      // Auto-sync scenes count with complexity
                      if (complexity.value === 'simple') setScenesCount(3);
                      if (complexity.value === 'standard') setScenesCount(5);
                      if (complexity.value === 'epic') setScenesCount(7);
                    }}
                    disabled={isGeneratingIdea || isGenerating}
                    className={cn(
                      "px-2 py-2 rounded text-xs font-medium transition-all",
                      ideaComplexity === complexity.value
                        ? "bg-pink-600 text-white"
                        : "bg-black/30 text-gray-300 hover:bg-black/50"
                    )}
                  >
                    <div>{complexity.label}</div>
                    <div className="text-[10px] text-gray-400 mt-0.5">{complexity.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={generateRandomStory}
          disabled={isGeneratingIdea || isGenerating}
          className={cn(
            "w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all",
            isGeneratingIdea || isGenerating
              ? "bg-gray-700 text-gray-500 cursor-not-allowed"
              : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg"
          )}
        >
          {isGeneratingIdea ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Generating Idea...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Generate Story Idea
            </>
          )}
        </button>
      </div>

      {/* Story Outline */}
      <div>
        <label className="block text-sm font-semibold mb-2 text-white">
          📖 Story Outline
        </label>
        <textarea
          value={outline}
          onChange={(e) => setOutline(e.target.value)}
          placeholder="A shy high school girl discovers ice magic powers..."
          className="w-full h-24 px-3 py-2 text-sm bg-black/30 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
          disabled={isGenerating}
        />
      </div>

      {/* Characters (Collapsible) */}
      <div>
        <button
          type="button"
          onClick={() => setShowCharacters(!showCharacters)}
          className="w-full flex items-center justify-between text-sm font-semibold mb-2 text-white hover:text-purple-400 transition-colors"
        >
          <span>👥 Characters ({characters.length}/5)</span>
          {showCharacters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showCharacters && (
          <div className="space-y-2">
            {characters.map((character, index) => (
              <div
                key={index}
                className="bg-black/30 rounded-lg p-3 border border-white/10 space-y-2"
              >
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={character.name}
                    onChange={(e) => updateCharacter(index, 'name', e.target.value)}
                    placeholder="Name"
                    className="flex-1 px-3 py-1.5 text-sm bg-black/40 border border-white/20 rounded text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    disabled={isGenerating}
                  />
                  {characters.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeCharacter(index)}
                      disabled={isGenerating}
                      className="p-1.5 text-red-400 hover:bg-red-500/10 rounded transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={character.traits}
                  onChange={(e) => updateCharacter(index, 'traits', e.target.value)}
                  placeholder="Traits (shy, kind, ice magic, blue hair)"
                  className="w-full px-3 py-1.5 text-sm bg-black/40 border border-white/20 rounded text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  disabled={isGenerating}
                />
              </div>
            ))}
            <button
              type="button"
              onClick={addCharacter}
              disabled={characters.length >= 5 || isGenerating}
              className={cn(
                "w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                characters.length >= 5 || isGenerating
                  ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                  : "bg-purple-600/80 hover:bg-purple-600 text-white"
              )}
            >
              <Plus className="w-4 h-4" />
              Add Character
            </button>
          </div>
        )}
      </div>

      {/* Style Selection */}
      <div>
        <label className="block text-sm font-semibold mb-2 text-white">
          🎨 Style
        </label>
        <div className="grid grid-cols-2 gap-2">
          {ANIME_STYLES.map((styleOption) => (
            <button
              key={styleOption.value}
              type="button"
              onClick={() => setStyle(styleOption.value)}
              disabled={isGenerating}
              className={cn(
                "px-3 py-2 rounded-lg border text-sm font-medium transition-all",
                style === styleOption.value
                  ? "border-purple-500 bg-purple-500/30 text-white"
                  : "border-white/20 bg-black/30 text-gray-300 hover:border-white/40"
              )}
            >
              {styleOption.label}
            </button>
          ))}
        </div>
      </div>

      {/* Scenes Count */}
      <div>
        <label className="block text-sm font-semibold mb-2 text-white">
          🎬 Scenes: {scenesCount}
        </label>
        <input
          type="range"
          min="1"
          max="10"
          value={scenesCount}
          onChange={(e) => setScenesCount(parseInt(e.target.value))}
          disabled={isGenerating}
          className="w-full h-2 bg-black/30 rounded-lg appearance-none cursor-pointer accent-purple-500"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Faster</span>
          <span>Detailed</span>
        </div>
      </div>

      {/* Comic Mode Toggle */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
        <label className="flex items-center justify-between cursor-pointer">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white">💬 Comic Mode</span>
            <span className="text-xs text-gray-400">(Text in images)</span>
          </div>
          <div className="relative">
            <input
              type="checkbox"
              checked={comicMode}
              onChange={(e) => setComicMode(e.target.checked)}
              disabled={isGenerating}
              className="sr-only peer"
            />
            <div className={cn(
              "w-11 h-6 rounded-full transition-colors",
              comicMode ? "bg-amber-500" : "bg-gray-600",
              isGenerating && "opacity-50 cursor-not-allowed"
            )}>
              <div className={cn(
                "absolute top-0.5 left-0.5 bg-white w-5 h-5 rounded-full transition-transform",
                comicMode && "translate-x-5"
              )} />
            </div>
          </div>
        </label>
        {comicMode && (
          <p className="text-xs text-amber-300 mt-2">
            ✨ Images will include speech bubbles and text baked in!
          </p>
        )}
      </div>

      {/* Submit */}
      <div className="pt-2">
        <div className="text-xs text-gray-400 mb-2 text-center">
          Est. Cost: <span className="text-purple-400 font-medium">{estimatedCost}</span>
        </div>
        <button
          type="submit"
          disabled={isGenerating || !outline.trim()}
          className={cn(
            "w-full py-3 px-4 rounded-lg font-semibold text-sm transition-all",
            isGenerating || !outline.trim()
              ? "bg-gray-700 text-gray-500 cursor-not-allowed"
              : "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg"
          )}
        >
          {isGenerating ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Generating...
            </span>
          ) : (
            <>
              <Sparkles className="w-4 h-4 inline mr-2" />
              Generate Anime
            </>
          )}
        </button>
      </div>
    </form>
  );
}
