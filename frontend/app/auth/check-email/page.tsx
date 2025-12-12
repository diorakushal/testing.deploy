'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function CheckEmailPage() {
  const [email, setEmail] = useState('');

  // Get email from query params
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const emailParam = params.get('email');
      if (emailParam) {
        setEmail(emailParam);
      }
    }
  }, []);

  const handleResendEmail = async () => {
    if (!email) return;
    
    // Redirect to verify-otp page which has resend functionality
    window.location.href = `/auth/verify-otp?email=${encodeURIComponent(email)}`;
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Minimal Header */}
      <div className="px-4 sm:px-6 pt-6 pb-4 bg-white">
        <Link href="/feed" className="inline-block bg-white">
          <img 
            src="/applogo.png" 
            alt="Blockbook" 
            className="w-10 h-10 object-contain"
          />
        </Link>
      </div>
      
      <main className="flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-md">
          <div className="bg-white p-8 sm:p-10">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-black mb-2">
                Check your email
              </h1>
              {email && (
                <p className="text-gray-600 text-sm mt-2">
                  We sent an 8-digit verification code to {email}
                </p>
              )}
            </div>

            {/* Instructions */}
            <div className="mb-8">
              <p className="text-gray-600 text-sm">
                Enter the 6-digit code from your email to verify your account and complete your registration.
              </p>
            </div>

            {/* Redirect to verify OTP */}
            {email && (
              <div className="mb-8">
                <a
                  href={`/auth/verify-otp?email=${encodeURIComponent(email)}`}
                  className="w-full block px-4 py-3 bg-black text-white rounded-full hover:bg-gray-900 active:scale-[0.98] transition-all duration-200 font-medium text-center"
                >
                  Enter verification code
                </a>
              </div>
            )}

            {/* Resend Link */}
            <div className="mt-8">
              <p className="text-sm text-gray-600">
                Didn't receive the email?{' '}
                <button
                  onClick={handleResendEmail}
                  className="text-black underline hover:text-gray-700"
                >
                  Resend email
                </button>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}


