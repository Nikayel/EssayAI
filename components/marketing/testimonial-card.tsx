'use client';

import { Star, Quote, BadgeCheck } from 'lucide-react';

interface Testimonial {
  quote: string;
  author: string;
  school: string;
  outcome: string;
  rating: number;
  verified: boolean;
}

const FEATURED_TESTIMONIAL: Testimonial = {
  quote: "I was stuck on my Common App essay for weeks. IvyWay showed me exactly why my opening wasn't working and suggested keeping my spike (competitive debate) more central. After two rounds of feedback, I felt genuinely confident submitting. Got into Yale EA!",
  author: "Sarah M.",
  school: "Yale University",
  outcome: "Early Action '25",
  rating: 5,
  verified: true,
};

const ADDITIONAL_TESTIMONIALS: Testimonial[] = [
  {
    quote: "The school-specific feedback was eye-opening. I didn't realize my Harvard essay tone was too casual until I saw it through an AO's perspective.",
    author: "James K.",
    school: "Harvard University",
    outcome: "RD '25",
    rating: 5,
    verified: true,
  },
  {
    quote: "My counselor was helpful but didn't have time for multiple drafts. IvyWay gave me instant feedback every time I revised. Game changer.",
    author: "Priya S.",
    school: "Princeton University",
    outcome: "REA '25",
    rating: 5,
    verified: true,
  },
  {
    quote: "The voice preservation feature is legit. Other tools made my essay sound generic. IvyWay helped me improve while keeping MY writing style.",
    author: "Marcus T.",
    school: "Columbia University",
    outcome: "ED '25",
    rating: 5,
    verified: true,
  },
];

export function TestimonialCard() {
  const testimonial = FEATURED_TESTIMONIAL;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-8 md:p-10">
        {/* Quote icon */}
        <Quote className="w-10 h-10 text-brand-200 mb-6" />

        {/* Main quote */}
        <blockquote className="text-lg md:text-xl text-neutral-700 leading-relaxed mb-6">
          "{testimonial.quote}"
        </blockquote>

        {/* Author info */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            {/* Avatar placeholder */}
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-semibold">
              {testimonial.author.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold text-neutral-900">{testimonial.author}</p>
                {testimonial.verified && (
                  <BadgeCheck className="w-4 h-4 text-brand-500" />
                )}
              </div>
              <p className="text-sm text-neutral-500">
                {testimonial.school} • {testimonial.outcome}
              </p>
            </div>
          </div>

          {/* Star rating */}
          <div className="flex items-center gap-1">
            {Array.from({ length: testimonial.rating }).map((_, i) => (
              <Star key={i} className="w-5 h-5 text-amber-400 fill-amber-400" />
            ))}
          </div>
        </div>
      </div>

      {/* Additional mini testimonials */}
      <div className="grid md:grid-cols-3 gap-4 mt-6">
        {ADDITIONAL_TESTIMONIALS.map((t, i) => (
          <div
            key={i}
            className="bg-white rounded-xl border border-neutral-200 p-4 text-sm"
          >
            <div className="flex items-center gap-1 mb-2">
              {Array.from({ length: t.rating }).map((_, j) => (
                <Star key={j} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              ))}
            </div>
            <p className="text-neutral-600 line-clamp-3 mb-3">"{t.quote}"</p>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-xs font-semibold">
                {t.author[0]}
              </div>
              <div>
                <p className="font-medium text-neutral-800 text-xs">{t.author}</p>
                <p className="text-neutral-400 text-xs">{t.school}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Compact version for use in other sections
export function TestimonialQuote({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-start gap-4 ${className}`}>
      <Quote className="w-8 h-8 text-brand-200 flex-shrink-0" />
      <div>
        <p className="text-neutral-700 italic mb-2">
          "IvyWay caught issues my counselor missed. The school-specific feedback was exactly what I needed."
        </p>
        <p className="text-sm text-neutral-500">
          — Sarah M., Yale '29
        </p>
      </div>
    </div>
  );
}
