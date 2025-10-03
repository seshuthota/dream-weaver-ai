'use client';

import { useState, useEffect } from 'react';
import { Key, X, Check, AlertCircle, ExternalLink, ChevronDown, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { clientApiKey, clientModelSelection } from '@/lib/apiKeyManager';
import { DEFAULT_MODELS } from '@/lib/config/models';
import { ModelSelector } from './ModelSelector';
import type { ModelSelection } from '@/types';

export function ApiKeyInput() {
  const [hasKey, setHasKey] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [error, setError] = useState('');
  const [showModelConfig, setShowModelConfig] = useState(false);
  const [modelSelection, setModelSelection] = useState<ModelSelection>(DEFAULT_MODELS);
  const [tempModelSelection, setTempModelSelection] = useState<ModelSelection>(DEFAULT_MODELS);

  useEffect(() => {
    const keyExists = clientApiKey.exists();
    setHasKey(keyExists);
    
    const savedSelection = clientModelSelection.get();
    if (savedSelection) {
      setModelSelection(savedSelection);
      setTempModelSelection(savedSelection);
    }
  }, []);

  useEffect(() => {
    if (showModelConfig) {
      console.log('Model configuration panel opened');
    }
  }, [showModelConfig]);

  const handleSave = () => {
    if (!apiKey.trim()) {
      setError('Please enter an API key');
      return;
    }

    if (!clientApiKey.validate(apiKey)) {
      setError('Invalid API key format. Please check your key.');
      return;
    }

    clientApiKey.set(apiKey);
    setHasKey(true);
    setShowDropdown(false);
    setError('');
    setApiKey('');
  };

  const handleRemove = () => {
    if (confirm('Are you sure you want to remove your API key? You will need to enter it again to use the app.')) {
      clientApiKey.remove();
      setHasKey(false);
      setApiKey('');
    }
  };

  const handleSaveModels = () => {
    clientModelSelection.set(tempModelSelection);
    setModelSelection(tempModelSelection);
    setShowModelConfig(false);
  };

  const handleCancelModels = () => {
    setTempModelSelection(modelSelection);
    setShowModelConfig(false);
  };

  const handleResetModels = () => {
    setTempModelSelection(DEFAULT_MODELS);
  };

  const truncateModelId = (id: string, maxLength: number = 30) => {
    if (id.length <= maxLength) return id;
    return id.slice(0, maxLength) + '...';
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-api-key-dropdown]')) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showDropdown]);

  return (
    <div className="relative" data-api-key-dropdown>
      {/* Compact Button */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-lg transition-all font-medium text-sm",
          hasKey
            ? "bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 text-green-300"
            : "bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-300"
        )}
      >
        {hasKey ? (
          <Check className="w-4 h-4" />
        ) : (
          <AlertCircle className="w-4 h-4" />
        )}
        <Key className="w-4 h-4" />
        <span>{hasKey ? 'API Key Connected' : 'API Key Required'}</span>
        <ChevronDown className={cn("w-4 h-4 transition-transform", showDropdown && "rotate-180")} />
      </button>

      {/* Dropdown Panel */}
      {showDropdown && (
        <div className="absolute top-full right-0 mt-2 w-96 bg-gray-900 border border-white/20 rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="p-4">
        {/* Header */}
        <div className="mb-3">
          <h3 className="font-semibold text-white text-sm mb-1">
            {hasKey ? 'API Key Status' : 'OpenRouter API Key Required'}
          </h3>
          <p className="text-xs text-gray-400">
            {hasKey 
              ? 'Your key is stored locally in your browser' 
              : 'Get your free API key from OpenRouter to start generating'}
          </p>
        </div>

        {/* Input Section */}
        {!hasKey && (
          <div className="space-y-3">
            <div>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value);
                  setError('');
                }}
                placeholder="sk-or-v1-..."
                className="w-full px-4 py-2 bg-black/30 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
              />
              {error && (
                <p className="text-red-400 text-xs mt-1">{error}</p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleSave}
                disabled={!apiKey.trim()}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all",
                  apiKey.trim()
                    ? "bg-purple-600 hover:bg-purple-700 text-white"
                    : "bg-gray-700 text-gray-500 cursor-not-allowed"
                )}
              >
                <Check className="w-4 h-4" />
                Save Key
              </button>

              <a
                href="https://openrouter.ai/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/20 rounded-lg text-white text-sm transition-colors"
              >
                Get API Key
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
              <p className="text-blue-300 text-xs leading-relaxed">
                <strong>🔒 Privacy:</strong> Your API key is stored locally in your browser and never sent to our servers. 
                It&#39;s only used to make direct requests to OpenRouter on your behalf.
              </p>
            </div>
          </div>
        )}

        {/* Key Status */}
        {hasKey && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-gray-400 bg-green-500/10 px-3 py-2 rounded-lg">
              <span>✓ Key saved in browser</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRemove}
                className="flex items-center gap-1 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-xs transition-colors"
              >
                <X className="w-3 h-3" />
                Remove Key
              </button>
              <a
                href="https://openrouter.ai/activity"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/20 rounded-lg text-white text-xs transition-colors ml-auto"
              >
                View Usage
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* Model Configuration Section */}
            <div className="border-t border-white/10 pt-3">
              <div className="mb-2">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold text-white flex items-center gap-1">
                    <Settings className="w-3 h-3" />
                    Model Configuration
                  </h4>
                  <button
                    onClick={() => setShowModelConfig(!showModelConfig)}
                    className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    {showModelConfig ? 'Cancel' : 'Configure'}
                  </button>
                </div>
                
                {!showModelConfig && (
                  <div className="space-y-1 text-xs">
                    <div className="flex items-start gap-2">
                      <span className="text-gray-500 min-w-[60px]">📝 Text:</span>
                      <span className="text-gray-300 truncate" title={modelSelection.textModel}>
                        {truncateModelId(modelSelection.textModel)}
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-gray-500 min-w-[60px]">🎨 Image:</span>
                      <span className="text-gray-300 text-xs">
                        {modelSelection.imageProvider === 'pollinations' 
                          ? 'Pollinations Flux Anime (FREE)' 
                          : 'Gemini 2.5 Flash'}
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-gray-500 min-w-[60px]">👁️ Verify:</span>
                      <span className="text-gray-400 text-xs">Gemini 2.5 Flash (fixed)</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Model Configuration Form */}
              {showModelConfig && (
                <div className="space-y-4 mt-3">
                  <ModelSelector
                    label="Text Generation (Story & Prompts)"
                    category="text"
                    value={tempModelSelection.textModel}
                    onChange={(modelId) => setTempModelSelection(prev => ({ ...prev, textModel: modelId }))}
                    defaultValue={DEFAULT_MODELS.textModel}
                  />

                  {/* Image Generation Provider Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      🎨 Image Generation Provider
                    </label>
                    <div className="space-y-2">
                      {/* OpenRouter Option */}
                      <button
                        type="button"
                        onClick={() => setTempModelSelection(prev => ({ 
                          ...prev, 
                          imageProvider: 'openrouter',
                          imageModel: 'google/gemini-2.5-flash-image-preview'
                        }))}
                        className={cn(
                          "w-full px-4 py-3 rounded-lg border transition-all text-left",
                          tempModelSelection.imageProvider !== 'pollinations'
                            ? "bg-purple-500/20 border-purple-500/50"
                            : "bg-black/20 border-white/10 hover:bg-black/30"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-white text-sm">OpenRouter (Paid)</div>
                            <div className="text-xs text-gray-400 mt-0.5">Gemini 2.5 Flash Image Preview</div>
                            <div className="text-xs text-gray-500 mt-1">High quality, costs $0.0002 per image</div>
                          </div>
                          {tempModelSelection.imageProvider !== 'pollinations' && (
                            <Check className="w-4 h-4 text-purple-400" />
                          )}
                        </div>
                      </button>

                      {/* Pollinations Option */}
                      <button
                        type="button"
                        onClick={() => setTempModelSelection(prev => ({ 
                          ...prev, 
                          imageProvider: 'pollinations',
                          imageModel: 'pollinations/flux-anime'
                        }))}
                        className={cn(
                          "w-full px-4 py-3 rounded-lg border transition-all text-left",
                          tempModelSelection.imageProvider === 'pollinations'
                            ? "bg-green-500/20 border-green-500/50"
                            : "bg-black/20 border-white/10 hover:bg-black/30"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-white text-sm flex items-center gap-2">
                              Pollinations.ai (FREE) 
                              <span className="px-2 py-0.5 bg-green-500/30 text-green-300 text-xs rounded">Recommended</span>
                            </div>
                            <div className="text-xs text-gray-400 mt-0.5">Flux Anime Model</div>
                            <div className="text-xs text-gray-500 mt-1">Completely free, anime-optimized</div>
                          </div>
                          {tempModelSelection.imageProvider === 'pollinations' && (
                            <Check className="w-4 h-4 text-green-400" />
                          )}
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Fixed Image Verification Model */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      👁️ Image Verification
                    </label>
                    <div className="px-4 py-3 bg-black/20 border border-white/10 rounded-lg">
                      <div className="font-medium text-gray-400 text-sm">Gemini 2.5 Flash Image (Preview)</div>
                      <div className="text-xs text-gray-500 truncate">google/gemini-2.5-flash-image-preview</div>
                      <div className="text-xs text-gray-500 mt-1">Fixed model for image verification</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      onClick={handleSaveModels}
                      className="flex items-center gap-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white text-sm transition-colors"
                    >
                      <Check className="w-4 h-4" />
                      Save Configuration
                    </button>
                    <button
                      onClick={handleResetModels}
                      className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/20 rounded-lg text-white text-sm transition-colors"
                    >
                      Reset to Defaults
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
          </div>
        </div>
      )}
    </div>
  );
}
