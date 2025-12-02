'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  userProfile: any;
  onUpdate: () => void;
}

export default function SettingsModal({ isOpen, onClose, user, userProfile, onUpdate }: SettingsModalProps) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && userProfile) {
      setFormData({
        firstName: userProfile.first_name || '',
        lastName: userProfile.last_name || '',
        username: userProfile.username || '',
        email: user?.email || '',
      });
    }
  }, [isOpen, userProfile, user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    // Only allow changes to first name and last name
    if (name === 'firstName' || name === 'lastName') {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.firstName.trim()) {
      toast.error('First name is required');
      return;
    }
    if (!formData.lastName.trim()) {
      toast.error('Last name is required');
      return;
    }

    setLoading(true);

    try {
      // Update user profile in users table (only first and last name)
      const { error: profileError } = await supabase
        .from('users')
        .update({
          first_name: formData.firstName.trim(),
          last_name: formData.lastName.trim(),
        })
        .eq('id', user.id);

      if (profileError) {
        // Handle duplicate username
        if (profileError.code === '23505' && profileError.message?.includes('username')) {
          toast.error('This username is already taken');
          setUsernameError('This username is already taken');
          setLoading(false);
          return;
        }
        throw profileError;
      }



      toast.success('Profile updated successfully');
      onUpdate();
      onClose();
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error.message || 'Failed to update profile. Please try again.');
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white max-w-3xl w-full mx-4 overflow-hidden flex flex-col rounded-2xl shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4">
          <h2 className="text-lg font-bold text-black tracking-tight">Settings</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-50 rounded-full transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content - Single column layout, no scrolling */}
        <div className="px-6 pb-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* First Name */}
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-black mb-2">
                First name
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-black transition-all bg-white text-black placeholder-gray-400"
                placeholder="First name"
                required
              />
            </div>

            {/* Last Name */}
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-black mb-2">
                Last name
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-black transition-all bg-white text-black placeholder-gray-400"
                placeholder="Last name"
                required
              />
            </div>

            {/* Username - Read only */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-black mb-2">
                Username
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none">
                  @
                </span>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  readOnly
                  className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                  placeholder="username"
                />
              </div>
            </div>

            {/* Email - Read only */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-black mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                readOnly
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                placeholder="email@example.com"
              />
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-3 bg-gray-200 text-black rounded-full hover:bg-gray-300 transition-colors font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

