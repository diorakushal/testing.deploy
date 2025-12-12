'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
  });
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);

  // Get redirect URL from query params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get('redirect');
    if (redirect) {
      setRedirectUrl(redirect);
    }
  }, []);

  useEffect(() => {
    // Check if user is already logged in
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.replace('/feed');
      }
    };
    checkSession();
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    // Real-time validation
    if (name === 'email') {
      validateEmail(value);
    }
  };

  const validateEmail = (email: string) => {
    setEmailError('');
    
    if (!email.trim()) {
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.email.trim()) {
      toast.error('Email is required');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setLoading(true);
    
    try {
      // Send OTP code to user's email
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: formData.email,
        options: {
          shouldCreateUser: false, // Don't create new users on login
        },
      });

      if (otpError) {
        // Handle specific Supabase errors
        // Check for "signups not allowed" or "not found" errors - means user doesn't exist
        if (otpError.message?.includes('Signups not allowed') || 
            otpError.message?.includes('not found') || 
            otpError.message?.includes('does not exist') ||
            otpError.code === 'signup_disabled') {
          toast.error('No account found with this email. Please sign up for an account first.');
          setEmailError('No account found. Please sign up first.');
          setLoading(false);
          return;
        } else {
          throw otpError;
        }
      }

      // Success - redirect to verify OTP page
      toast.success('Verification code sent! Check your email.');
      const redirectParam = redirectUrl ? `&redirect=${encodeURIComponent(redirectUrl)}` : '';
      router.push(`/auth/verify-otp?email=${encodeURIComponent(formData.email)}&type=login${redirectParam}`);
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Handle "signups not allowed" error - means user doesn't exist
      if (error.message?.includes('Signups not allowed') || 
          error.message?.includes('signup_disabled') ||
          error.code === 'signup_disabled') {
        toast.error('No account found with this email. Please sign up for an account first.');
        setEmailError('No account found. Please sign up first.');
      } else {
        toast.error(error.message || 'Failed to send verification code. Please try again.');
      }
      setLoading(false);
    }
  };

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
                <h1 className="text-2xl font-blockbook text-black">blockbook</h1>
              </Link>
            </div>
            
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-black mb-2">Log in</h1>
              <p className="text-gray-600 text-sm mt-2">
                Don't have an account?{' '}
                <Link href="/signup" className="text-black font-medium hover:underline">
                  Sign up
                </Link>
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-black mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-black transition-all bg-white text-black placeholder-gray-400 ${
                    emailError ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="john@example.com"
                  required
                />
                {emailError && (
                  <div className="mt-1">
                    <p className="text-xs text-red-500">{emailError}</p>
                    {emailError.includes('sign up') && (
                      <Link href="/signup" className="text-xs text-black font-medium hover:underline mt-1 inline-block">
                        Go to sign up →
                      </Link>
                    )}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-3 bg-gray-200 text-black rounded-full hover:bg-gray-300 transition-colors font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending code...' : 'Continue'}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}



