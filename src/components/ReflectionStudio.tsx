import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Brain,
  FileText,
  Copy,
  Check,
  RotateCcw,
  Smile,
  ChevronDown,
  Tag,
  Lightbulb,
  ArrowUpRight,
  ShieldAlert,
  Download,
  Flame,
  CheckCircle2,
} from 'lucide-react';
import Markdown from 'react-markdown';
import {
  JournalEntry,
  JournalMessage,
  JournalCategory,
  JournalMood,
  ReflectionAnalysis,
} from '../types';

interface ReflectionStudioProps {
  entry: JournalEntry;
  onUpdateEntry: (updated: Partial<JournalEntry>) => void;
  onOpenSummaryModal: () => void;
  onOpenBrainstormModal: () => void;
}

const CATEGORIES: JournalCategory[] = [
  'Personal Reflection',
  'Deep Work & Productivity',
  'Brainstorming & Ideas',
  'Mindfulness & Gratitude',
  'Problem Solving',
  'Career & Goals',
  'Free Flow',
];

const MOODS: JournalMood[] = [
  'Calm',
  'Energized',
  'Focused',
  'Thoughtful',
  'Anxious',
  'Inspired',
  'Tired',
  'Grateful',
  'Motivated',
  'Overwhelmed',
];

const PROMPT_STARTERS = [
  {
    title: '🧠 Unpack Current Dilemma',
    prompt: 'I am wrestling with a tough decision right now. Help me weigh the core trade-offs, identify blind spots, and reframe the problem.',
  },
  {
    title: '🌱 Daily Mental Debrief',
    prompt: "Here is what happened today and how I felt about it. What patterns or lessons should I take away from this?",
  },
  {
    title: '🚀 Creative Brainstorming',
    prompt: "I have a new concept I want to explore. Challenge my assumptions and brainstorm 5 high-impact angles to develop it.",
  },
  {
    title: '✨ Mindfulness & Gratitude',
    prompt: "I want to ground myself and reflect on 3 moments of genuine gratitude from this week, diving deep into why they matter.",
  },
];

const QUICK_ACTIONS = [
  'Help me reframe this thought constructively',
  'Extract 3 actionable principles from this',
  'What blind spots or cognitive biases might I have?',
  'Synthesize this into a clear 3-step action commitment',
];

export function ReflectionStudio({
  entry,
  onUpdateEntry,
  onOpenSummaryModal,
  onOpenBrainstormModal,
}: ReflectionStudioProps) {
  const [inputText, setInputText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entry.messages, isGenerating]);

  // Handle sending a user reflection to Gemini
  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = (customPrompt || inputText).trim();
    if (!textToSend || isGenerating) return;

    setErrorBanner(null);

    const userMessage: JournalMessage = {
      id: 'msg-' + Date.now() + '-user',
      role: 'user',
      content: textToSend,
      timestamp: new Date().toISOString(),
    };

    const updatedMessages = [...entry.messages, userMessage];

    // Optimistically update entry state & auto-save to Firestore
    onUpdateEntry({
      messages: updatedMessages,
      updatedAt: new Date().toISOString(),
    });

    if (!customPrompt) {
      setInputText('');
    }

    setIsGenerating(true);

    try {
      const response = await fetch('/api/gemini/reflect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          entryContext: {
            title: entry.title,
            category: entry.category,
            mood: entry.mood,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate reflection response');
      }

      const modelMessage: JournalMessage = {
        id: 'msg-' + Date.now() + '-model',
        role: 'model',
        content: data.reply,
        timestamp: new Date().toISOString(),
      };

      const finalMessages = [...updatedMessages, modelMessage];

      onUpdateEntry({
        messages: finalMessages,
        updatedAt: new Date().toISOString(),
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('Reflection turn error:', msg);
      setErrorBanner(msg || 'An error occurred while generating reflection.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCopyMessage = (content: string, index: number) => {
    navigator.clipboard.writeText(content);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleExportMarkdown = () => {
    const formattedDate = new Date(entry.createdAt).toLocaleString();
    let md = `# ${entry.title || 'Untitled Reflection'}\n\n`;
    md += `**Date:** ${formattedDate}\n`;
    md += `**Category:** ${entry.category}\n`;
    if (entry.mood) md += `**Mood:** ${entry.mood}\n`;
    if (entry.summary) md += `\n## Executive Summary\n${entry.summary}\n`;
    if (entry.keyInsights && entry.keyInsights.length > 0) {
      md += `\n## Key Insights\n` + entry.keyInsights.map((i) => `- ${i}`).join('\n') + '\n';
    }
    if (entry.actionItems && entry.actionItems.length > 0) {
      md += `\n## Action Items\n` + entry.actionItems.map((a) => `- [ ] ${a}`).join('\n') + '\n';
    }
    md += `\n## Multi-Turn Dialogue\n\n`;

    entry.messages.forEach((m) => {
      const speaker = m.role === 'user' ? '### 👤 User Reflection' : '### ✨ ReflectAI Companion';
      md += `${speaker}\n*${new Date(m.timestamp).toLocaleTimeString()}*\n\n${m.content}\n\n---\n\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${entry.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'reflection'}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 bg-white border border-gray-200 rounded-lg flex flex-col h-[calc(100vh-140px)] shadow-[0_1px_2px_rgba(0,0,0,0.04)] overflow-hidden">
      {/* Studio Header Toolbar */}
      <div className="p-3.5 sm:p-4 border-b border-gray-200 bg-white space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Editable Title */}
          <div className="flex-1">
            <input
              type="text"
              value={entry.title}
              onChange={(e) =>
                onUpdateEntry({
                  title: e.target.value,
                  updatedAt: new Date().toISOString(),
                })
              }
              placeholder="Title your reflection..."
              className="w-full text-base sm:text-lg font-bold text-gray-900 placeholder:text-gray-400 focus:outline-hidden focus:ring-1 focus:ring-blue-600 rounded px-1 py-0.5"
            />
          </div>

          {/* Action Tools */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Generate Summary Button */}
            <button
              onClick={onOpenSummaryModal}
              title="Generate Executive Summary & Action Items"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium text-xs rounded-md transition cursor-pointer border border-blue-200"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Synthesize &amp; Summary</span>
            </button>

            {/* Brainstorm Button */}
            <button
              onClick={onOpenBrainstormModal}
              title="Brainstorm Lateral Angles & Experiments"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 font-medium text-xs rounded-md transition cursor-pointer border border-purple-200"
            >
              <Brain className="w-3.5 h-3.5" />
              <span>Brainstorm</span>
            </button>

            {/* Export Markdown */}
            <button
              onClick={handleExportMarkdown}
              title="Export as Markdown Document"
              className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-md transition cursor-pointer border border-gray-200"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Sub-toolbar: Category, Mood, and Sync Status */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-gray-100 text-xs text-gray-600">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Category Selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-gray-400 text-[11px] font-medium">Category:</span>
              <select
                value={entry.category}
                onChange={(e) =>
                  onUpdateEntry({
                    category: e.target.value as JournalCategory,
                    updatedAt: new Date().toISOString(),
                  })
                }
                className="bg-gray-50 border border-gray-200 rounded px-2 py-0.5 text-xs text-gray-800 font-medium focus:ring-1 focus:ring-blue-600 focus:outline-hidden cursor-pointer"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Mood Selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-gray-400 text-[11px] font-medium">Mood:</span>
              <select
                value={entry.mood || 'Thoughtful'}
                onChange={(e) =>
                  onUpdateEntry({
                    mood: e.target.value as JournalMood,
                    updatedAt: new Date().toISOString(),
                  })
                }
                className="bg-gray-50 border border-gray-200 rounded px-2 py-0.5 text-xs text-gray-800 font-medium focus:ring-1 focus:ring-blue-600 focus:outline-hidden cursor-pointer"
              >
                {MOODS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-gray-400">
            <span className="flex items-center gap-1 text-emerald-600 font-medium">
              <CheckCircle2 className="w-3 h-3" />
              <span>Firestore Saved</span>
            </span>
            <span>•</span>
            <span>{entry.messages.length} exchanges</span>
          </div>
        </div>
      </div>

      {/* Conversation Thread / Dialogue Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-white">
        {entry.messages.length === 0 ? (
          /* Empty State / Prompt Starters */
          <div className="h-full flex flex-col items-center justify-center text-center max-w-xl mx-auto py-8">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 shadow-xs">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-gray-900">
              Start Your Multi-Turn Reflection
            </h3>
            <p className="text-xs text-gray-600 mt-1 max-w-md leading-relaxed">
              Write freely about your day, a complex problem, or a raw thought. Gemini 3.6 Flash will converse, analyze patterns, and help you gain clarity.
            </p>

            {/* Prompt Starter Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-6 w-full text-left">
              {PROMPT_STARTERS.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(item.prompt)}
                  className="p-3 bg-gray-50 hover:bg-blue-50/70 border border-gray-200 hover:border-blue-200 rounded-lg text-xs transition cursor-pointer text-left space-y-1 group"
                >
                  <div className="font-semibold text-gray-900 group-hover:text-blue-700 flex items-center justify-between">
                    <span>{item.title}</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-blue-600" />
                  </div>
                  <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed">
                    {item.prompt}
                  </p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Render Messages */
          <div className="space-y-6 max-w-3xl mx-auto">
            {entry.messages.map((msg, idx) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id || idx}
                  className={`flex gap-3 text-xs leading-relaxed ${
                    isUser ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  {/* Avatar Icon */}
                  <div
                    className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-xs font-bold ${
                      isUser
                        ? 'bg-blue-600 text-white'
                        : 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                    }`}
                  >
                    {isUser ? 'U' : <Sparkles className="w-3.5 h-3.5" />}
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={`max-w-[85%] sm:max-w-[78%] rounded-xl p-4 shadow-xs relative group ${
                      isUser
                        ? 'bg-blue-600 text-white rounded-tr-none'
                        : 'bg-[#F9FAFB] text-gray-900 border border-gray-200 rounded-tl-none'
                    }`}
                  >
                    {/* Header: Name & Time */}
                    <div
                      className={`flex items-center justify-between gap-4 mb-1.5 text-[10px] ${
                        isUser ? 'text-blue-200' : 'text-gray-400'
                      }`}
                    >
                      <span className="font-semibold">
                        {isUser ? 'You' : 'ReflectAI (Gemini 3.6 Flash)'}
                      </span>
                      <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    {/* Content */}
                    {isUser ? (
                      <div className="whitespace-pre-wrap font-sans text-xs sm:text-[13px] leading-relaxed">
                        {msg.content}
                      </div>
                    ) : (
                      <div className="markdown-body space-y-2 text-xs sm:text-[13px] leading-relaxed text-gray-800">
                        <Markdown>{msg.content}</Markdown>
                      </div>
                    )}

                    {/* Action Bar inside Message */}
                    {!isUser && (
                      <div className="mt-3 pt-2 border-t border-gray-200/60 flex items-center justify-between text-[11px] text-gray-500">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleCopyMessage(msg.content, idx)}
                            className="flex items-center gap-1 hover:text-gray-900 transition cursor-pointer"
                          >
                            {copiedIndex === idx ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span className="text-emerald-600">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3 text-gray-400" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Generating Indicator */}
            {isGenerating && (
              <div className="flex gap-3 text-xs leading-relaxed max-w-3xl mx-auto">
                <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200 flex items-center justify-center text-xs">
                  <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                </div>
                <div className="bg-[#F9FAFB] border border-gray-200 rounded-xl rounded-tl-none p-4 shadow-xs text-gray-600 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-2 h-2 rounded-full bg-blue-600 animate-bounce"></span>
                    <span className="inline-block w-2 h-2 rounded-full bg-blue-600 animate-bounce [animation-delay:0.2s]"></span>
                    <span className="inline-block w-2 h-2 rounded-full bg-blue-600 animate-bounce [animation-delay:0.4s]"></span>
                    <span className="text-[11px] font-medium text-gray-500 ml-1">
                      Gemini 3.6 Flash is synthesizing reflection...
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Error Banner */}
      {errorBanner && (
        <div className="px-4 py-2 bg-red-50 border-t border-red-200 text-xs text-red-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorBanner}</span>
          </div>
          <button
            onClick={() => setErrorBanner(null)}
            className="text-red-500 hover:text-red-800 text-[11px] font-medium"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Quick Context Prompt Chips */}
      {entry.messages.length > 0 && (
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 flex items-center gap-1.5 overflow-x-auto text-[11px] no-scrollbar">
          <span className="text-gray-400 shrink-0 font-medium">Quick Prompts:</span>
          {QUICK_ACTIONS.map((action, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(action)}
              disabled={isGenerating}
              className="px-2.5 py-1 bg-white hover:bg-blue-50 text-gray-700 hover:text-blue-700 border border-gray-200 hover:border-blue-200 rounded-full shrink-0 transition cursor-pointer disabled:opacity-50"
            >
              {action}
            </button>
          ))}
        </div>
      )}

      {/* Input Console */}
      <div className="p-3 sm:p-4 bg-white border-t border-gray-200">
        <div className="relative flex items-end gap-2 max-w-3xl mx-auto">
          <div className="relative flex-1">
            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={2}
              placeholder="Write your reflection or question (Press Enter to send, Shift+Enter for new line)..."
              disabled={isGenerating}
              className="w-full p-3 pr-10 text-xs sm:text-sm rounded-lg border border-gray-300 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-transparent font-sans resize-none disabled:bg-gray-50"
            />
          </div>

          <button
            onClick={() => handleSendMessage()}
            disabled={!inputText.trim() || isGenerating}
            className={`h-11 px-4 rounded-lg flex items-center justify-center font-medium text-xs text-white transition shadow-xs cursor-pointer shrink-0 ${
              !inputText.trim() || isGenerating
                ? 'bg-blue-300 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isGenerating ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                <Send className="w-4 h-4 mr-1.5" />
                <span>Reflect</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
