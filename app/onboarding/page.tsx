import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { OnboardingWizard } from '@/components/onboarding/onboarding-wizard';

export default async function OnboardingPage() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/login');
  }

  // Check if user has already completed onboarding
  const profile = await prisma.profile.findUnique({
    where: { userId: user.id },
  });

  if (profile?.isOnboarded) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">IvyWay</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Let's get you set up</h2>
          <p className="text-gray-600 mt-2">
            A few quick questions to personalize your experience
          </p>
        </div>

        <OnboardingWizard />
      </main>
    </div>
  );
}
