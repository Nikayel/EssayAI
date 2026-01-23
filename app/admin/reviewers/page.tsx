'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import {
  Users,
  Plus,
  CheckCircle2,
  XCircle,
  Mail,
  Award,
  Clock,
  ArrowLeft,
} from 'lucide-react';

interface Reviewer {
  id: string;
  name: string;
  email: string;
  credentials: string;
  schoolExpertise: string[];
  essayExpertise: string[];
  maxActiveReviews: number;
  isActive: boolean;
  totalReviews: number;
  avgRating: number | null;
  activeAssignments: number;
  totalAssignments: number;
  createdAt: string;
}

export default function ReviewersPage() {
  const [reviewers, setReviewers] = useState<Reviewer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    fetchReviewers();
  }, []);

  async function fetchReviewers() {
    try {
      setIsLoading(true);
      const res = await fetch('/api/admin/reviewers');
      const data = await res.json();

      if (data.success) {
        setReviewers(data.reviewers);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to fetch reviewers');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">Human Reviewers</h1>
          </div>
          <Button onClick={() => setShowAddForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Reviewer
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="text-3xl font-bold">{reviewers.length}</p>
                  <p className="text-sm text-gray-500">Total Reviewers</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-3xl font-bold">
                    {reviewers.filter((r) => r.isActive).length}
                  </p>
                  <p className="text-sm text-gray-500">Active</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Clock className="w-8 h-8 text-orange-600" />
                <div>
                  <p className="text-3xl font-bold">
                    {reviewers.reduce((sum, r) => sum + r.activeAssignments, 0)}
                  </p>
                  <p className="text-sm text-gray-500">Active Assignments</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Award className="w-8 h-8 text-purple-600" />
                <div>
                  <p className="text-3xl font-bold">
                    {reviewers.reduce((sum, r) => sum + r.totalReviews, 0)}
                  </p>
                  <p className="text-sm text-gray-500">Total Reviews</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Add Reviewer Form */}
        {showAddForm && (
          <AddReviewerForm
            onClose={() => setShowAddForm(false)}
            onSuccess={() => {
              setShowAddForm(false);
              fetchReviewers();
            }}
          />
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="mt-4 text-gray-500">Loading reviewers...</p>
          </div>
        )}

        {/* Reviewers List */}
        {!isLoading && !error && (
          <div className="grid gap-4">
            {reviewers.map((reviewer) => (
              <ReviewerCard
                key={reviewer.id}
                reviewer={reviewer}
                onUpdate={fetchReviewers}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function ReviewerCard({
  reviewer,
  onUpdate,
}: {
  reviewer: Reviewer;
  onUpdate: () => void;
}) {
  const [isUpdating, setIsUpdating] = useState(false);

  async function toggleActive() {
    setIsUpdating(true);
    try {
      await fetch(`/api/admin/reviewers/${reviewer.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !reviewer.isActive }),
      });
      onUpdate();
    } catch (err) {
      console.error('Failed to update reviewer:', err);
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <Card className={!reviewer.isActive ? 'opacity-60' : ''}>
      <CardContent className="py-6">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-semibold">{reviewer.name}</h3>
              {reviewer.isActive ? (
                <Badge className="bg-green-100 text-green-700">Active</Badge>
              ) : (
                <Badge className="bg-gray-100 text-gray-700">Inactive</Badge>
              )}
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
              <Mail className="w-4 h-4" />
              <span>{reviewer.email}</span>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
              <Award className="w-4 h-4" />
              <span>{reviewer.credentials}</span>
            </div>

            <div className="flex flex-wrap gap-2 mb-3">
              {reviewer.schoolExpertise.map((school) => (
                <Badge key={school} variant="secondary" className="text-xs">
                  {school}
                </Badge>
              ))}
            </div>

            <div className="flex gap-6 text-sm text-gray-600">
              <div>
                <span className="font-medium">{reviewer.totalReviews}</span> reviews completed
              </div>
              <div>
                <span className="font-medium">{reviewer.activeAssignments}</span>/
                {reviewer.maxActiveReviews} active
              </div>
              {reviewer.avgRating && (
                <div>
                  <span className="font-medium">{reviewer.avgRating.toFixed(1)}</span>/5 rating
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleActive}
              disabled={isUpdating}
            >
              {reviewer.isActive ? 'Deactivate' : 'Activate'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AddReviewerForm({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    credentials: '',
    bio: '',
    schoolExpertise: '',
    maxActiveReviews: 5,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/reviewers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          schoolExpertise: formData.schoolExpertise
            .split(',')
            .map((s) => s.trim().toLowerCase())
            .filter(Boolean),
        }),
      });

      const data = await res.json();

      if (data.success) {
        onSuccess();
      } else {
        setError(data.error || 'Failed to add reviewer');
      }
    } catch (err) {
      setError('Failed to add reviewer');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Add New Reviewer</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded text-sm">
              {error}
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Dr. Jane Smith"
                required
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="jane@example.com"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="credentials">Credentials</Label>
            <Input
              id="credentials"
              value={formData.credentials}
              onChange={(e) => setFormData({ ...formData, credentials: e.target.value })}
              placeholder="Former Yale AO, 8 years"
              required
            />
          </div>

          <div>
            <Label htmlFor="bio">Bio (optional)</Label>
            <Input
              id="bio"
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Brief background..."
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="schoolExpertise">School Expertise (comma-separated)</Label>
              <Input
                id="schoolExpertise"
                value={formData.schoolExpertise}
                onChange={(e) =>
                  setFormData({ ...formData, schoolExpertise: e.target.value })
                }
                placeholder="harvard, yale, princeton"
              />
            </div>
            <div>
              <Label htmlFor="maxActiveReviews">Max Active Reviews</Label>
              <Input
                id="maxActiveReviews"
                type="number"
                min="1"
                max="20"
                value={formData.maxActiveReviews}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    maxActiveReviews: parseInt(e.target.value) || 5,
                  })
                }
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Adding...' : 'Add Reviewer'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
