import React, { useState, useMemo } from 'react';
import {
  Search,
  BookOpen,
  Calendar,
  MessageSquare,
  Sparkles,
  Trash2,
  Tag,
  Filter,
  Plus,
  Smile,
  Compass,
} from 'lucide-react';
import { JournalEntry, JournalCategory, JournalMood } from '../types';

interface EntriesSidebarProps {
  entries: JournalEntry[];
  selectedEntryId: string | null;
  onSelectEntry: (entry: JournalEntry) => void;
  onDeleteEntry: (entryId: string) => void;
  onNewEntry: () => void;
}

const CATEGORIES: Array<JournalCategory | 'All'> = [
  'All',
  'Personal Reflection',
  'Deep Work & Productivity',
  'Brainstorming & Ideas',
  'Mindfulness & Gratitude',
  'Problem Solving',
  'Career & Goals',
  'Free Flow',
];

export function EntriesSidebar({
  entries,
  selectedEntryId,
  onSelectEntry,
  onDeleteEntry,
  onNewEntry,
}: EntriesSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<JournalCategory | 'All'>('All');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filter entries based on search & category
  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      const matchesCategory =
        selectedCategory === 'All' || entry.category === selectedCategory;

      const q = searchQuery.toLowerCase().trim();
      if (!q) return matchesCategory;

      const matchesTitle = entry.title.toLowerCase().includes(q);
      const matchesSummary = (entry.summary || '').toLowerCase().includes(q);
      const matchesTags = (entry.tags || []).some((t) => t.toLowerCase().includes(q));
      const matchesMessages = entry.messages.some((m) =>
        m.content.toLowerCase().includes(q)
      );

      return matchesCategory && (matchesTitle || matchesSummary || matchesTags || matchesMessages);
    });
  }, [entries, searchQuery, selectedCategory]);

  const formatTimestamp = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 2) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays}d ago`;

      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return '';
    }
  };

  const getMoodColor = (mood?: JournalMood) => {
    switch (mood) {
      case 'Energized':
      case 'Motivated':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Calm':
      case 'Grateful':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Focused':
      case 'Thoughtful':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Inspired':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Anxious':
      case 'Overwhelmed':
      case 'Tired':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <aside className="w-full lg:w-80 bg-white border border-gray-200 rounded-lg flex flex-col h-[calc(100vh-140px)] shadow-[0_1px_2px_rgba(0,0,0,0.04)] overflow-hidden">
      {/* Sidebar Header & Search */}
      <div className="p-3.5 border-b border-gray-100 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-bold text-xs text-gray-900 uppercase tracking-wider">
            <BookOpen className="w-3.5 h-3.5 text-blue-600" />
            <span>Journal History</span>
            <span className="text-[11px] font-normal text-gray-500">
              ({entries.length})
            </span>
          </div>

          <button
            onClick={onNewEntry}
            className="p-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 transition cursor-pointer text-xs font-semibold flex items-center gap-1 px-2"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search entries, keywords..."
            className="w-full pl-8 pr-3 py-1.5 bg-gray-50 hover:bg-gray-100/70 focus:bg-white text-xs rounded-md border border-gray-200 focus:outline-hidden focus:ring-1 focus:ring-blue-600 transition"
          />
        </div>

        {/* Category Filter Pills (Horizontal Scroll) */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar text-[11px]">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2 py-0.5 rounded-full whitespace-nowrap font-medium transition cursor-pointer shrink-0 border ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Entries List */}
      <div className="flex-1 overflow-y-auto divide-y divide-gray-100 p-2 space-y-1">
        {filteredEntries.length === 0 ? (
          <div className="py-12 px-4 text-center text-xs text-gray-500 space-y-3">
            <Compass className="w-8 h-8 text-gray-300 mx-auto" />
            {entries.length === 0 ? (
              <div>
                <p className="font-semibold text-gray-700">No journal entries yet</p>
                <p className="text-[11px] text-gray-500 mt-1">
                  Start your first multi-turn reflection session with Gemini.
                </p>
                <button
                  onClick={onNewEntry}
                  className="mt-3 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-md transition shadow-xs cursor-pointer"
                >
                  Write First Entry
                </button>
              </div>
            ) : (
              <div>
                <p className="font-semibold text-gray-700">No matching reflections</p>
                <p className="text-[11px] text-gray-500 mt-1">
                  Try clearing the search query or changing category filter.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('All');
                  }}
                  className="mt-2 text-xs text-blue-600 font-medium hover:underline cursor-pointer"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        ) : (
          filteredEntries.map((entry) => {
            const isSelected = selectedEntryId === entry.id;
            const snippet =
              entry.summary ||
              (entry.messages.length > 0
                ? entry.messages[entry.messages.length - 1].content
                : 'No conversation yet');

            return (
              <div
                key={entry.id}
                onClick={() => onSelectEntry(entry)}
                className={`p-3 rounded-lg text-left transition cursor-pointer border group relative ${
                  isSelected
                    ? 'bg-blue-50/70 border-blue-200 shadow-xs'
                    : 'bg-white hover:bg-gray-50/80 border-transparent hover:border-gray-200'
                }`}
              >
                {/* Title & Time */}
                <div className="flex items-start justify-between gap-2">
                  <h4
                    className={`font-semibold text-xs truncate max-w-[190px] ${
                      isSelected ? 'text-blue-900' : 'text-gray-900'
                    }`}
                  >
                    {entry.title || 'Untitled Reflection'}
                  </h4>
                  <span className="text-[10px] text-gray-400 shrink-0">
                    {formatTimestamp(entry.updatedAt)}
                  </span>
                </div>

                {/* Preview Snippet */}
                <p className="text-[11px] text-gray-600 line-clamp-2 mt-1 leading-relaxed">
                  {snippet}
                </p>

                {/* Meta Badges */}
                <div className="flex items-center justify-between gap-1.5 mt-2 text-[10px]">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {entry.mood && (
                      <span
                        className={`px-1.5 py-0.2 rounded border font-medium ${getMoodColor(
                          entry.mood
                        )}`}
                      >
                        {entry.mood}
                      </span>
                    )}
                    <span className="px-1.5 py-0.2 rounded bg-gray-100 text-gray-600 border border-gray-200 truncate max-w-[110px]">
                      {entry.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 flex items-center gap-0.5">
                      <MessageSquare className="w-3 h-3 text-gray-400" />
                      <span>{entry.messages.length}</span>
                    </span>

                    {/* Delete Entry Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete reflection "${entry.title}"?`)) {
                          onDeleteEntry(entry.id);
                        }
                      }}
                      title="Delete Entry"
                      className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-600 rounded transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
