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
    // TODO: Implement resend email functionality
    // For now, just show a message
    alert('Resend email functionality will be implemented');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Minimal Header */}
      <div className="px-4 sm:px-6 pt-6 pb-4 bg-white">
        <Link href="/feed" className="inline-block bg-white">
          <img 
            src="/applogo.png" 
            alt="Zemme" 
            className="w-10 h-10 object-contain bg-white"
            style={{ backgroundColor: '#ffffff' }}
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
                  We sent a verification link to {email}
                </p>
              )}
            </div>

            {/* Instructions */}
            <div className="mb-8">
              <p className="text-gray-600 text-sm">
                Click the verification link in your email to verify your account and complete your registration.
              </p>
            </div>

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


