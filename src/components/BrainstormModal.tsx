import React, { useState, useEffect } from 'react';
import {
  Brain,
  X,
  Sparkles,
  ArrowRight,
  RefreshCw,
  PlusCircle,
  Lightbulb,
  Check,
  Copy,
} from 'lucide-react';
import { JournalEntry } from '../types';

interface BrainstormModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry: JournalEntry;
  onAddConceptToReflection: (text: string) => void;
}

interface BrainstormAngle {
  title: string;
  concept: string;
  firstStep: string;
}

export function BrainstormModal({
  isOpen,
  onClose,
  entry,
  onAddConceptToReflection,
}: BrainstormModalProps) {
  const [topic, setTopic] = useState(entry.title || '');
  const [loading, setLoading] = useState(false);
  const [angles, setAngles] = useState<BrainstormAngle[]>([]);
  const [provocativeQuestion, setProvocativeQuestion] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [addedIndex, setAddedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const initialTopic =
      entry.title ||
      (entry.messages.length > 0 ? entry.messages[0].content.slice(0, 100) : '');
    setTopic(initialTopic);
    if (initialTopic) {
      fetchBrainstorm(initialTopic);
    }
  }, [isOpen, entry.id]);

  const fetchBrainstorm = async (currentTopic: string) => {
    if (!currentTopic.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/gemini/brainstorm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: currentTopic,
          category: entry.category,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to brainstorm ideas');
      }

      if (data.data?.angles) {
        setAngles(data.data.angles);
        setProvocativeQuestion(data.data.provocativeQuestion || null);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || 'An error occurred during brainstorming.');
    } finally {
      setLoading(false);
    }
  };

  const handleAppendAngle = (angle: BrainstormAngle, idx: number) => {
    const textToAppend = `💡 **Brainstorm Angle: ${angle.title}**\n${angle.concept}\n\n*First Step Experiment:* ${angle.firstStep}`;
    onAddConceptToReflection(textToAppend);
    setAddedIndex(idx);
    setTimeout(() => setAddedIndex(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-xl border border-gray-200 shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-gray-200 bg-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Brain className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-gray-900">
                Lateral Thinking &amp; Brainstorm Accelerator
              </h3>
              <p className="text-xs text-gray-500">
                Explore unconventional angles, mental reframes, and micro-experiments with Gemini 3.6 Flash.
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
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs">
          {/* Topic Input Bar */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Enter challenge or topic to brainstorm..."
              className="flex-1 p-2.5 bg-gray-50 border border-gray-300 rounded-md text-xs text-gray-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-600"
            />
            <button
              onClick={() => fetchBrainstorm(topic)}
              disabled={loading || !topic.trim()}
              className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-md transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Generate</span>
            </button>
          </div>

          {error && (
            <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-700">
              {error}
            </div>
          )}

          {loading ? (
            <div className="py-16 text-center space-y-3">
              <div className="inline-block w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
              <div className="font-semibold text-gray-900 text-sm">
                Generating lateral thinking angles with Gemini 3.6 Flash...
              </div>
              <p className="text-xs text-gray-500">
                Finding unconventional reframes and high-leverage experiments.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Provocative Question */}
              {provocativeQuestion && (
                <div className="p-3.5 bg-purple-50/70 border border-purple-100 rounded-lg text-purple-900 space-y-1">
                  <div className="font-bold text-[10px] uppercase tracking-wider text-purple-700 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>Paradigm-Shifting Question</span>
                  </div>
                  <p className="text-xs font-semibold italic">"{provocativeQuestion}"</p>
                </div>
              )}

              {/* Angles List */}
              <div className="space-y-3">
                {angles.map((angle, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 bg-white border border-gray-200 rounded-lg space-y-2 hover:border-purple-200 transition shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-bold text-gray-900 text-xs flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-[10px]">
                          {idx + 1}
                        </span>
                        <span>{angle.title}</span>
                      </h4>

                      <button
                        onClick={() => handleAppendAngle(angle, idx)}
                        className="flex items-center gap-1 text-[11px] px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-md font-medium transition cursor-pointer border border-purple-200"
                      >
                        {addedIndex === idx ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-700">Added to Journal</span>
                          </>
                        ) : (
                          <>
                            <PlusCircle className="w-3 h-3" />
                            <span>Add to Reflection</span>
                          </>
                        )}
                      </button>
                    </div>

                    <p className="text-gray-700 text-xs leading-relaxed">{angle.concept}</p>

                    {angle.firstStep && (
                      <div className="pt-1.5 border-t border-gray-100 flex items-start gap-1.5 text-[11px] text-gray-600">
                        <span className="font-semibold text-gray-800 shrink-0">Micro Experiment:</span>
                        <span>{angle.firstStep}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-md transition cursor-pointer text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
