'use client';

import { useState, useEffect } from 'react';
import { Key, X, Check, AlertCircle, ExternalLink, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { clientApiKey } from '@/lib/apiKeyManager';

export function ApiKeyInput() {
  const [hasKey, setHasKey] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const keyExists = clientApiKey.exists();
    setHasKey(keyExists);
  }, []);

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
                It's only used to make direct requests to OpenRouter on your behalf.
              </p>
            </div>
          </div>
        )}

        {/* Key Status */}
        {hasKey && (
          <div className="space-y-2">
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
          </div>
        )}
          </div>
        </div>
      )}
    </div>
  );
}
