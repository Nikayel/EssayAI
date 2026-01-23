'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Star, Award, BookOpen } from 'lucide-react';

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
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold mb-4">Meet Our Expert Reviewers</h3>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Former admissions officers and experienced essay coaches who've helped
            thousands of students get into their dream schools
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {reviewers.map(reviewer => (
            <Card key={reviewer.id} className="text-center">
              <CardContent className="pt-6">
                {reviewer.photoUrl ? (
                  <img
                    src={reviewer.photoUrl}
                    alt={reviewer.displayName || 'Reviewer'}
                    className="w-20 h-20 rounded-full mx-auto mb-4 object-cover"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-blue-100 mx-auto mb-4 flex items-center justify-center">
                    <span className="text-2xl font-bold text-blue-600">
                      {(reviewer.displayName || 'R')[0]}
                    </span>
                  </div>
                )}

                <h4 className="font-semibold text-lg">{reviewer.displayName}</h4>
                {reviewer.title && (
                  <p className="text-blue-600 text-sm font-medium">{reviewer.title}</p>
                )}
                {reviewer.credentials && (
                  <p className="text-gray-600 text-sm mt-1">{reviewer.credentials}</p>
                )}

                <div className="flex justify-center gap-4 mt-4 text-sm text-gray-500">
                  {reviewer.rating && (
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span>{reviewer.rating.toFixed(1)}</span>
                    </div>
                  )}
                  {reviewer.reviewCount > 0 && (
                    <div className="flex items-center gap-1">
                      <BookOpen className="w-4 h-4" />
                      <span>{reviewer.reviewCount}+ reviews</span>
                    </div>
                  )}
                </div>

                {reviewer.ivyExpertise.length > 0 && (
                  <div className="mt-3 flex flex-wrap justify-center gap-1">
                    {reviewer.ivyExpertise.slice(0, 3).map(school => (
                      <span
                        key={school}
                        className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full"
                      >
                        {school}
                      </span>
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
