import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  X,
  CheckCircle2,
  ListTodo,
  Lightbulb,
  Heart,
  Tag,
  RefreshCw,
  Copy,
  Check,
  Save,
} from 'lucide-react';
import { JournalEntry, ReflectionAnalysis } from '../types';

interface SummaryInsightsModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry: JournalEntry;
  onSaveAnalysis: (analysis: ReflectionAnalysis) => void;
}

export function SummaryInsightsModal({
  isOpen,
  onClose,
  entry,
  onSaveAnalysis,
}: SummaryInsightsModalProps) {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<ReflectionAnalysis | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize or fetch summary when opened
  useEffect(() => {
    if (!isOpen) return;

    if (entry.summary && entry.keyInsights && entry.keyInsights.length > 0) {
      setAnalysis({
        summary: entry.summary,
        keyInsights: entry.keyInsights,
        actionItems: entry.actionItems || [],
        suggestedTags: entry.tags || [],
        detectedMood: entry.mood,
      });
    } else if (entry.messages.length > 0) {
      handleGenerateSummary();
    }
  }, [isOpen, entry.id]);

  const handleGenerateSummary = async () => {
    if (entry.messages.length === 0) {
      setError('Please write at least one journal entry or reflection first.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/gemini/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: entry.messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          entryContext: {
            title: entry.title,
            category: entry.category,
          },
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to synthesize summary');
      }

      setAnalysis(data.analysis);
      onSaveAnalysis(data.analysis);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || 'An error occurred during summarization.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopySummary = () => {
    if (!analysis) return;
    let text = `Executive Summary:\n${analysis.summary}\n\nKey Insights:\n`;
    analysis.keyInsights.forEach((i) => (text += `• ${i}\n`));
    text += `\nAction Items:\n`;
    analysis.actionItems.forEach((a) => (text += `[ ] ${a}\n`));
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-xl border border-gray-200 shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-gray-200 bg-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-gray-900">
                Reflection Synthesis &amp; Executive Summary
              </h3>
              <p className="text-xs text-gray-500 truncate max-w-sm sm:max-w-md">
                {entry.title || 'Untitled Reflection'}
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
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs text-gray-700">
          {error && (
            <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-700">
              {error}
            </div>
          )}

          {loading ? (
            <div className="py-16 text-center space-y-3">
              <div className="inline-block w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <div className="font-semibold text-gray-900 text-sm">
                Synthesizing multi-turn session with Gemini 3.6 Flash...
              </div>
              <p className="text-xs text-gray-500">
                Extracting core cognitive themes, strategic insights, and action commitments.
              </p>
            </div>
          ) : analysis ? (
            <div className="space-y-5">
              {/* Executive Summary Card */}
              <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-xs text-blue-900 uppercase tracking-wider">
                  <Lightbulb className="w-3.5 h-3.5 text-blue-600" />
                  <span>Executive Summary</span>
                </div>
                <p className="text-xs sm:text-[13px] text-gray-800 leading-relaxed">
                  {analysis.summary}
                </p>
              </div>

              {/* Key Insights */}
              <div className="space-y-2">
                <div className="font-bold text-xs text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                  <span>Key Insights &amp; Discoveries</span>
                </div>
                <div className="space-y-1.5">
                  {analysis.keyInsights.map((insight, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-md bg-gray-50 border border-gray-200 flex items-start gap-2 text-xs text-gray-800"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{insight}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Items */}
              {analysis.actionItems && analysis.actionItems.length > 0 && (
                <div className="space-y-2">
                  <div className="font-bold text-xs text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                    <ListTodo className="w-3.5 h-3.5 text-blue-600" />
                    <span>Action Commitments</span>
                  </div>
                  <div className="space-y-1.5">
                    {analysis.actionItems.map((action, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-md bg-white border border-gray-200 flex items-start gap-2.5 text-xs text-gray-800"
                      >
                        <input
                          type="checkbox"
                          className="mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        <span className="leading-relaxed">{action}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Closing Affirmation / Encouragement */}
              {analysis.encouragement && (
                <div className="p-3 bg-purple-50/60 border border-purple-100 rounded-lg text-purple-900 italic text-xs">
                  "{analysis.encouragement}"
                </div>
              )}
            </div>
          ) : (
            <div className="py-12 text-center text-gray-500">
              <p>No summary generated yet for this entry.</p>
              <button
                onClick={handleGenerateSummary}
                className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-medium transition cursor-pointer"
              >
                Synthesize Reflection
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-xs">
          <button
            onClick={handleGenerateSummary}
            disabled={loading || entry.messages.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-md font-medium transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Regenerate Synthesis</span>
          </button>

          <div className="flex items-center gap-2">
            {analysis && (
              <button
                onClick={handleCopySummary}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-md font-medium transition cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-gray-500" />
                    <span>Copy Summary</span>
                  </>
                )}
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
