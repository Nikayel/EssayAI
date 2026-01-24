'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Menu, X, ArrowRight } from 'lucide-react';

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="md:hidden">
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
        aria-label="Toggle menu"
      >
        {isOpen ? (
          <X className="w-6 h-6 text-neutral-700" />
        ) : (
          <Menu className="w-6 h-6 text-neutral-700" />
        )}
      </button>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-white">
          {/* Header */}
          <div className="flex justify-between items-center p-4 border-b">
            <span className="text-xl font-bold text-neutral-900">IvyWay</span>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-lg hover:bg-neutral-100"
              aria-label="Close menu"
            >
              <X className="w-6 h-6 text-neutral-700" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-2">
            <Link
              href="/pricing"
              onClick={() => setIsOpen(false)}
              className="block px-4 py-3 text-lg font-medium text-neutral-700 hover:bg-neutral-50 rounded-lg transition-colors"
            >
              Pricing
            </Link>
            <Link
              href="/for-parents"
              onClick={() => setIsOpen(false)}
              className="block px-4 py-3 text-lg font-medium text-neutral-700 hover:bg-neutral-50 rounded-lg transition-colors"
            >
              For Parents
            </Link>

            <div className="pt-4 border-t mt-4 space-y-3">
              <Link href="/login" onClick={() => setIsOpen(false)}>
                <Button variant="outline" className="w-full" size="lg">
                  Log In
                </Button>
              </Link>
              <Link href="/signup" onClick={() => setIsOpen(false)}>
                <Button className="w-full" size="lg">
                  Get Started Free
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </nav>

          {/* Trust message */}
          <div className="absolute bottom-8 left-0 right-0 px-4">
            <p className="text-center text-sm text-neutral-500">
              Free analysis for essays up to 650 words
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
