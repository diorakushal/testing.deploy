'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
  });
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // Non-blocking auth check - load data in background
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      setUser(session.user);
      
      const { data: profile, error } = await supabase
        .from('users')
        .select('first_name, last_name, username')
        .eq('id', session.user.id)
        .single();
      
      if (!error && profile) {
        setUserProfile(profile);
        setFormData({
          firstName: profile.first_name || '',
          lastName: profile.last_name || '',
          username: profile.username || '',
          email: session.user.email || '',
        });
      } else {
        setUserProfile({
          first_name: session.user.user_metadata?.first_name || '',
          last_name: session.user.user_metadata?.last_name || '',
          username: session.user.user_metadata?.username || '',
        });
        setFormData({
          firstName: session.user.user_metadata?.first_name || '',
          lastName: session.user.user_metadata?.last_name || '',
          username: session.user.user_metadata?.username || '',
          email: session.user.email || '',
        });
      }
      setInitialized(true);
    };

    checkAuth();
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
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

    if (!user?.id) return;

    setLoading(true);

    try {
      const { error: profileError } = await supabase
        .from('users')
        .update({
          first_name: formData.firstName.trim(),
          last_name: formData.lastName.trim(),
        })
        .eq('id', user.id);

      if (profileError) {
        throw profileError;
      }

      toast.success('Profile updated successfully');
      
      // Refresh user profile
      const { data: profile } = await supabase
        .from('users')
        .select('first_name, last_name, username')
        .eq('id', user.id)
        .single();
      
      if (profile) {
        setUserProfile(profile);
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error.message || 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Show form immediately, data will populate when ready
  if (!initialized) {
    return (
      <div className="min-h-screen bg-white">
        <main className="flex items-center justify-center px-4 py-8 sm:py-12">
          <div className="w-full max-w-md">
            <div className="bg-white p-8 sm:p-10">
              {/* Header */}
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-black mb-2">Settings</h1>
                <p className="text-gray-600 text-sm mt-2">Manage your account settings and profile information.</p>
              </div>
              <div className="space-y-6">
                <div className="h-12 bg-gray-100 rounded-lg animate-pulse"></div>
                <div className="h-12 bg-gray-100 rounded-lg animate-pulse"></div>
                <div className="h-12 bg-gray-100 rounded-lg animate-pulse"></div>
                <div className="h-12 bg-gray-100 rounded-lg animate-pulse"></div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <main className="flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-md">
          <div className="bg-white p-8 sm:p-10">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-black mb-2">Settings</h1>
              <p className="text-gray-600 text-sm mt-2">Manage your account settings and profile information.</p>
            </div>

            {/* Form */}
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
              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-3 bg-gray-200 text-black rounded-full hover:bg-gray-300 transition-colors font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

