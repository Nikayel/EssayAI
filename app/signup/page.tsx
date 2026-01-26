'use client';

import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { CheckCircle2, Shield, Zap } from 'lucide-react';

function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [supabase] = useState(() => createClient());

  // Get referral code from URL if present
  const referralCode = searchParams.get('ref');
  // Get redirect destination if coming from checkout
  const redirectTo = searchParams.get('redirect') || '/onboarding';

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
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

        // Redirect to intended destination or onboarding
        router.push(redirectTo);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase, router, referralCode, redirectTo]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-accent-50 dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-800 flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-block">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-brand-600 to-accent-600 bg-clip-text text-transparent">
              IvyWay
            </h1>
          </Link>
          <p className="text-neutral-600 dark:text-neutral-400 mt-2">
            Create your free account
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-700 p-6 sm:p-8">
          {/* Trust badges */}
          <div className="flex items-center justify-center gap-4 mb-6 pb-6 border-b border-neutral-100 dark:border-neutral-700">
            <div className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
              <Shield className="w-3.5 h-3.5 text-green-500" />
              <span>Secure</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
              <Zap className="w-3.5 h-3.5 text-yellow-500" />
              <span>Instant access</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
              <CheckCircle2 className="w-3.5 h-3.5 text-brand-500" />
              <span>Free to start</span>
            </div>
          </div>

          {/* Supabase Auth UI */}
          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#7c3aed',
                    brandAccent: '#6d28d9',
                    inputBackground: 'transparent',
                    inputBorder: '#e5e5e5',
                    inputBorderFocus: '#7c3aed',
                    inputBorderHover: '#a3a3a3',
                  },
                  borderWidths: {
                    buttonBorderWidth: '1px',
                    inputBorderWidth: '1px',
                  },
                  radii: {
                    borderRadiusButton: '8px',
                    buttonBorderRadius: '8px',
                    inputBorderRadius: '8px',
                  },
                },
              },
              className: {
                button: 'font-medium',
                input: 'dark:bg-neutral-700 dark:border-neutral-600',
                label: 'dark:text-neutral-300',
              },
            }}
            providers={['google']}
            providerScopes={{
              google: 'email profile',
            }}
            view="sign_up"
            redirectTo={`${process.env.NEXT_PUBLIC_APP_URL}${redirectTo}`}
            localization={{
              variables: {
                sign_up: {
                  social_provider_text: 'Continue with {{provider}}',
                  email_label: 'Email address',
                  password_label: 'Create password',
                  button_label: 'Create account',
                  link_text: 'Already have an account? Sign in',
                },
              },
            }}
          />

          {/* Value props */}
          <div className="mt-6 pt-6 border-t border-neutral-100 dark:border-neutral-700">
            <p className="text-xs text-neutral-500 dark:text-neutral-400 text-center mb-3">
              What you get with your account:
            </p>
            <ul className="space-y-2">
              {[
                'Save your essays & analysis history',
                'Track progress across multiple schools',
                'Access results anytime, anywhere',
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-300">
                  <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-neutral-600 dark:text-neutral-400 mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-brand-600 hover:text-brand-700 font-medium hover:underline">
            Sign in
          </Link>
        </p>

        {/* Academic Integrity Notice */}
        <div className="mt-4 p-3 bg-neutral-100 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
          <p className="text-xs text-neutral-600 dark:text-neutral-400 text-center">
            <strong>Academic Integrity:</strong> IvyWay provides feedback only.
            You remain the author of your work.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-accent-50 dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-800 flex items-center justify-center">
        <div className="animate-pulse text-neutral-400">Loading...</div>
      </div>
    }>
      <SignupContent />
    </Suspense>
  );
}
