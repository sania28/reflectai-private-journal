import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import {
  auth,
  subscribeToUserEntries,
  saveJournalEntry,
  deleteJournalEntry,
} from './lib/firebase';
import { JournalEntry, ReflectionAnalysis } from './types';
import { AuthLandingPage } from './components/AuthLandingPage';
import { DashboardHeader } from './components/DashboardHeader';
import { EntriesSidebar } from './components/EntriesSidebar';
import { ReflectionStudio } from './components/ReflectionStudio';
import { SummaryInsightsModal } from './components/SummaryInsightsModal';
import { BrainstormModal } from './components/BrainstormModal';
import { StatsModal } from './components/StatsModal';
import { Sparkles } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);

  // Modals
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [isBrainstormModalOpen, setIsBrainstormModalOpen] = useState(false);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);

  // 1. Firebase Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. Real-time Firestore entries subscription for the authenticated user
  useEffect(() => {
    if (!user) {
      setEntries([]);
      setSelectedEntryId(null);
      return;
    }

    const unsubscribe = subscribeToUserEntries(
      user.uid,
      (fetchedEntries) => {
        setEntries(fetchedEntries);
        // If no entry is currently selected and we have entries, select the newest
        setSelectedEntryId((prevId) => {
          if (prevId && fetchedEntries.some((e) => e.id === prevId)) {
            return prevId;
          }
          return fetchedEntries.length > 0 ? fetchedEntries[0].id : null;
        });
      },
      (error) => {
        console.error('Firestore subscription error:', error);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Create a brand new reflection entry
  const handleCreateNewEntry = async () => {
    if (!user) return;

    const newId = 'entry-' + Date.now();
    const newEntry: JournalEntry = {
      id: newId,
      userId: user.uid,
      title: 'New Reflection',
      category: 'Personal Reflection',
      mood: 'Thoughtful',
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setSelectedEntryId(newId);

    // Persist immediately to Firestore
    try {
      await saveJournalEntry(user.uid, newEntry);
    } catch (err) {
      console.error('Error creating new entry:', err);
    }
  };

  // Update an existing entry
  const handleUpdateEntry = async (updatedFields: Partial<JournalEntry>) => {
    if (!user || !selectedEntryId) return;

    const currentEntry = entries.find((e) => e.id === selectedEntryId) || {
      id: selectedEntryId,
      userId: user.uid,
      title: 'New Reflection',
      category: 'Personal Reflection',
      mood: 'Thoughtful',
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const mergedEntry: JournalEntry = {
      ...currentEntry,
      ...updatedFields,
      updatedAt: new Date().toISOString(),
    };

    // Optimistically update local entries state
    setEntries((prev) => {
      const exists = prev.some((e) => e.id === mergedEntry.id);
      if (exists) {
        return prev.map((e) => (e.id === mergedEntry.id ? mergedEntry : e));
      }
      return [mergedEntry, ...prev];
    });

    // Write directly to user-isolated Firestore collection
    try {
      await saveJournalEntry(user.uid, mergedEntry);
    } catch (err) {
      console.error('Failed to sync entry to Firestore:', err);
    }
  };

  // Delete an entry
  const handleDeleteEntry = async (entryId: string) => {
    if (!user) return;

    try {
      await deleteJournalEntry(user.uid, entryId);
      if (selectedEntryId === entryId) {
        const remaining = entries.filter((e) => e.id !== entryId);
        setSelectedEntryId(remaining.length > 0 ? remaining[0].id : null);
      }
    } catch (err) {
      console.error('Failed to delete entry:', err);
    }
  };

  // Save analysis from summary modal
  const handleSaveAnalysis = (analysis: ReflectionAnalysis) => {
    handleUpdateEntry({
      summary: analysis.summary,
      keyInsights: analysis.keyInsights,
      actionItems: analysis.actionItems,
      tags: analysis.suggestedTags,
    });
  };

  // Append brainstorm text into conversation
  const handleAppendBrainstormConcept = (conceptText: string) => {
    if (!selectedEntry) return;
    const userMsg = {
      id: 'msg-' + Date.now() + '-user',
      role: 'user' as const,
      content: conceptText,
      timestamp: new Date().toISOString(),
    };
    handleUpdateEntry({
      messages: [...selectedEntry.messages, userMsg],
    });
  };

  // Loading spinner during initial auth check
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex flex-col items-center justify-center space-y-3">
        <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs animate-pulse">
          <Sparkles className="w-5 h-5" />
        </div>
        <div className="text-xs font-semibold text-gray-700">
          Initializing ReflectAI Workspace...
        </div>
      </div>
    );
  }

  // If user is not authenticated, show the Auth Landing Page
  if (!user) {
    return <AuthLandingPage onSignedIn={() => {}} />;
  }

  // Active selected entry (or create fallback if empty)
  const selectedEntry = entries.find((e) => e.id === selectedEntryId) || {
    id: selectedEntryId || 'draft-new',
    userId: user.uid,
    title: 'New Reflection',
    category: 'Personal Reflection',
    mood: 'Thoughtful',
    messages: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-gray-900 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Top Authenticated Dashboard Header */}
      <DashboardHeader
        user={user}
        onNewEntry={handleCreateNewEntry}
        onOpenStats={() => setIsStatsModalOpen(true)}
        entriesCount={entries.length}
      />

      {/* Main Workspace Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 flex flex-col lg:flex-row gap-4 sm:gap-6 items-start">
        {/* Left: Journal Entries & History Sidebar */}
        <EntriesSidebar
          entries={entries}
          selectedEntryId={selectedEntry.id}
          onSelectEntry={(entry) => setSelectedEntryId(entry.id)}
          onDeleteEntry={handleDeleteEntry}
          onNewEntry={handleCreateNewEntry}
        />

        {/* Right / Center: Active Multi-Turn Reflection Studio */}
        <ReflectionStudio
          entry={selectedEntry}
          onUpdateEntry={handleUpdateEntry}
          onOpenSummaryModal={() => setIsSummaryModalOpen(true)}
          onOpenBrainstormModal={() => setIsBrainstormModalOpen(true)}
        />
      </main>

      {/* Summary & Insights Modal */}
      <SummaryInsightsModal
        isOpen={isSummaryModalOpen}
        onClose={() => setIsSummaryModalOpen(false)}
        entry={selectedEntry}
        onSaveAnalysis={handleSaveAnalysis}
      />

      {/* Brainstorming Modal */}
      <BrainstormModal
        isOpen={isBrainstormModalOpen}
        onClose={() => setIsBrainstormModalOpen(false)}
        entry={selectedEntry}
        onAddConceptToReflection={handleAppendBrainstormConcept}
      />

      {/* User Stats & History Modal */}
      <StatsModal
        isOpen={isStatsModalOpen}
        onClose={() => setIsStatsModalOpen(false)}
        entries={entries}
        userEmail={user.email}
      />
    </div>
  );
}
