'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import UserAvatar from '@/components/UserAvatar';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function PublicProfilePage() {
  const router = useRouter();
  const params = useParams();
  const username = params?.username as string;
  
  const [user, setUser] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Check if current user is logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setCurrentUser(session.user);
        }
      } catch (error) {
        console.error('Error checking auth:', error);
      } finally {
        setCheckingAuth(false);
      }
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setCurrentUser(session.user);
      } else {
        setCurrentUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Fetch user profile by username
  useEffect(() => {
    if (!username) return;

    const fetchUser = async () => {
      try {
        setLoading(true);
        // Remove @ if present
        const cleanUsername = username.replace(/^@+/, '');
        
        // Search for user by username
        const response = await axios.get(`${API_URL}/users/search`, {
          params: { q: cleanUsername },
          timeout: 5000
        });

        const foundUser = response.data.find((u: any) => 
          u.username?.toLowerCase() === cleanUsername.toLowerCase()
        );

        if (foundUser) {
          setUser(foundUser);
        } else {
          // User not found - show error state
          setUser(null);
        }
      } catch (error: any) {
        console.error('Error fetching user:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [username]);

  const handleSignIn = () => {
    // Redirect to login with return URL
    const returnUrl = encodeURIComponent(`/${username}`);
    router.push(`/login?redirect=${returnUrl}`);
  };

  const handleGetBlockbook = () => {
    // Redirect to signup with return URL
    const returnUrl = encodeURIComponent(`/${username}`);
    router.push(`/signup?redirect=${returnUrl}`);
  };

  const handlePayOrRequest = () => {
    if (!user?.username) return;
    
    // Show modal or navigate to pay/request page
    // For now, navigate to pay page
    router.push(`/pay?to=${encodeURIComponent(`@${user.username}`)}`);
  };

  if (loading || checkingAuth) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center px-4">
          <h2 className="text-2xl font-bold text-black mb-4">User not found</h2>
          <p className="text-gray-600 mb-6">This user doesn't exist or their profile is private.</p>
          <Link href="/feed" className="text-black font-medium hover:underline">
            Go to feed
          </Link>
        </div>
      </div>
    );
  }

  const displayName = user.first_name && user.last_name
    ? `${user.first_name} ${user.last_name}`
    : user.first_name || user.last_name || user.username || 'User';

  return (
    <div className="min-h-screen bg-white">
      <main className="flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-md">
          <div className="bg-white p-8 sm:p-10">
            {/* Logo */}
            <div className="mb-6 bg-white">
              <Link href="/feed" className="inline-flex items-center gap-3 bg-white">
                <img 
                  src="/applogo.png" 
                  alt="Blockbook" 
                  className="w-16 h-16 object-contain bg-white"
                  style={{ backgroundColor: '#ffffff' }}
                />
                <h1 className="text-2xl font-bold text-black" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', letterSpacing: '-0.02em' }}>blockbook</h1>
              </Link>
            </div>

            {/* Profile Content */}
            <div className="text-center">
              {/* Profile Avatar */}
              <div className="mb-6 flex justify-center">
                <UserAvatar
                  userId={user.id}
                  firstName={user.first_name}
                  lastName={user.last_name}
                  username={user.username}
                  email={user.email}
                  profileImageUrl={user.profile_image_url}
                  size="xl"
                />
              </div>

              {/* User Name */}
              <h2 className="text-3xl font-bold text-black mb-2">
                {displayName}
              </h2>

              {/* Username */}
              {user.username && (
                <p className="text-sm text-gray-600 mb-8">
                  @{user.username}
                </p>
              )}

              {/* Call to Action Section */}
              {!currentUser ? (
                <>
                  {/* Sign in prompt */}
                  <div className="mb-8">
                    <h3 className="text-3xl font-bold text-black mb-2">
                      Sign in to pay this person
                    </h3>
                    <p className="text-gray-600 text-sm mt-2">
                      Or create your Blockbook account
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    <button
                      onClick={handleSignIn}
                      className="w-full px-4 py-3 bg-gray-200 text-black rounded-full hover:bg-gray-300 transition-colors font-semibold text-sm"
                    >
                      Sign in
                    </button>
                    <button
                      onClick={handleGetBlockbook}
                      className="w-full px-4 py-3 bg-white text-black border border-gray-300 rounded-full hover:bg-gray-50 transition-colors font-semibold text-sm flex items-center justify-center gap-2"
                    >
                      <img 
                        src="/applogo.png" 
                        alt="Blockbook" 
                        className="w-5 h-5 object-contain"
                      />
                      Get Blockbook
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* Pay or Request Button (if logged in) */}
                  <button
                    onClick={handlePayOrRequest}
                    className="w-full px-4 py-3 bg-gray-200 text-black rounded-full hover:bg-gray-300 transition-colors font-semibold text-sm flex items-center justify-center gap-2"
                  >
                    <img 
                      src="/applogo.png" 
                      alt="Blockbook" 
                      className="w-5 h-5 object-contain"
                    />
                    Pay or Request
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}


