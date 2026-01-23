'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
        <CardContent className="py-8 text-center text-gray-500">
          Loading referral info...
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
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <Gift className="w-5 h-5 text-green-600" />
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
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold mb-3">How it works</h4>
          <ol className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">1</span>
              <span>Share your unique link with friends applying to college</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">2</span>
              <span>They get <strong>20% off</strong> their first purchase</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">3</span>
              <span>You get <strong>$20 credit</strong> when they buy</span>
            </li>
          </ol>
        </div>

        {/* Referral Link */}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">
            Your Referral Link
          </label>
          <div className="flex gap-2">
            <Input
              value={referralLink}
              readOnly
              className="bg-gray-50"
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
        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-gray-600 mb-1">
              <Users className="w-4 h-4" />
            </div>
            <div className="text-2xl font-bold">{stats.signedUp}</div>
            <div className="text-xs text-gray-500">Friends Signed Up</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-gray-600 mb-1">
              <Check className="w-4 h-4" />
            </div>
            <div className="text-2xl font-bold">{stats.converted}</div>
            <div className="text-xs text-gray-500">Made Purchase</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-green-600 mb-1">
              <DollarSign className="w-4 h-4" />
            </div>
            <div className="text-2xl font-bold text-green-600">
              ${(stats.totalEarnings / 100).toFixed(0)}
            </div>
            <div className="text-xs text-gray-500">Total Earned</div>
          </div>
        </div>

        {stats.pendingEarnings > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm">
            <span className="font-semibold text-yellow-800">
              ${(stats.pendingEarnings / 100).toFixed(0)} pending
            </span>
            <span className="text-yellow-700"> - will be credited once friends complete purchase</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
