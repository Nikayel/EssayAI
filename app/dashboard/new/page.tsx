import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { EssaySubmissionWizard } from '@/components/essay/submission-wizard';

export default async function NewEssayPage() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">IvyWay</h1>
        </div>
      </header>

      <EssaySubmissionWizard />
    </div>
  );
}
