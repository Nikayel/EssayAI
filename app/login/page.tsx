'use client';

import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { Shield, Sparkles } from 'lucide-react';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [supabase] = useState(() => createClient());

  // Get redirect destination if coming from somewhere specific
  const redirectTo = searchParams.get('redirect');

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      if (event === 'SIGNED_IN' && session) {
        // If there's a specific redirect, use it
        if (redirectTo) {
          router.push(redirectTo);
          return;
        }

        // Otherwise check onboarding status
        try {
          const res = await fetch('/api/profile/status');
          const data = await res.json();

          if (data.isOnboarded) {
            router.push('/dashboard');
          } else {
            router.push('/onboarding');
          }
        } catch {
          router.push('/dashboard');
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase, router, redirectTo]);

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
            Welcome back
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-700 p-6 sm:p-8">
          {/* Trust badges */}
          <div className="flex items-center justify-center gap-6 mb-6 pb-6 border-b border-neutral-100 dark:border-neutral-700">
            <div className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
              <Shield className="w-3.5 h-3.5 text-green-500" />
              <span>Secure login</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
              <Sparkles className="w-3.5 h-3.5 text-brand-500" />
              <span>Pick up where you left off</span>
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
            view="sign_in"
            redirectTo={`${process.env.NEXT_PUBLIC_APP_URL}${redirectTo || '/dashboard'}`}
            localization={{
              variables: {
                sign_in: {
                  social_provider_text: 'Continue with {{provider}}',
                  email_label: 'Email address',
                  password_label: 'Password',
                  button_label: 'Sign in',
                  link_text: "Don't have an account? Sign up",
                },
              },
            }}
          />
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-neutral-600 dark:text-neutral-400 mt-6">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-brand-600 hover:text-brand-700 font-medium hover:underline">
            Sign up free
          </Link>
        </p>

        {/* Help link */}
        <p className="text-center text-xs text-neutral-500 dark:text-neutral-500 mt-4">
          Having trouble?{' '}
          <Link href="/contact" className="hover:underline">
            Contact support
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-accent-50 dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-800 flex items-center justify-center">
        <div className="animate-pulse text-neutral-400">Loading...</div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
