'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import UserAvatar from '@/components/UserAvatar';
import { getUserDisplayName } from '@/lib/userAvatar';
import toast from 'react-hot-toast';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id: string;
    first_name?: string | null;
    last_name?: string | null;
    username?: string | null;
    email?: string | null;
    profile_image_url?: string | null;
    displayName?: string;
    nickname?: string;
    isContact?: boolean;
  };
  currentUserId?: string | null;
}

export default function UserProfileModal({ isOpen, onClose, user, currentUserId }: UserProfileModalProps) {
  const router = useRouter();
  const [isContact, setIsContact] = useState<boolean>(user.isContact || false);
  const [contactId, setContactId] = useState<string | null>(null);
  const [contactNickname, setContactNickname] = useState<string>('');
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [editingNickname, setEditingNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [creatingContact, setCreatingContact] = useState(false);
  const [updatingContact, setUpdatingContact] = useState(false);
  const [removingContact, setRemovingContact] = useState(false);

  useEffect(() => {
    if (!isOpen || !user.id) return;

    // Check if current user has this user as a contact
    const checkIfContact = async () => {
      if (!currentUserId || currentUserId === user.id) {
        setIsContact(false);
        setContactId(null);
        setContactNickname('');
        return;
      }

      try {
        const response = await axios.get(`${API_URL}/contacts?userId=${currentUserId}`);
        const contacts = response.data || [];
        const foundContact = contacts.find((contact: any) => contact.contact_user_id === user.id);
        if (foundContact) {
          setIsContact(true);
          setContactId(foundContact.id);
          setContactNickname(foundContact.nickname || '');
          setEditingNickname(foundContact.nickname || '');
        } else {
          setIsContact(false);
          setContactId(null);
          setContactNickname('');
        }
      } catch (error) {
        console.error('Error checking contact status:', error);
        setIsContact(false);
        setContactId(null);
        setContactNickname('');
      }
    };

    checkIfContact();
  }, [isOpen, user.id, currentUserId]);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const handlePay = () => {
    if (user.username) {
      onClose();
      router.push(`/pay?to=${encodeURIComponent(`@${user.username}`)}`);
    } else {
      toast.error('User does not have a username');
    }
  };

  const handleRequest = () => {
    if (user.username) {
      onClose();
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

    // Confirm deletion
    if (!confirm('Are you sure you want to remove this contact?')) {
      return;
    }

    setRemovingContact(true);
    try {
      await axios.delete(`${API_URL}/contacts/${contactId}`, {
        params: { userId: currentUserId },
      });

      // Update state to reflect removal - clear all contact-related state
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

  if (!isOpen) return null;

  // Use contactNickname if available (from current user's perspective), otherwise use user's own nickname or display name
  const displayName = contactNickname || user.nickname || getUserDisplayName(
    user.first_name,
    user.last_name,
    user.username,
    user.email
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        className="relative bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 p-8"
        onClick={(e) => e.stopPropagation()}
        style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Profile Content */}
        <div className="flex flex-col items-center">
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
          <h2 className="text-2xl font-bold text-black mb-2 text-center">
            {displayName}
          </h2>

          {/* Handle */}
          {user.username && (
            <div className="text-sm text-gray-600 mb-6">
              <span>@{user.username}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="w-full space-y-3">
            {/* Pay Button */}
            <button
              onClick={handlePay}
              disabled={loading || !user.username}
              className="w-full px-4 py-3 bg-gray-200 text-black rounded-full hover:bg-gray-300 transition-colors font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              Pay
            </button>

            {/* Request Button */}
            <button
              onClick={handleRequest}
              disabled={loading || !user.username}
              className="w-full px-4 py-3 bg-gray-200 text-black rounded-full hover:bg-gray-300 transition-colors font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Request
            </button>

            {/* Create/Edit Contact Section */}
            {currentUserId && currentUserId !== user.id && (
              <>
                {!isContact ? (
                  /* Create Contact Button */
                  <button
                    onClick={handleCreateContact}
                    disabled={creatingContact}
                    className="w-full px-4 py-3 bg-gray-200 text-black rounded-full hover:bg-gray-300 transition-colors font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                        Add as contact
                      </>
                    )}
                  </button>
                ) : isEditingContact ? (
                  /* Edit Contact Form */
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={editingNickname}
                      onChange={(e) => setEditingNickname(e.target.value)}
                      placeholder="Nickname (optional)"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-black transition-all bg-white text-black placeholder-gray-400 text-sm"
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
                        className="flex-1 px-4 py-2 bg-gray-200 text-black rounded-full hover:bg-gray-300 transition-colors font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
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
                      className="w-full px-4 py-2 text-red-600 border border-red-600 rounded-full hover:bg-red-50 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {removingContact ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                          <span>Removing...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Remove
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  /* Edit Contact Button */
                  <button
                    onClick={handleEditContact}
                    className="w-full px-4 py-3 bg-gray-200 text-black rounded-full hover:bg-gray-300 transition-colors font-semibold text-sm flex items-center justify-center gap-2"
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
        </div>
      </div>
    </div>
  );
}


