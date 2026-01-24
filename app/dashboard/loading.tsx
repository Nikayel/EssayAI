import { SkeletonEssayCard } from '@/components/ui/loading';
import { HeaderSkeleton } from '@/components/layout/header';

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-background">
      <HeaderSkeleton />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
          <div>
            <div className="w-40 h-8 rounded bg-neutral-200 animate-pulse mb-2" />
            <div className="w-60 h-5 rounded bg-neutral-200 animate-pulse" />
          </div>
          <div className="w-32 h-11 rounded-lg bg-neutral-200 animate-pulse" />
        </div>

        {/* Essay Cards */}
        <div className="space-y-4">
          <SkeletonEssayCard />
          <SkeletonEssayCard />
          <SkeletonEssayCard />
        </div>
      </main>
    </div>
  );
}
