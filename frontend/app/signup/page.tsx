'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';

export default function SignUpPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
  });
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [checkingUsername, setCheckingUsername] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    // Real-time validation
    if (name === 'username') {
      validateUsername(value);
    } else if (name === 'password') {
      validatePassword(value);
      // Also re-validate confirm password if it's already filled
      if (formData.confirmPassword) {
        validateConfirmPassword(formData.confirmPassword, value);
      }
    } else if (name === 'confirmPassword') {
      validateConfirmPassword(value, formData.password);
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
      // TODO: Replace with actual API endpoint
      // const response = await axios.get(`${API_URL}/auth/check-username/${username}`);
      // if (!response.data.available) {
      //   setUsernameError('This username is already taken');
      // }
      
      // Simulate API call - remove this when implementing real API
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error: any) {
      if (error.response?.status === 409) {
        setUsernameError('This username is already taken');
      }
    } finally {
      setCheckingUsername(false);
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

  const validatePassword = (password: string) => {
    setPasswordError('');
    
    if (!password) {
      return;
    }

    // Length check
    if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }

    // Check for mix of characters
    const hasNumber = /[0-9]/.test(password);
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    if (!hasNumber || !hasUpperCase || !hasLowerCase || !hasSpecialChar) {
      setPasswordError('Password must include numbers, uppercase, lowercase, and special characters');
      return;
    }
  };

  const validateConfirmPassword = (confirmPassword: string, password: string) => {
    setConfirmPasswordError('');
    
    if (!confirmPassword) {
      return;
    }

    if (confirmPassword !== password) {
      setConfirmPasswordError('Passwords do not match');
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
      // Validate password
      if (!formData.password) {
        toast.error('Password is required');
        return false;
      }
      if (formData.password.length < 6) {
        toast.error('Password must be at least 6 characters');
        return false;
      }
      const hasNumber = /[0-9]/.test(formData.password);
      const hasUpperCase = /[A-Z]/.test(formData.password);
      const hasLowerCase = /[a-z]/.test(formData.password);
      const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password);
      if (!hasNumber || !hasUpperCase || !hasLowerCase || !hasSpecialChar) {
        toast.error('Password must include numbers, uppercase, lowercase, and special characters');
        return false;
      }
      if (!formData.confirmPassword) {
        toast.error('Please confirm your password');
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        toast.error('Passwords do not match');
        return false;
      }
      return true;
    } else if (step === 3) {
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
    
    // Final validation on step 3
    if (currentStep === 3) {
      if (!validateStep(3)) {
        return;
      }

      setLoading(true);
      
      try {
        // Sign up user with Supabase Auth
        // This will automatically send a confirmation email
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              first_name: formData.firstName,
              last_name: formData.lastName,
              username: formData.username,
            },
            emailRedirectTo: `${window.location.origin}/auth/confirm`,
          },
        });

        if (authError) {
          throw authError;
        }

        if (authData.user) {
          // Store additional user data in a custom users table
          // This will be done after email confirmation, but we can prepare it
          const { error: profileError } = await supabase
            .from('users')
            .insert({
              id: authData.user.id,
              email: formData.email,
              first_name: formData.firstName,
              last_name: formData.lastName,
              username: formData.username,
              email_verified: false, // Will be updated when they confirm
            });

          if (profileError && profileError.code !== '23505') { // Ignore duplicate key errors
            console.error('Error creating user profile:', profileError);
          }

          toast.success('Account created! Please check your email to verify your account.');
          
          // Redirect to a confirmation page with email
          setTimeout(() => {
            router.push(`/auth/check-email?email=${encodeURIComponent(formData.email)}`);
          }, 1500);
        }
      } catch (error: any) {
        console.error('Sign up error:', error);
        
        // Handle specific Supabase errors
        if (error.message?.includes('already registered')) {
          toast.error('This email is already registered. Please log in instead.');
        } else if (error.message?.includes('password')) {
          toast.error('Password does not meet requirements.');
        } else {
          toast.error(error.message || 'Failed to create account. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Header showSearch={false} />
      
      <main className="flex items-center justify-center px-4 py-12 sm:py-16">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 sm:p-10">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-black mb-2">Create your account</h1>
              <p className="text-gray-600 text-sm">
                Already have an account?{' '}
                <Link href="/login" className="text-black font-medium hover:underline">
                  Log in
                </Link>
              </p>
              {/* Step Indicator */}
              <div className="flex items-center gap-2 mt-4">
                <div className={`h-2 flex-1 rounded-full ${currentStep >= 1 ? 'bg-black' : 'bg-gray-200'}`}></div>
                <div className={`h-2 flex-1 rounded-full ${currentStep >= 2 ? 'bg-black' : 'bg-gray-200'}`}></div>
                <div className={`h-2 flex-1 rounded-full ${currentStep >= 3 ? 'bg-black' : 'bg-gray-200'}`}></div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Step 1: Name + Username */}
              {currentStep === 1 && (
                <>
                  {/* First Name and Last Name */}
                  <div className="grid grid-cols-2 gap-4">
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
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all text-black placeholder-gray-400"
                        placeholder="John"
                        required
                      />
                    </div>
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
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all text-black placeholder-gray-400"
                        placeholder="Doe"
                        required
                      />
                    </div>
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
                    className={`w-full pl-8 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all text-black placeholder-gray-400 ${
                      usernameError ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="johndoe"
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

              {/* Step 2: Password + Confirm Password */}
              {currentStep === 2 && (
                <>
              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-black mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`w-full px-4 py-2.5 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all text-black placeholder-gray-400 ${
                      passwordError ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-black transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                {passwordError ? (
                  <p className="text-xs text-red-500 mt-1">{passwordError}</p>
                ) : (
                  <p className="text-xs text-gray-500 mt-1">
                    At least 6 characters with numbers, uppercase, lowercase, and special characters
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-black mb-2">
                  Confirm password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`w-full px-4 py-2.5 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all text-black placeholder-gray-400 ${
                      confirmPasswordError ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-black transition-colors"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                {confirmPasswordError ? (
                  <p className="text-xs text-red-500 mt-1">{confirmPasswordError}</p>
                ) : (
                  <p className="text-xs text-gray-500 mt-1">
                    Re-enter your password to confirm
                  </p>
                )}
              </div>
                </>
              )}

              {/* Step 3: Email */}
              {currentStep === 3 && (
                <>
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
                  className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all text-black placeholder-gray-400 ${
                    emailError ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="john@example.com"
                  required
                />
                {emailError ? (
                  <p className="text-xs text-red-500 mt-1">{emailError}</p>
                ) : (
                  <p className="text-xs text-gray-500 mt-1">
                    We'll send you a confirmation email to verify your address
                  </p>
                )}
              </div>
                </>
              )}

              {/* Navigation Buttons */}
              <div className="flex gap-3 pt-4">
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="flex-1 px-4 py-3 border border-gray-300 text-black rounded-lg hover:bg-gray-50 active:scale-[0.98] transition-all duration-200 font-medium"
                  >
                    Back
                  </button>
                )}
                {currentStep < 3 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="flex-1 px-4 py-3 bg-black text-white rounded-lg hover:bg-gray-800 active:scale-[0.98] transition-all duration-200 font-medium"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-3 bg-black text-white rounded-lg hover:bg-gray-800 active:scale-[0.98] transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Creating account...' : 'Sign up'}
                  </button>
                )}
              </div>
            </form>

            {/* Terms */}
            <p className="text-xs text-gray-500 text-center mt-6">
              By signing up, you agree to our{' '}
              <Link href="/terms" className="text-black hover:underline">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="text-black hover:underline">
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

