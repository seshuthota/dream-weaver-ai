'use client';

import { useState, useRef, useEffect } from 'react';
import { Check, ChevronDown, Search, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useOpenRouterModels } from '@/hooks/useOpenRouterModels';
import { formatModelPrice, formatContextLength, type ModelCategory } from '@/lib/modelCategories';
import type { OpenRouterModel } from '@/types';

interface ModelSelectorProps {
  label: string;
  category: ModelCategory;
  value: string;
  onChange: (modelId: string) => void;
  defaultValue?: string;
}

export function ModelSelector({ 
  label, 
  category, 
  value, 
  onChange, 
  defaultValue 
}: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const { models, loading, error, searchQuery, setSearchQuery, refetch } = useOpenRouterModels(category);

  const selectedModel = models.find(m => m.id === value);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleSelect = (modelId: string) => {
    onChange(modelId);
    setIsOpen(false);
    setSearchQuery('');
  };

  const getCategoryIcon = (cat: ModelCategory) => {
    switch (cat) {
      case 'text': return '📝';
      case 'image': return '🎨';
      case 'vision': return '👁️';
      default: return '🤖';
    }
  };

  return (
    <div
      className={cn(
        "relative",
        isOpen ? "z-50" : "z-10"
      )}
      ref={dropdownRef}
    >
      <label className="block text-sm font-medium text-gray-300 mb-2">
        {getCategoryIcon(category)} {label}
      </label>

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full px-4 py-3 bg-black/30 border border-white/20 rounded-lg",
          "text-left text-white hover:bg-black/40 transition-colors",
          "flex items-center justify-between gap-2",
          isOpen && "ring-2 ring-purple-500"
        )}
      >
        <div className="flex-1 min-w-0">
          {selectedModel ? (
            <div>
              <div className="font-medium truncate">{selectedModel.name}</div>
              <div className="text-xs text-gray-400 truncate">{selectedModel.id}</div>
            </div>
          ) : (
            <div className="text-gray-400">Select a model...</div>
          )}
        </div>
        <ChevronDown className={cn("w-4 h-4 transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-gray-900 border border-white/20 rounded-lg shadow-2xl z-[100] max-h-96 flex flex-col">
          <div className="p-3 border-b border-white/10">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search models..."
                className="w-full pl-10 pr-4 py-2 bg-black/30 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                autoFocus
              />
            </div>
          </div>

          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="flex items-center justify-center py-8 text-gray-400">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                <span>Loading models...</span>
              </div>
            ) : error ? (
              <div className="p-4">
                <div className="flex items-center gap-2 text-red-400 mb-3">
                  <AlertCircle className="w-5 h-5" />
                  <span className="text-sm">Failed to load models</span>
                </div>
                <button
                  onClick={refetch}
                  className="flex items-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white text-sm transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Retry
                </button>
              </div>
            ) : models.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-400 text-sm mb-2">
                  {searchQuery.trim()
                    ? `No models match "${searchQuery.trim()}"`
                    : `No ${category} models found`
                  }
                </p>
                {!searchQuery.trim() && (
                  <p className="text-gray-500 text-xs">
                    Check browser console for debugging info
                  </p>
                )}
              </div>
            ) : (
              <div className="py-1">
                {models.slice(0, 50).map((model) => (
                  <button
                    key={model.id}
                    onClick={() => handleSelect(model.id)}
                    className={cn(
                      "w-full px-4 py-3 hover:bg-white/5 transition-colors text-left",
                      "border-b border-white/5 last:border-0",
                      value === model.id && "bg-purple-500/10"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white text-sm truncate">
                            {model.name}
                          </span>
                          {value === model.id && (
                            <Check className="w-4 h-4 text-purple-400 flex-shrink-0" />
                          )}
                        </div>
                        <div className="text-xs text-gray-400 truncate mt-0.5">
                          {model.id}
                        </div>
                        {model.description && (
                          <div className="text-xs text-gray-500 mt-1 line-clamp-1">
                            {model.description}
                          </div>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-xs">
                          <span className={cn(
                            "font-medium",
                            (model.pricing.prompt === '0' || model.id.includes(':free')) 
                              ? "text-green-400" 
                              : "text-gray-400"
                          )}>
                            💰 {formatModelPrice(model)}
                          </span>
                          <span className="text-gray-500">
                            📏 {formatContextLength(model.context_length)} tokens
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
                {models.length > 50 && (
                  <div className="px-4 py-3 text-center text-xs text-gray-500 border-t border-white/10">
                    Showing first 50 of {models.length} models
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
