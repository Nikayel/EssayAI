'use client';

import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [supabase] = useState(() => createClient());

  // Get referral code from URL if present
  const referralCode = searchParams.get('ref');

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // Create user profile in public.users table
        await fetch('/api/auth/sync-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: session.user.id, email: session.user.email }),
        });

        // Track referral if present
        if (referralCode) {
          await fetch('/api/referral/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: referralCode }),
          });
        }

        // Redirect to onboarding to collect critical user info
        router.push('/onboarding');
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase, router, referralCode]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/">
            <h1 className="text-3xl font-bold text-gray-900">IvyWay</h1>
          </Link>
          <p className="text-gray-600 mt-2">Create your account</p>
        </div>

        {/* Auth UI */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#7c3aed',
                    brandAccent: '#6d28d9',
                  },
                },
              },
            }}
            providers={[]}
            view="sign_up"
            redirectTo={`${process.env.NEXT_PUBLIC_APP_URL}/dashboard`}
          />
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-600 mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-blue-600 hover:underline">
            Sign in
          </Link>
        </p>

        {/* Academic Integrity Notice */}
        <div className="mt-6 p-4 bg-brand-50 rounded-lg">
          <p className="text-xs text-brand-900">
            <strong>Academic Integrity:</strong> IvyWay provides suggestions and feedback only.
            You remain the author of your work. By signing up, you agree to use our service ethically
            and maintain academic honesty.
          </p>
        </div>
      </div>
    </div>
  );
}
