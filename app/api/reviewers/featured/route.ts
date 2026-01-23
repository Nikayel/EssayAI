import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const reviewers = await prisma.reviewer.findMany({
      where: {
        isActive: true,
        isFeatured: true,
      },
      select: {
        id: true,
        displayName: true,
        photoUrl: true,
        title: true,
        credentials: true,
        rating: true,
        reviewCount: true,
        yearsExperience: true,
        ivyExpertise: true,
      },
      orderBy: [
        { rating: 'desc' },
        { reviewCount: 'desc' },
      ],
      take: 3,
    });

    return NextResponse.json({ reviewers });
  } catch (error) {
    console.error('Error fetching featured reviewers:', error);
    return NextResponse.json({ reviewers: [] });
  }
}
