'use client';

import { useState, useEffect } from 'react';
import { Key, X, Check, AlertCircle, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { clientApiKey } from '@/lib/apiKeyManager';

export function ApiKeyInput() {
  const [hasKey, setHasKey] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [error, setError] = useState('');
  const [showBanner, setShowBanner] = useState(true);

  useEffect(() => {
    const keyExists = clientApiKey.exists();
    setHasKey(keyExists);
    if (!keyExists) {
      setShowInput(true);
    }
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
    setShowInput(false);
    setError('');
    setApiKey('');
  };

  const handleChange = () => {
    clientApiKey.remove();
    setHasKey(false);
    setShowInput(true);
    setApiKey('');
    setError('');
  };

  const handleRemove = () => {
    if (confirm('Are you sure you want to remove your API key? You will need to enter it again to use the app.')) {
      clientApiKey.remove();
      setHasKey(false);
      setShowInput(true);
    }
  };

  if (!showBanner && hasKey) {
    return null;
  }

  return (
    <div className={cn(
      "mb-4 rounded-xl border transition-all",
      hasKey 
        ? "bg-green-500/10 border-green-500/30" 
        : "bg-amber-500/10 border-amber-500/30"
    )}>
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-lg",
              hasKey ? "bg-green-500/20" : "bg-amber-500/20"
            )}>
              {hasKey ? (
                <Check className="w-5 h-5 text-green-400" />
              ) : (
                <AlertCircle className="w-5 h-5 text-amber-400" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-white flex items-center gap-2">
                <Key className="w-4 h-4" />
                {hasKey ? 'API Key Connected' : 'OpenRouter API Key Required'}
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                {hasKey 
                  ? 'Your key is stored locally in your browser' 
                  : 'Get your free API key from OpenRouter to start generating'}
              </p>
            </div>
          </div>
          {hasKey && (
            <button
              onClick={() => setShowBanner(false)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Input Section */}
        {showInput && !hasKey && (
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
          <div className="flex items-center gap-2">
            <button
              onClick={handleChange}
              className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/20 rounded-lg text-white text-xs transition-colors"
            >
              Change Key
            </button>
            <button
              onClick={handleRemove}
              className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-xs transition-colors"
            >
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
        )}
      </div>
    </div>
  );
}
