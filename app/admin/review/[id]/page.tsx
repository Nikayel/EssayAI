import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { AdminReviewEditor } from '@/components/admin/review-editor';

type Params = Promise<{ id: string }>;

async function getReview(reviewId: string) {
  return await prisma.review.findUnique({
    where: { id: reviewId },
    include: {
      version: {
        include: {
          essay: {
            include: {
              user: {
                include: {
                  profile: true,
                },
              },
            },
          },
          analyses: {
            orderBy: {
              createdAt: 'desc',
            },
            take: 1,
          },
        },
      },
      order: {
        include: {
          user: {
            include: {
              profile: true,
            },
          },
        },
      },
      reviewer: {
        select: {
          email: true,
          name: true,
        },
      },
    },
  });
}

export default async function AdminReviewDetailPage({
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

  // Check if user is admin
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
  });

  if (!dbUser || dbUser.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  const review = await getReview(id);

  if (!review) {
    redirect('/admin');
  }

  return <AdminReviewEditor review={review} adminId={user.id} />;
}
