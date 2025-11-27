'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';

export default function CheckEmailPage() {
  const router = useRouter();
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

  return (
    <div className="min-h-screen bg-white">
      <Header showSearch={false} />
      
      <main className="flex items-center justify-center px-4 py-12 sm:py-16">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 sm:p-10 text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-black mb-2">Check your email</h1>
              <p className="text-gray-600 text-sm">
                We've sent a confirmation link to{email && ` ${email}`}
              </p>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Click the link in the email to verify your account and complete your registration.
              </p>
              
              <div className="bg-gray-50 rounded-lg p-4 text-left">
                <p className="text-xs text-gray-600 mb-2 font-medium">Didn't receive the email?</p>
                <ul className="text-xs text-gray-500 space-y-1 list-disc list-inside">
                  <li>Check your spam folder</li>
                  <li>Make sure you entered the correct email address</li>
                  <li>Wait a few minutes and check again</li>
                </ul>
              </div>

              <div className="pt-4">
                <button
                  onClick={() => router.push('/feed')}
                  className="w-full px-4 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors duration-200 font-medium"
                >
                  Back to Home
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

