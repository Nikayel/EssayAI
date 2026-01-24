'use client';

import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [supabase] = useState(() => createClient());

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // Check if user has completed onboarding
        try {
          const res = await fetch('/api/profile/status');
          const data = await res.json();

          if (data.isOnboarded) {
            router.push('/dashboard');
          } else {
            router.push('/onboarding');
          }
        } catch {
          // Fallback to dashboard (which will handle redirect if needed)
          router.push('/dashboard');
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase, router]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white dark:from-neutral-900 dark:to-neutral-800 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/">
            <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">IvyWay</h1>
          </Link>
          <p className="text-neutral-600 dark:text-neutral-400 mt-2">Sign in to continue</p>
        </div>

        {/* Auth UI */}
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6 sm:p-8">
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
            redirectTo={`${process.env.NEXT_PUBLIC_APP_URL}/dashboard`}
          />
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-neutral-600 dark:text-neutral-400 mt-6">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-brand-600 hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
