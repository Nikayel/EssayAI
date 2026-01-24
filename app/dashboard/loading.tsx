import { SkeletonEssayCard } from '@/components/ui/loading';

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header Skeleton */}
      <header className="sticky top-0 z-50 border-b border-neutral-200/60 bg-white/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-neutral-200 animate-pulse" />
            <div className="w-20 h-6 rounded bg-neutral-200 animate-pulse" />
          </div>
          <div className="flex gap-2">
            <div className="w-20 h-9 rounded-lg bg-neutral-200 animate-pulse" />
            <div className="w-20 h-9 rounded-lg bg-neutral-200 animate-pulse" />
          </div>
        </div>
      </header>

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
