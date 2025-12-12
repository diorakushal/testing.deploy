'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';

export default function SignUpPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
  });
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);

  // Get redirect URL from query params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get('redirect');
    if (redirect) {
      setRedirectUrl(redirect);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    // Real-time validation
    if (name === 'username') {
      validateUsername(value);
    } else if (name === 'email') {
      validateEmail(value);
    }
  };

  const checkUsernameAvailability = async (username: string) => {
    if (!username || username.length < 5 || username.length > 30) {
      return;
    }

    try {
      setCheckingUsername(true);
      setUsernameError('');
      
      // Check if username already exists in users table
      const { data, error } = await supabase
        .from('users')
        .select('username')
        .eq('username', username)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned (which is good)
        console.error('Error checking username:', error);
        return;
      }
      
      if (data) {
        setUsernameError('This username is already taken');
      }
    } catch (error: any) {
      console.error('Error checking username availability:', error);
    } finally {
      setCheckingUsername(false);
    }
  };

  const checkEmailAvailability = async (email: string) => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return;
    }

    try {
      setCheckingEmail(true);
      setEmailError('');
      
      // Check if email already exists in users table
      const { data, error } = await supabase
        .from('users')
        .select('email')
        .eq('email', email.toLowerCase().trim())
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned (which is good)
        console.error('Error checking email:', error);
        return;
      }
      
      if (data) {
        setEmailError('This email is already registered. Please log in instead.');
      }
    } catch (error: any) {
      console.error('Error checking email availability:', error);
    } finally {
      setCheckingEmail(false);
    }
  };

  // Debounced username availability check
  useEffect(() => {
    if (!formData.username || formData.username.length < 5 || formData.username.length > 30) {
      return;
    }

    // Only check if username passes basic validation
    if (!/^[a-zA-Z][a-zA-Z0-9_-]+$/.test(formData.username)) {
      return;
    }

    const timeoutId = setTimeout(() => {
      checkUsernameAvailability(formData.username);
    }, 500);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.username]);

  // Debounced email availability check
  useEffect(() => {
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      return;
    }

    const timeoutId = setTimeout(() => {
      checkEmailAvailability(formData.email);
    }, 500);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.email]);

  const validateUsername = (username: string) => {
    setUsernameError('');
    
    if (!username.trim()) {
      return;
    }

    // Length check
    if (username.length < 5 || username.length > 30) {
      setUsernameError('Username must be between 5 and 30 characters');
      return;
    }

    // First character must be a letter
    if (!/^[a-zA-Z]/.test(username)) {
      setUsernameError('Username must start with a letter');
      return;
    }

    // Allowed characters: letters, numbers, hyphens, underscores
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      setUsernameError('Username can only contain letters, numbers, hyphens, and underscores');
      return;
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


  const validateStep = (step: number): boolean => {
    if (step === 1) {
      // Validate name and username
      if (!formData.firstName.trim()) {
        toast.error('First name is required');
        return false;
      }
      if (!formData.lastName.trim()) {
        toast.error('Last name is required');
        return false;
      }
      if (!formData.username.trim()) {
        toast.error('Username is required');
        return false;
      }
      if (formData.username.length < 5 || formData.username.length > 30) {
        toast.error('Username must be between 5 and 30 characters');
        return false;
      }
      if (!/^[a-zA-Z]/.test(formData.username)) {
        toast.error('Username must start with a letter');
        return false;
      }
      if (!/^[a-zA-Z0-9_-]+$/.test(formData.username)) {
        toast.error('Username can only contain letters, numbers, hyphens, and underscores');
        return false;
      }
      if (usernameError) {
        toast.error(usernameError);
        return false;
      }
      return true;
    } else if (step === 2) {
      // Validate email
      if (!formData.email.trim()) {
        toast.error('Email is required');
        return false;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        toast.error('Please enter a valid email address');
        return false;
      }
      return true;
    }
    return false;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Final validation on step 2 (email step)
    if (currentStep === 2) {
      if (!validateStep(2)) {
        return;
      }

      setLoading(true);
      
      try {
        // Final check: Verify username and email are still available before signup
        const [usernameCheck, emailCheck] = await Promise.all([
          supabase
            .from('users')
            .select('username')
            .eq('username', formData.username)
            .maybeSingle(),
          supabase
            .from('users')
            .select('email')
            .eq('email', formData.email.toLowerCase().trim())
            .maybeSingle()
        ]);

        if (usernameCheck.data) {
          setEmailError('');
          setUsernameError('This username is already taken');
          toast.error('This username is already taken. Please choose another.');
          setCurrentStep(1); // Go back to step 1 to fix username
          setLoading(false);
          return;
        }

        if (emailCheck.data) {
          setEmailError('This email is already registered. Please log in instead.');
          toast.error('This email is already registered. Please log in instead.');
          setLoading(false);
          return;
        }

        // Store user data temporarily in sessionStorage for after OTP verification
        const userData = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          username: formData.username,
          email: formData.email.toLowerCase().trim(),
        };
        sessionStorage.setItem('pendingSignup', JSON.stringify(userData));

        // Send OTP code to user's email
        const { error: otpError } = await supabase.auth.signInWithOtp({
          email: formData.email,
          options: {
            shouldCreateUser: true, // Allow automatic user creation
            data: {
              first_name: formData.firstName,
              last_name: formData.lastName,
              username: formData.username,
            },
          },
        });

        if (otpError) {
          // Handle Supabase auth errors
          if (otpError.message?.includes('already registered') || otpError.message?.includes('already exists')) {
            setEmailError('This email is already registered. Please log in instead.');
            toast.error('This email is already registered. Please log in instead.');
            setLoading(false);
            return;
          }
          throw otpError;
        }

        // Redirect to verify OTP page
        const redirectParam = redirectUrl ? `&redirect=${encodeURIComponent(redirectUrl)}` : '';
        router.push(`/auth/verify-otp?email=${encodeURIComponent(formData.email)}${redirectParam}`);
      } catch (error: any) {
        console.error('Sign up error:', error);
        
        // Handle specific Supabase errors
        if (error.message?.includes('already registered') || error.message?.includes('already exists')) {
          setEmailError('This email is already registered. Please log in instead.');
          toast.error('This email is already registered. Please log in instead.');
        } else {
          toast.error(error.message || 'Failed to send verification code. Please try again.');
        }
      } finally {
        setLoading(false);
      }
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
              <h1 className="text-3xl font-bold text-black mb-2">
                {currentStep === 1 ? "What's your name?" : "What's your email?"}
              </h1>
              {currentStep === 1 && (
                <>
                  <p className="text-gray-600 text-sm mt-2">
                    You can edit how this shows on your public profile if you go by a different name.
                  </p>
                  <p className="text-gray-600 text-sm mt-2">
                    Already have an account?{' '}
                    <Link href="/login" className="text-black font-medium hover:underline">
                      Log in
                    </Link>
                  </p>
                </>
              )}
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Step 1: Name + Username */}
              {currentStep === 1 && (
                <>
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
                      placeholder="Satoshi"
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
                      placeholder="Nakamoto"
                      required
                    />
                  </div>

                  {/* Username */}
                  <div>
                    <label htmlFor="username" className="block text-sm font-medium text-black mb-2">
                      Create username
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
                        onChange={handleChange}
                        className={`w-full pl-8 pr-4 py-3 border rounded-lg focus:outline-none focus:border-black transition-all bg-white text-black placeholder-gray-400 ${
                          usernameError ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="satoshinakamoto"
                        required
                        minLength={5}
                        maxLength={30}
                        pattern="^[a-zA-Z][a-zA-Z0-9_-]*$"
                        disabled={checkingUsername}
                      />
                      {checkingUsername && (
                        <span className="absolute right-4 top-1/2 transform -translate-y-1/2">
                          <svg className="animate-spin h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        </span>
                      )}
                    </div>
                    {usernameError ? (
                      <p className="text-xs text-red-500 mt-1">{usernameError}</p>
                    ) : (
                      <p className="text-xs text-gray-500 mt-1">
                        5-30 characters, start with a letter. Letters, numbers, hyphens, and underscores only.
                      </p>
                    )}
                  </div>
                </>
              )}

              {/* Step 2: Email */}
              {currentStep === 2 && (
                <>
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-black mb-2">
                  Email
                </label>
                  <div className="relative">
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 pr-10 border rounded-lg focus:outline-none focus:border-black transition-all bg-white text-black placeholder-gray-400 ${
                        emailError ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Email"
                      required
                    />
                    {checkingEmail && (
                      <span className="absolute right-4 top-1/2 transform -translate-y-1/2">
                        <svg className="animate-spin h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </span>
                    )}
                  </div>
                {emailError ? (
                  <p className="text-xs text-red-500 mt-1">{emailError}</p>
                ) : (
                  <p className="text-xs text-gray-500 mt-1">
                    We'll send you an 8-digit code to verify your email address
                  </p>
                )}
              </div>
                </>
              )}

              {/* Navigation Buttons */}
              <div className="flex flex-col gap-3 pt-6">
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="w-full px-4 py-3 border border-gray-300 text-black rounded-full hover:bg-gray-50 active:scale-[0.98] transition-all duration-200 font-medium"
                  >
                    Back
                  </button>
                )}
                {currentStep < 2 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="w-full px-4 py-3 bg-gray-200 text-black rounded-full hover:bg-gray-300 active:scale-[0.98] transition-all duration-200 font-medium"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full px-4 py-3 bg-gray-200 text-black rounded-full hover:bg-gray-300 active:scale-[0.98] transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Sending code...' : 'Send verification code'}
                  </button>
                )}
              </div>
            </form>

            {/* Privacy Link */}
            <p className="text-xs text-gray-500 text-center mt-8">
              <Link href="/privacy" className="hover:text-gray-700">
                Your Privacy Choices
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

