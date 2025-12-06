'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import axios from 'axios';
import toast from 'react-hot-toast';
import UserAvatar from '@/components/UserAvatar';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface User {
  id: string;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  profile_image_url?: string | null;
  displayName: string;
  searchText: string;
}

export default function SearchPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'people'>('people');

  useEffect(() => {
    // Get current user ID to filter them out
    const getUserId = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUserId(session.user.id);
        }
      } catch (error) {
        console.error('Error getting user ID:', error);
      }
    };
    getUserId();
  }, []);

  const searchUsers = async (query: string) => {
    const cleanQuery = query.trim().replace(/^@+/, '');
    
    if (!cleanQuery || cleanQuery.length < 1) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    try {
      setSearching(true);
      setHasSearched(true);
      
      const response = await axios.get(`${API_URL}/users/search`, {
        params: { q: cleanQuery, userId: userId },
        timeout: 5000
      });
      
      // Get current user's email to also filter by email
      let currentUserEmail: string | null = null;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        currentUserEmail = session?.user?.email || null;
      } catch (err) {
        console.error('Error getting user email:', err);
      }
      
      // Filter out current user from results (by ID and email to be safe)
      const filtered = response.data.filter((user: User) => {
        if (user.id === userId) return false;
        if (currentUserEmail && user.email === currentUserEmail) return false;
        return true;
      });
      setSearchResults(filtered);
    } catch (error: any) {
      console.error('Error searching users:', error);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.trim().length >= 1) {
      searchTimeoutRef.current = setTimeout(() => {
        searchUsers(searchQuery);
      }, 300);
    } else {
      setSearchResults([]);
      setHasSearched(false);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim().length >= 1) {
      searchUsers(searchQuery);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setHasSearched(false);
  };

  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col items-center">
          {/* Header */}
          <div className="mb-6 w-full max-w-2xl">
            <h1 className="text-2xl font-bold text-black mb-6">Search</h1>
            
            {/* Search Input */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                id="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search"
                className="w-full pl-12 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-black transition-all bg-white text-black placeholder-gray-400"
                autoFocus
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-black transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              {searching && !searchQuery && (
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600"></div>
                </div>
              )}
            </div>
          </div>

          {/* Tabs */}
          {hasSearched && (
            <div className="flex gap-6 mb-4 border-b border-gray-200 w-full max-w-2xl">
              <button
                onClick={() => setActiveTab('people')}
                className={`pb-2 text-sm font-medium transition-colors ${
                  activeTab === 'people'
                    ? 'text-black border-b-2 border-black'
                    : 'text-gray-500 hover:text-black'
                }`}
              >
                People ({searchResults.length})
              </button>
            </div>
          )}

          {/* Search Results */}
          {hasSearched && (
            <div className="w-full max-w-2xl">
              {searching ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-2"></div>
                  <p className="text-gray-600 text-sm">Searching...</p>
                </div>
              ) : searchResults.length > 0 ? (
                <div className="space-y-0">
                  {searchResults.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center gap-3 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => {
                        // Copy username to clipboard and navigate to Pay page
                        if (user.username) {
                          navigator.clipboard.writeText(`@${user.username}`);
                          toast.success(`Username @${user.username} copied! Navigating to Pay...`);
                          setTimeout(() => {
                            router.push(`/pay?to=${encodeURIComponent(`@${user.username}`)}`);
                          }, 500);
                        }
                      }}
                    >
                      {/* Avatar - uses profile_image_url from database */}
                      <UserAvatar
                        userId={user.id}
                        firstName={user.first_name}
                        lastName={user.last_name}
                        username={user.username}
                        email={user.email}
                        profileImageUrl={user.profile_image_url}
                        size="lg"
                      />
                      
                      {/* User Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-black text-base">
                          {user.displayName || user.first_name || 'User'}
                        </h3>
                        {user.username && (
                          <p className="text-sm text-gray-500 mt-0.5">@{user.username}</p>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {/* Load More Button */}
                  {searchResults.length >= 10 && (
                    <div className="text-center pt-4">
                      <button className="px-6 py-2 text-sm text-black border border-gray-300 rounded-full hover:bg-gray-50 transition-colors">
                        Load more
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <p className="text-gray-600">No users found</p>
                  <p className="text-sm text-gray-500 mt-2">Try searching with a different username</p>
                </div>
              )}
            </div>
          )}

          {/* Empty State - Before Search */}
          {!hasSearched && (
            <div className="text-center py-12 w-full max-w-2xl">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <p className="text-gray-600">Start typing to search for users</p>
              <p className="text-sm text-gray-500 mt-2">Search by username</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

