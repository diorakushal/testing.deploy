'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import UserAvatar from '@/components/UserAvatar';
import { getUserDisplayName } from '@/lib/userAvatar';
import toast from 'react-hot-toast';
import axios from 'axios';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface Transaction {
  id: string;
  type: 'send' | 'request';
  amount: string | number;
  token_symbol: string;
  caption?: string | null;
  created_at: string;
  sender_user_id?: string | null;
  recipient_user_id?: string | null;
  sender_username?: string | null;
  recipient_username?: string | null;
  sender_first_name?: string | null;
  sender_last_name?: string | null;
  recipient_first_name?: string | null;
  recipient_last_name?: string | null;
  isSentByMe?: boolean;
  isReceivedByMe?: boolean;
}

export default function UserProfilePage() {
  const router = useRouter();
  const params = useParams();
  const username = params?.username as string;
  
  const [user, setUser] = useState<any>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserAddress, setCurrentUserAddress] = useState<string | null>(null);
  const [isContact, setIsContact] = useState<boolean>(false);
  const [contactId, setContactId] = useState<string | null>(null);
  const [contactNickname, setContactNickname] = useState<string>('');
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [editingNickname, setEditingNickname] = useState('');
  const [loading, setLoading] = useState(true);
  const [creatingContact, setCreatingContact] = useState(false);
  const [updatingContact, setUpdatingContact] = useState(false);
  const [removingContact, setRemovingContact] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);

  useEffect(() => {
    // Get current user
    const checkCurrentUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setCurrentUserId(session.user.id);
          
          // Get user's wallet address if available
          const { data: profile } = await supabase
            .from('users')
            .select('wallet_address')
            .eq('id', session.user.id)
            .single();
          
          if (profile?.wallet_address) {
            setCurrentUserAddress(profile.wallet_address);
          }
        }
      } catch (error) {
        console.error('Error checking current user:', error);
      }
    };

    checkCurrentUser();
  }, []);

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
          
          // Check if current user has this user as a contact
          if (currentUserId && currentUserId !== foundUser.id) {
            try {
              const contactsResponse = await axios.get(`${API_URL}/contacts?userId=${currentUserId}`);
              const contacts = contactsResponse.data || [];
              const foundContact = contacts.find((contact: any) => contact.contact_user_id === foundUser.id);
              if (foundContact) {
                setIsContact(true);
                setContactId(foundContact.id);
                setContactNickname(foundContact.nickname || '');
                setEditingNickname(foundContact.nickname || '');
              }
            } catch (error) {
              console.error('Error checking contact status:', error);
            }
          }
        } else {
          toast.error('User not found');
          router.push('/feed');
        }
      } catch (error: any) {
        console.error('Error fetching user:', error);
        toast.error('Failed to load user profile');
        router.push('/feed');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [username, currentUserId, router]);

  useEffect(() => {
    if (!user?.id || !currentUserId) return;

    const fetchTransactions = async () => {
      setLoadingTransactions(true);
      try {
        // Fetch payment sends between current user and profile user
        const [sendsFromMe, sendsToMe, requestsResponse] = await Promise.all([
          axios.get(`${API_URL}/payment-sends`, {
            params: {
              sender_user_id: currentUserId,
              recipient_user_id: user.id,
            },
            timeout: 10000
          }).catch(() => ({ data: [] })),
          axios.get(`${API_URL}/payment-sends`, {
            params: {
              sender_user_id: user.id,
              recipient_user_id: currentUserId,
            },
            timeout: 10000
          }).catch(() => ({ data: [] })),
          axios.get(`${API_URL}/payment-requests`, {
            params: { userId: currentUserId },
            timeout: 10000
          }).catch(() => ({ data: [] })),
        ]);

        const allSends = [
          ...(sendsFromMe.data || []),
          ...(sendsToMe.data || []),
        ];

        // Filter payment requests between these two users
        const allRequests = (requestsResponse.data || []).filter((req: any) => {
          return (
            (req.requester_user_id === currentUserId && req.recipient_user_id === user.id) ||
            (req.requester_user_id === user.id && req.recipient_user_id === currentUserId) ||
            (req.paid_by_user_id === currentUserId && req.requester_user_id === user.id) ||
            (req.paid_by_user_id === user.id && req.requester_user_id === currentUserId)
          );
        });

        // Combine and format transactions
        const formattedTransactions: Transaction[] = [
          ...allSends.map((send: any) => ({
            id: send.id,
            type: 'send' as const,
            amount: send.amount,
            token_symbol: send.token_symbol,
            caption: send.caption,
            created_at: send.created_at || send.sent_at,
            sender_user_id: send.sender_user_id,
            recipient_user_id: send.recipient_user_id,
            sender_username: send.sender_username,
            recipient_username: send.recipient_username,
            sender_first_name: send.sender_first_name,
            sender_last_name: send.sender_last_name,
            recipient_first_name: send.recipient_first_name,
            recipient_last_name: send.recipient_last_name,
            isSentByMe: send.sender_user_id === currentUserId,
            isReceivedByMe: send.recipient_user_id === currentUserId,
          })),
          ...allRequests.map((req: any) => ({
            id: req.id,
            type: 'request' as const,
            amount: req.amount,
            token_symbol: req.token_symbol,
            caption: req.caption,
            created_at: req.created_at,
            sender_user_id: req.paid_by_user_id || req.requester_user_id,
            recipient_user_id: req.recipient_user_id || req.requester_user_id,
            sender_username: req.paid_by_username || req.requester_username,
            recipient_username: req.recipient_username || req.requester_username,
            sender_first_name: req.paid_by_first_name || req.requester_first_name,
            sender_last_name: req.paid_by_last_name || req.requester_last_name,
            recipient_first_name: req.recipient_first_name,
            recipient_last_name: req.recipient_last_name,
            isSentByMe: req.paid_by_user_id === currentUserId,
            isReceivedByMe: req.requester_user_id === currentUserId && req.paid_by_user_id === user.id,
          })),
        ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        setTransactions(formattedTransactions);
      } catch (error) {
        console.error('Error fetching transactions:', error);
      } finally {
        setLoadingTransactions(false);
      }
    };

    fetchTransactions();
  }, [user?.id, currentUserId]);

  const handlePay = () => {
    if (user?.username) {
      router.push(`/pay?to=${encodeURIComponent(`@${user.username}`)}`);
    } else {
      toast.error('User does not have a username');
    }
  };

  const handleRequest = () => {
    if (user?.username) {
      router.push(`/request?to=${encodeURIComponent(`@${user.username}`)}`);
    } else {
      toast.error('User does not have a username');
    }
  };

  const handleCreateContact = async () => {
    if (!currentUserId || currentUserId === user.id) {
      toast.error('Cannot add yourself as a contact');
      return;
    }

    if (isContact) {
      toast.success('This user is already in your contacts');
      return;
    }

    setCreatingContact(true);
    try {
      const response = await axios.post(`${API_URL}/contacts`, {
        userId: currentUserId,
        contactUserId: user.id,
        nickname: null,
      });

      if (response.data) {
        setIsContact(true);
        setContactId(response.data.id);
        setContactNickname(response.data.nickname || '');
        setEditingNickname(response.data.nickname || '');
        toast.success('Contact added successfully');
      }
    } catch (error: any) {
      console.error('Error creating contact:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to add contact';
      toast.error(errorMessage);
    } finally {
      setCreatingContact(false);
    }
  };

  const handleEditContact = () => {
    setIsEditingContact(true);
    setEditingNickname(contactNickname);
  };

  const handleSaveContact = async () => {
    if (!contactId || !currentUserId) return;

    setUpdatingContact(true);
    try {
      const response = await axios.patch(`${API_URL}/contacts/${contactId}`, {
        userId: currentUserId,
        nickname: editingNickname.trim() || null,
      });

      if (response.data) {
        setContactNickname(response.data.nickname || '');
        setIsEditingContact(false);
        toast.success('Contact updated successfully');
      }
    } catch (error: any) {
      console.error('Error updating contact:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to update contact';
      toast.error(errorMessage);
    } finally {
      setUpdatingContact(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditingContact(false);
    setEditingNickname(contactNickname);
  };

  const handleRemoveContact = async () => {
    if (!contactId || !currentUserId) return;

    if (!confirm('Are you sure you want to remove this contact?')) {
      return;
    }

    setRemovingContact(true);
    try {
      await axios.delete(`${API_URL}/contacts/${contactId}`, {
        params: { userId: currentUserId },
      });

      setIsContact(false);
      setContactId(null);
      setContactNickname('');
      setEditingNickname('');
      setIsEditingContact(false);
      toast.success('Contact removed successfully');
    } catch (error: any) {
      console.error('Error removing contact:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to remove contact';
      toast.error(errorMessage);
    } finally {
      setRemovingContact(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return 'just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}d`;
    } else {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = months[date.getMonth()];
      const day = date.getDate();
      const year = date.getFullYear();
      const currentYear = now.getFullYear();
      
      if (year === currentYear) {
        return `${month} ${day}`;
      } else {
        return `${month} ${day}, ${year}`;
      }
    }
  };

  const formatAmount = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return num.toFixed(2);
  };

  const getTransactionDescription = (transaction: Transaction) => {
    if (transaction.type === 'send') {
      if (transaction.isSentByMe) {
        return `You paid ${contactNickname || getUserDisplayName(user.first_name, user.last_name, user.username, user.email)}`;
      } else {
        return `${contactNickname || getUserDisplayName(user.first_name, user.last_name, user.username, user.email)} paid you`;
      }
    } else {
      if (transaction.isReceivedByMe) {
        return `${contactNickname || getUserDisplayName(user.first_name, user.last_name, user.username, user.email)} charged you`;
      } else {
        return `You charged ${contactNickname || getUserDisplayName(user.first_name, user.last_name, user.username, user.email)}`;
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-black mb-4">User not found</h2>
          <Link href="/feed" className="text-gray-600 hover:text-black underline">
            Go back to feed
          </Link>
        </div>
      </div>
    );
  }

  const displayName = contactNickname || user.nickname || getUserDisplayName(
    user.first_name,
    user.last_name,
    user.username,
    user.email
  );

  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        {/* Profile Header */}
        <div className="mb-8">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="mb-6 p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>

          {/* Profile Content */}
          <div className="flex flex-col items-center text-center mb-6">
            {/* Avatar */}
            <div className="mb-4">
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
            <h1 className="text-2xl font-bold text-black mb-2">
              {displayName}
            </h1>

            {/* Handle */}
            {user.username && (
              <div className="text-sm text-gray-600 mb-4">
                <span>@{user.username}</span>
              </div>
            )}

            {/* Pay, Request, and Contact Buttons */}
            <div className="w-full max-w-xs space-y-3 mb-4">
              <button
                onClick={handlePay}
                disabled={!user.username}
                className="w-full px-6 py-3 bg-gray-200 text-black rounded-full hover:bg-gray-300 transition-colors font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                Pay
              </button>
              <button
                onClick={handleRequest}
                disabled={!user.username}
                className="w-full px-6 py-3 bg-gray-200 text-black rounded-full hover:bg-gray-300 transition-colors font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Request
              </button>
              
              {/* Contact Button */}
              {currentUserId && currentUserId !== user.id && (
                <>
                  {!isContact ? (
                    <button
                      onClick={handleCreateContact}
                      disabled={creatingContact}
                      className="w-full px-6 py-3 bg-gray-200 text-black rounded-full hover:bg-gray-300 transition-colors font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {creatingContact ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
                          <span>Adding...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                          </svg>
                          Create Contact
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={handleEditContact}
                      className="w-full px-6 py-3 bg-gray-200 text-black rounded-full hover:bg-gray-300 transition-colors font-semibold text-sm flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit Contact
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Edit Contact Form (shown when editing) */}
            {currentUserId && currentUserId !== user.id && isContact && isEditingContact && (
              <div className="w-full max-w-xs space-y-2 mb-4">
                <input
                  type="text"
                  value={editingNickname}
                  onChange={(e) => setEditingNickname(e.target.value)}
                  placeholder="Nickname (optional)"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black transition-all bg-white text-black placeholder-gray-400 text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSaveContact();
                    } else if (e.key === 'Escape') {
                      handleCancelEdit();
                    }
                  }}
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveContact}
                    disabled={updatingContact || removingContact}
                    className="flex-1 px-4 py-2 bg-gray-200 text-black rounded-full hover:bg-gray-300 transition-colors font-semibold text-sm disabled:opacity-50"
                  >
                    {updatingContact ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    disabled={updatingContact || removingContact}
                    className="flex-1 px-4 py-2 border border-gray-300 text-black rounded-full hover:bg-gray-50 transition-colors font-medium text-sm disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
                <button
                  onClick={handleRemoveContact}
                  disabled={updatingContact || removingContact}
                  className="w-full px-4 py-2 text-red-600 border border-red-600 rounded-full hover:bg-red-50 transition-colors font-medium text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {removingContact ? 'Removing...' : 'Remove Contact'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Transaction Timeline */}
        {currentUserId && currentUserId !== user.id && (
          <div className="border-t border-gray-200 pt-6">
            {/* Transactions List */}
            {loadingTransactions ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto"></div>
                <p className="mt-2 text-gray-600 text-sm">Loading transactions...</p>
              </div>
            ) : transactions.length > 0 ? (
              <div className="space-y-4">
                {transactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-start gap-4 pb-4 border-b border-gray-100 last:border-b-0">
                    {/* Avatar */}
                    <UserAvatar
                      userId={user.id}
                      firstName={user.first_name}
                      lastName={user.last_name}
                      username={user.username}
                      email={user.email}
                      profileImageUrl={user.profile_image_url}
                      size="md"
                    />

                    {/* Transaction Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className="text-sm text-gray-900 font-medium">
                            {getTransactionDescription(transaction)}
                          </p>
                          {transaction.caption && (
                            <p className="text-sm text-gray-600 mt-1">{transaction.caption}</p>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-500">{formatTimeAgo(transaction.created_at)}</span>
                          </div>
                        </div>
                        <div className={`text-base font-semibold ${
                          (transaction.isSentByMe && transaction.type === 'send') || 
                          (transaction.isReceivedByMe && transaction.type === 'request')
                            ? 'text-red-600' 
                            : 'text-green-600'
                        }`}>
                          {(transaction.isSentByMe && transaction.type === 'send') || 
                           (transaction.isReceivedByMe && transaction.type === 'request')
                            ? '-' 
                            : '+'} {formatAmount(transaction.amount)} {transaction.token_symbol}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600 text-sm">No transactions yet</p>
                <p className="text-gray-500 text-xs mt-1">Start by sending a payment or making a request</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}



