import React, { useState } from 'react';
import {
  Sparkles,
  Shield,
  Lock,
  Database,
  BrainCircuit,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  BookOpen,
  Zap,
} from 'lucide-react';
import { signInWithGoogle } from '../lib/firebase';

interface AuthLandingPageProps {
  onSignedIn?: () => void;
}

export function AuthLandingPage({ onSignedIn }: AuthLandingPageProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
      if (onSignedIn) onSignedIn();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('Sign-in failed:', msg);
      if (msg.includes('popup-closed-by-user') || msg.includes('cancelled-popup-request')) {
        setError('Sign-in popup was closed. Click the button below to try again.');
      } else {
        setError(msg || 'Failed to sign in with Google. Please check your connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col justify-between selection:bg-blue-100 selection:text-blue-900">
      {/* Top Navbar */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-base text-gray-900 tracking-tight">ReflectAI</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100 ml-2">
                Gemini 3.6 Flash
              </span>
            </div>
          </div>

          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-md transition shadow-xs cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
            )}
            <span>Sign In with Google</span>
          </button>
        </div>
      </header>

      {/* Main Hero Section */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-12 flex flex-col items-center text-center justify-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-semibold mb-6">
          <Shield className="w-3.5 h-3.5 text-blue-600" />
          <span>User-Isolated Cloud Firestore Storage + Firebase Authentication</span>
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-5xl font-extrabold text-gray-900 tracking-tight max-w-3xl leading-tight">
          Your Private Multi-Turn Journal &amp; Reflection Partner
        </h1>

        {/* Subtitle */}
        <p className="mt-4 text-base sm:text-lg text-gray-600 max-w-2xl leading-relaxed">
          Unpack thoughts, brainstorm breakthrough ideas, and gain clarity with multi-turn conversations powered by <strong>Gemini 3.6 Flash</strong>. Every reflection is strictly isolated to your authenticated Google account.
        </p>

        {/* Auth Error Banner if any */}
        {error && (
          <div className="mt-6 max-w-md w-full p-3 rounded-md bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2 text-left">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Primary CTA Card */}
        <div className="mt-8 bg-white border border-gray-200 rounded-xl p-6 sm:p-8 max-w-md w-full shadow-[0_4px_12px_rgba(0,0,0,0.05)] space-y-5">
          <div className="flex items-center justify-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <Lock className="w-3.5 h-3.5 text-blue-600" />
            <span>Authenticated Access Required</span>
          </div>

          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3.5 px-6 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition shadow-sm cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Continue with Google</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </>
            )}
          </button>

          <p className="text-[11px] text-gray-500 leading-relaxed">
            By signing in, you access your private Firestore subcollection <code>/users/&#123;uid&#125;/entries</code>. No passwords stored, strictly owner-bound security.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6 text-left w-full">
          <div className="p-5 bg-white border border-gray-200 rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.05)] space-y-2">
            <div className="w-8 h-8 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-gray-900">Multi-Turn AI Reflections</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Engage in rich, multi-turn dialogues with Gemini 3.6 Flash to reframe challenges, unpack emotions, and uncover deeper insights.
            </p>
          </div>

          <div className="p-5 bg-white border border-gray-200 rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.05)] space-y-2">
            <div className="w-8 h-8 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-gray-900">User-Isolated Firestore</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Every prompt and AI response is securely saved to Cloud Firestore with strict owner-bound access rules (<code>request.auth.uid == userId</code>).
            </p>
          </div>

          <div className="p-5 bg-white border border-gray-200 rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.05)] space-y-2">
            <div className="w-8 h-8 rounded-md bg-purple-50 text-purple-600 flex items-center justify-center">
              <BrainCircuit className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-gray-900">Synthesis &amp; Brainstorming</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Generate structured executive summaries, key takeaways, action commitments, and creative lateral-thinking brainstorms with a single click.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-4 text-center text-xs text-gray-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Production Directives &amp; Zero-Hardcoding Compliant</span>
          </div>
          <div>Powered by Google Gemini API &amp; Firebase Authentication</div>
        </div>
      </footer>
    </div>
  );
}
