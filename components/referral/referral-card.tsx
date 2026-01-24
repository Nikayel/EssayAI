'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/loading';
import { Gift, Copy, Check, Users, DollarSign } from 'lucide-react';

interface ReferralStats {
  code: string;
  totalReferred: number;
  signedUp: number;
  converted: number;
  totalEarnings: number;
  pendingEarnings: number;
}

export function ReferralCard() {
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/referral/stats')
      .then(res => res.json())
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const copyLink = () => {
    if (!stats?.code) return;
    const link = `${window.location.origin}/signup?ref=${stats.code}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Skeleton variant="circular" width={40} height={40} />
            <div className="flex-1 space-y-2">
              <Skeleton variant="text" width="50%" height={20} />
              <Skeleton variant="text" width="70%" height={16} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <Skeleton variant="rectangular" height={100} className="rounded-lg" />
          <div className="space-y-2">
            <Skeleton variant="text" width={100} />
            <Skeleton variant="rectangular" height={40} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Skeleton variant="rectangular" height={60} />
            <Skeleton variant="rectangular" height={60} />
            <Skeleton variant="rectangular" height={60} />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return null;
  }

  const referralLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/signup?ref=${stats.code}`;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-success-100 dark:bg-success-900/30 rounded-full flex items-center justify-center">
            <Gift className="w-5 h-5 text-success-600 dark:text-success-400" />
          </div>
          <div>
            <CardTitle>Refer Friends, Earn Credit</CardTitle>
            <CardDescription>
              Get $20 credit for each friend who makes a purchase
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* How it works */}
        <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-lg p-4">
          <h4 className="font-semibold mb-3">How it works</h4>
          <ol className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">1</span>
              <span>Share your unique link with friends applying to college</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">2</span>
              <span>They get <strong>20% off</strong> their first purchase</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">3</span>
              <span>You get <strong>$20 credit</strong> when they buy</span>
            </li>
          </ol>
        </div>

        {/* Referral Link */}
        <div>
          <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 block mb-2">
            Your Referral Link
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              value={referralLink}
              readOnly
              className="bg-neutral-50 dark:bg-neutral-800/50 flex-1"
            />
            <Button onClick={copyLink} variant="outline">
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-1" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-1" />
                  Copy
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
          <div className="text-center sm:text-center flex sm:block items-center justify-between sm:justify-center">
            <div className="flex items-center gap-2 sm:justify-center text-neutral-600 dark:text-neutral-400 sm:mb-1">
              <Users className="w-4 h-4" />
              <span className="text-xs sm:hidden">Friends Signed Up</span>
            </div>
            <div className="text-2xl font-bold">{stats.signedUp}</div>
            <div className="text-xs text-neutral-500 hidden sm:block">Friends Signed Up</div>
          </div>
          <div className="text-center sm:text-center flex sm:block items-center justify-between sm:justify-center">
            <div className="flex items-center gap-2 sm:justify-center text-neutral-600 dark:text-neutral-400 sm:mb-1">
              <Check className="w-4 h-4" />
              <span className="text-xs sm:hidden">Made Purchase</span>
            </div>
            <div className="text-2xl font-bold">{stats.converted}</div>
            <div className="text-xs text-neutral-500 hidden sm:block">Made Purchase</div>
          </div>
          <div className="text-center sm:text-center flex sm:block items-center justify-between sm:justify-center">
            <div className="flex items-center gap-2 sm:justify-center text-success-600 dark:text-success-400 sm:mb-1">
              <DollarSign className="w-4 h-4" />
              <span className="text-xs sm:hidden">Total Earned</span>
            </div>
            <div className="text-2xl font-bold text-success-600 dark:text-success-400">
              ${(stats.totalEarnings / 100).toFixed(0)}
            </div>
            <div className="text-xs text-neutral-500 hidden sm:block">Total Earned</div>
          </div>
        </div>

        {stats.pendingEarnings > 0 && (
          <div className="bg-warning-50 border border-warning-200 dark:bg-warning-900/20 dark:border-warning-800 rounded-lg p-3 text-sm">
            <span className="font-semibold text-warning-800 dark:text-warning-300">
              ${(stats.pendingEarnings / 100).toFixed(0)} pending
            </span>
            <span className="text-warning-700 dark:text-warning-400"> - will be credited once friends complete purchase</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
