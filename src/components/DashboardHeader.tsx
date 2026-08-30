import React, { useState } from 'react';
import {
  Sparkles,
  Plus,
  LogOut,
  User as UserIcon,
  BarChart3,
  Cloud,
  ChevronDown,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';
import { logOut } from '../lib/firebase';

interface DashboardHeaderProps {
  user: FirebaseUser;
  onNewEntry: () => void;
  onOpenStats: () => void;
  entriesCount: number;
}

export function DashboardHeader({
  user,
  onNewEntry,
  onOpenStats,
  entriesCount,
}: DashboardHeaderProps) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await logOut();
    } catch (err) {
      console.error('Sign out error:', err);
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <header className="border-b border-gray-200 bg-white sticky top-0 z-30 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base text-gray-900 tracking-tight">ReflectAI</span>
              <span className="hidden sm:inline-flex text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100">
                Gemini 3.6 Flash
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span className="hidden sm:inline">Firestore Live Sync</span>
              <span className="hidden md:inline text-gray-300">|</span>
              <span className="text-gray-500 font-medium">{entriesCount} Saved {entriesCount === 1 ? 'Entry' : 'Entries'}</span>
            </div>
          </div>
        </div>

        {/* Right: Actions & User Profile */}
        <div className="flex items-center gap-2.5">
          {/* New Reflection Button */}
          <button
            onClick={onNewEntry}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-md transition shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>New Reflection</span>
          </button>

          {/* Stats Button */}
          <button
            onClick={onOpenStats}
            title="View Reflection Analytics"
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 font-medium text-xs rounded-md transition cursor-pointer"
          >
            <BarChart3 className="w-3.5 h-3.5 text-gray-500" />
            <span className="hidden sm:inline">Insights</span>
          </button>

          {/* User Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 p-1.5 pl-2 pr-2.5 rounded-md hover:bg-gray-100 border border-transparent hover:border-gray-200 transition cursor-pointer text-left"
            >
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User Avatar'}
                  className="w-7 h-7 rounded-full object-cover border border-gray-200"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs">
                  {user.displayName ? user.displayName.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
              <div className="hidden md:block">
                <div className="text-xs font-semibold text-gray-900 leading-tight">
                  {user.displayName || user.email?.split('@')[0] || 'User'}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </button>

            {/* Profile Dropdown Menu */}
            {showProfileMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowProfileMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg border border-gray-200 shadow-lg py-2 z-50 text-xs">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <div className="font-semibold text-gray-900 text-xs truncate">
                      {user.displayName || 'Authenticated User'}
                    </div>
                    <div className="text-[11px] text-gray-500 truncate mt-0.5">{user.email}</div>
                    <div className="flex items-center gap-1 mt-2 text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-medium">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      <span>Owner-Bound UID: {user.uid.slice(0, 8)}...</span>
                    </div>
                  </div>

                  <div className="px-2 py-1">
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        onOpenStats();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-md transition text-left cursor-pointer"
                    >
                      <BarChart3 className="w-4 h-4 text-gray-400" />
                      <span>Reflection History &amp; Stats</span>
                    </button>
                  </div>

                  <div className="border-t border-gray-100 px-2 pt-1">
                    <button
                      onClick={handleSignOut}
                      disabled={signingOut}
                      className="w-full flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-md transition text-left cursor-pointer disabled:opacity-50"
                    >
                      <LogOut className="w-4 h-4 text-red-500" />
                      <span>{signingOut ? 'Signing out...' : 'Sign Out'}</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
