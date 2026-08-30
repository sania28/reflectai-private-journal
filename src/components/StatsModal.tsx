import React from 'react';
import {
  BarChart3,
  X,
  BookOpen,
  MessageSquare,
  Sparkles,
  Flame,
  Smile,
  ShieldCheck,
  Calendar,
} from 'lucide-react';
import { JournalEntry } from '../types';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  entries: JournalEntry[];
  userEmail?: string | null;
}

export function StatsModal({
  isOpen,
  onClose,
  entries,
  userEmail,
}: StatsModalProps) {
  if (!isOpen) return null;

  const totalEntries = entries.length;
  const totalMessages = entries.reduce(
    (acc, curr) => acc + curr.messages.length,
    0
  );
  const totalUserWords = entries.reduce((acc, curr) => {
    return (
      acc +
      curr.messages
        .filter((m) => m.role === 'user')
        .reduce((wAcc, m) => wAcc + m.content.split(/\s+/).length, 0)
    );
  }, 0);

  // Category counts
  const categoryCounts: Record<string, number> = {};
  entries.forEach((e) => {
    categoryCounts[e.category] = (categoryCounts[e.category] || 0) + 1;
  });

  // Mood counts
  const moodCounts: Record<string, number> = {};
  entries.forEach((e) => {
    if (e.mood) {
      moodCounts[e.mood] = (moodCounts[e.mood] || 0) + 1;
    }
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-xl border border-gray-200 shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-gray-200 bg-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-gray-900">
                Reflection Metrics &amp; History
              </h3>
              <p className="text-xs text-gray-500">
                Private insights isolated to {userEmail || 'your account'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-xs text-gray-700">
          {/* Top 3 Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-lg space-y-1">
              <div className="text-[11px] font-semibold text-blue-800 uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                <span>Total Reflections</span>
              </div>
              <div className="text-2xl font-extrabold text-blue-950">{totalEntries}</div>
              <div className="text-[10px] text-blue-700">Saved to Cloud Firestore</div>
            </div>

            <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-lg space-y-1">
              <div className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                <span>AI Dialogue Turns</span>
              </div>
              <div className="text-2xl font-extrabold text-emerald-950">{totalMessages}</div>
              <div className="text-[10px] text-emerald-700">Powered by Gemini 3.6 Flash</div>
            </div>

            <div className="p-4 bg-purple-50/50 border border-purple-100 rounded-lg space-y-1">
              <div className="text-[11px] font-semibold text-purple-800 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                <span>Words Written</span>
              </div>
              <div className="text-2xl font-extrabold text-purple-950">{totalUserWords.toLocaleString()}</div>
              <div className="text-[10px] text-purple-700">Self-reflection volume</div>
            </div>
          </div>

          {/* Categories Breakdown */}
          <div className="space-y-2.5">
            <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider">
              Reflection Themes &amp; Categories
            </h4>
            {Object.keys(categoryCounts).length === 0 ? (
              <p className="text-gray-400">No categories recorded yet.</p>
            ) : (
              <div className="space-y-2">
                {Object.entries(categoryCounts).map(([cat, count]) => {
                  const percent = Math.round((count / (totalEntries || 1)) * 100);
                  return (
                    <div key={cat} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-medium">
                        <span>{cat}</span>
                        <span className="text-gray-500">
                          {count} ({percent}%)
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded-full"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Mood Breakdown */}
          {Object.keys(moodCounts).length > 0 && (
            <div className="space-y-2.5">
              <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Smile className="w-3.5 h-3.5 text-amber-500" />
                <span>Mood Distribution</span>
              </h4>
              <div className="flex flex-wrap gap-2">
                {Object.entries(moodCounts).map(([mood, count]) => (
                  <div
                    key={mood}
                    className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg flex items-center gap-2 text-xs font-medium text-gray-800"
                  >
                    <span>{mood}</span>
                    <span className="w-5 h-5 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center text-[10px] font-bold">
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Storage & Privacy Architecture Notice */}
          <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-lg flex items-start gap-2.5 text-xs text-gray-600">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-gray-900">
                Guaranteed Isolation &amp; Zero-Hardcoding
              </div>
              <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                All journal sessions reside in your personal Firestore path{' '}
                <code>/users/&#123;uid&#125;/entries</code>. Only your Firebase credentials can read or write these documents.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition cursor-pointer text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
