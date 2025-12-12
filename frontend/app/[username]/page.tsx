'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import UserAvatar from '@/components/UserAvatar';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function PublicProfilePage() {
  const router = useRouter();
  const params = useParams();
  const username = params?.username as string;
  
  const [user, setUser] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isContact, setIsContact] = useState(false);
  const [checkingContact, setCheckingContact] = useState(false);
  const [addingContact, setAddingContact] = useState(false);

  // Check if current user is logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setCurrentUser(session.user);
          setCurrentUserId(session.user.id);
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
        setCurrentUserId(session.user.id);
      } else {
        setCurrentUser(null);
        setCurrentUserId(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Check if current user already has this user as a contact
  useEffect(() => {
    const checkContact = async () => {
      if (!currentUserId || !user?.id || currentUserId === user.id) {
        setIsContact(false);
        return;
      }

      try {
        setCheckingContact(true);
        const response = await axios.get(`${API_URL}/contacts`, {
          params: { userId: currentUserId }
        });

        const contactExists = response.data.some(
          (contact: any) => contact.contact_user_id === user.id
        );
        setIsContact(contactExists);
      } catch (error) {
        console.error('Error checking contact:', error);
        setIsContact(false);
      } finally {
        setCheckingContact(false);
      }
    };

    if (currentUserId && user?.id) {
      checkContact();
    }
  }, [currentUserId, user?.id]);

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

  const handlePay = () => {
    if (!user?.username) return;
    router.push(`/pay?to=${encodeURIComponent(`@${user.username}`)}`);
  };

  const handleRequest = () => {
    if (!user?.username) return;
    router.push(`/request?to=${encodeURIComponent(`@${user.username}`)}`);
  };

  const handleCreateContact = async () => {
    if (!currentUserId || !user?.id || currentUserId === user.id) return;

    try {
      setAddingContact(true);
      toast.loading('Adding contact...');

      const response = await axios.post(`${API_URL}/contacts`, {
        userId: currentUserId,
        contactUserId: user.id
      });

      toast.dismiss();
      toast.success('Contact added');
      setIsContact(true);
    } catch (error: any) {
      toast.dismiss();
      console.error('Error adding contact:', error);
      
      const errorMessage = error.response?.data?.error || error.message || 'Failed to add contact';
      
      // If it's a duplicate contact error, just mark as contact
      if (error.response?.data?.code === '23505' || errorMessage.includes('already exists')) {
        setIsContact(true);
        toast.success('Contact already exists');
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setAddingContact(false);
    }
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
                  className="w-16 h-16 object-contain"
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
                  {/* Action Buttons */}
                  <div className="space-y-3 mt-8">
                    <button
                      onClick={handleSignIn}
                      className="w-full px-4 py-3 bg-gray-200 text-black rounded-full hover:bg-gray-300 transition-colors font-semibold text-sm"
                    >
                      Sign in
                    </button>
                    <button
                      onClick={handleGetBlockbook}
                      className="w-full px-4 py-3 bg-white text-black border border-gray-300 rounded-full hover:bg-gray-50 transition-colors font-semibold text-sm"
                    >
                      Get Blockbook
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* Pay and Request Buttons (if logged in) */}
                  <div className="space-y-3">
                    <button
                      onClick={handlePay}
                      className="w-full px-4 py-3 bg-gray-200 text-black rounded-full hover:bg-gray-300 transition-colors font-semibold text-sm"
                    >
                      Pay
                    </button>
                    <button
                      onClick={handleRequest}
                      className="w-full px-4 py-3 bg-gray-200 text-black rounded-full hover:bg-gray-300 transition-colors font-semibold text-sm"
                    >
                      Request
                    </button>

                    {/* Create Contact Button (if not already a contact and not viewing own profile) */}
                    {currentUserId !== user?.id && !isContact && (
                      <button
                        onClick={handleCreateContact}
                        disabled={addingContact || checkingContact}
                        className="w-full px-4 py-3 bg-white text-black border border-gray-300 rounded-full hover:bg-gray-50 transition-colors font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {addingContact ? 'Adding...' : 'Create Contact'}
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}



