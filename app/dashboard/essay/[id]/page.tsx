import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { EssayDetailView } from '@/components/essay/essay-detail-view';

type Params = Promise<{ id: string }>;

async function getEssay(essayId: string, userId: string) {
  return await prisma.essay.findFirst({
    where: {
      id: essayId,
      userId,
    },
    include: {
      versions: {
        orderBy: { versionIndex: 'desc' },
        include: {
          analyses: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: {
              commonsFlags: true,
            },
          },
          rewrites: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
          reviews: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      },
      orders: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });
}

export default async function EssayDetailPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/login');
  }

  const essay = await getEssay(id, user.id);

  if (!essay) {
    redirect('/dashboard');
  }

  // Fetch user profile for name
  const profile = await prisma.profile.findUnique({
    where: { userId: user.id },
  });

  return <EssayDetailView essay={essay} userEmail={user.email!} userName={profile?.name || user.email!.split('@')[0]} />;
}
