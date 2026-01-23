'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, BookOpen, Award, GraduationCap } from 'lucide-react';

interface Reviewer {
  id: string;
  displayName: string;
  photoUrl: string | null;
  title: string | null;
  credentials: string | null;
  rating: number | null;
  reviewCount: number;
  yearsExperience: number | null;
  ivyExpertise: string[];
}

export function ReviewerShowcase() {
  const [reviewers, setReviewers] = useState<Reviewer[]>([]);

  useEffect(() => {
    fetch('/api/reviewers/featured')
      .then(res => res.json())
      .then(data => setReviewers(data.reviewers || []))
      .catch(() => setReviewers([]));
  }, []);

  if (reviewers.length === 0) return null;

  return (
    <section className="py-20 bg-gradient-to-b from-neutral-50 to-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <Badge variant="premium" size="lg" className="mb-4">
            <Award className="w-3.5 h-3.5" />
            Expert Reviewers
          </Badge>
          <h3 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">
            Meet Our Expert Reviewers
          </h3>
          <p className="text-neutral-600 max-w-2xl mx-auto text-lg leading-relaxed">
            Former admissions officers and experienced essay coaches who've helped
            thousands of students get into their dream schools
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {reviewers.map(reviewer => (
            <Card
              key={reviewer.id}
              variant="interactive"
              className="text-center overflow-hidden"
            >
              <CardContent className="pt-8 pb-6">
                {/* Avatar */}
                <div className="relative inline-block mb-4">
                  {reviewer.photoUrl ? (
                    <img
                      src={reviewer.photoUrl}
                      alt={reviewer.displayName || 'Reviewer'}
                      className="w-24 h-24 rounded-2xl object-cover ring-4 ring-white shadow-lg"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center ring-4 ring-white shadow-lg">
                      <span className="text-3xl font-bold text-white">
                        {(reviewer.displayName || 'R')[0]}
                      </span>
                    </div>
                  )}
                  {/* Verified badge */}
                  <div className="absolute -bottom-2 -right-2 p-1.5 bg-white rounded-full shadow-md">
                    <div className="p-1 bg-success-500 rounded-full">
                      <GraduationCap className="w-3 h-3 text-white" />
                    </div>
                  </div>
                </div>

                {/* Name & Title */}
                <h4 className="font-semibold text-lg text-neutral-900">
                  {reviewer.displayName}
                </h4>
                {reviewer.title && (
                  <p className="text-brand-600 text-sm font-medium mt-0.5">
                    {reviewer.title}
                  </p>
                )}
                {reviewer.credentials && (
                  <p className="text-neutral-500 text-sm mt-1">
                    {reviewer.credentials}
                  </p>
                )}

                {/* Stats */}
                <div className="flex justify-center gap-6 mt-5 pt-5 border-t border-neutral-100">
                  {reviewer.rating && (
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-amber-500">
                        <Star className="w-4 h-4 fill-current" />
                        <span className="font-bold text-neutral-900">
                          {reviewer.rating.toFixed(1)}
                        </span>
                      </div>
                      <span className="text-xs text-neutral-500">Rating</span>
                    </div>
                  )}
                  {reviewer.reviewCount > 0 && (
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <span className="font-bold text-neutral-900">
                          {reviewer.reviewCount}+
                        </span>
                      </div>
                      <span className="text-xs text-neutral-500">Reviews</span>
                    </div>
                  )}
                </div>

                {/* Ivy Expertise */}
                {reviewer.ivyExpertise.length > 0 && (
                  <div className="mt-4 flex flex-wrap justify-center gap-1.5">
                    {reviewer.ivyExpertise.slice(0, 3).map(school => (
                      <Badge key={school} variant="secondary" size="sm">
                        {school}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
