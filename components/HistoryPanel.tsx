'use client';

import { useState, useEffect } from 'react';
import { X, Search, Trash2, Clock, HardDrive } from 'lucide-react';
import type { HistoryEntry } from '@/types';
import { getHistory, deleteHistoryEntry, clearHistory, searchHistory, getStorageSize } from '@/lib/history';
import { HistoryItem } from './HistoryItem';
import { cn } from '@/lib/utils';

interface HistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onView: (entry: HistoryEntry) => void;
  onEdit: (entry: HistoryEntry) => void;
}

export function HistoryPanel({ isOpen, onClose, onView, onEdit }: HistoryPanelProps) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [storageSize, setStorageSize] = useState(0);

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen]);

  const loadHistory = async () => {
    const entries = await getHistory();
    setHistory(entries);
    const size = await getStorageSize();
    setStorageSize(size);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this generation from history?')) {
      await deleteHistoryEntry(id);
      loadHistory();
    }
  };

  const handleClearAll = async () => {
    if (confirm(`Delete all ${history.length} generations from history? This cannot be undone.`)) {
      await clearHistory();
      loadHistory();
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      const results = await searchHistory(query);
      setHistory(results);
    } else {
      loadHistory();
    }
  };

  const displayedHistory = searchQuery ? history : history;

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div
        className={cn(
          "fixed top-0 right-0 bottom-0 w-full md:w-96 bg-gradient-to-b from-purple-900/40 to-black/60 backdrop-blur-xl border-l border-white/10 z-50 transform transition-transform duration-300 ease-in-out flex flex-col",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex-shrink-0 p-6 border-b border-white/10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Clock className="w-6 h-6 text-purple-400" />
              <div>
                <h2 className="text-xl font-bold text-white">History</h2>
                <p className="text-xs text-gray-400">{history.length} generations</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search history..."
              className="w-full pl-10 pr-4 py-2 bg-black/30 border border-white/20 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Storage Info */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-gray-400">
              <HardDrive className="w-3.5 h-3.5" />
              <span>{storageSize} KB used</span>
            </div>
            {history.length > 0 && (
              <button
                onClick={handleClearAll}
                className="flex items-center gap-1.5 text-red-400 hover:text-red-300 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear All
              </button>
            )}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {displayedHistory.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-sm">
                {searchQuery ? 'No results found' : 'No history yet'}
              </p>
              <p className="text-gray-500 text-xs mt-2">
                {searchQuery ? 'Try a different search term' : 'Your generations will appear here'}
              </p>
            </div>
          ) : (
            displayedHistory.map((entry) => (
              <HistoryItem
                key={entry.id}
                entry={entry}
                onView={onView}
                onEdit={onEdit}
                onDelete={handleDelete}
              />
            ))
          )}
        </div>
      </div>
    </>
  );
}
