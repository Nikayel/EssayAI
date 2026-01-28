'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Menu,
  X,
  ArrowRight,
  Sparkles,
  GraduationCap,
  Users,
  Shield,
  Clock,
  Star,
  PenTool
} from 'lucide-react';

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <div className="md:hidden">
      {/* Hamburger Button - larger touch target */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2.5 -mr-2 rounded-xl hover:bg-neutral-100 active:bg-neutral-200 transition-colors"
        aria-label="Toggle menu"
        aria-expanded={isOpen}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-neutral-700" />
        ) : (
          <Menu className="w-6 h-6 text-neutral-700" />
        )}
      </button>

      {/* Mobile Menu Overlay - Apple-style animation */}
      {isOpen && (
        <div className="fixed inset-0 z-50 animate-fade-in">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-white/95 backdrop-blur-xl"
            onClick={() => setIsOpen(false)}
          />

          {/* Content */}
          <div className="relative h-full flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-neutral-200/60">
              <Link
                href="/"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2"
              >
                <div className="p-1.5 rounded-lg bg-gradient-to-br from-brand-500 to-brand-600">
                  <PenTool className="w-4 h-4 text-white" />
                </div>
                <span className="text-xl font-bold text-neutral-900">IvyWay</span>
              </Link>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2.5 rounded-xl hover:bg-neutral-100 active:bg-neutral-200"
                aria-label="Close menu"
              >
                <X className="w-6 h-6 text-neutral-700" />
              </button>
            </div>

            {/* Primary CTA - Apple psychology: primary action first */}
            <div className="p-4 bg-gradient-to-b from-brand-50/50 to-white border-b border-neutral-100">
              <Link href="/signup" onClick={() => setIsOpen(false)}>
                <Button className="w-full" size="lg">
                  <Sparkles className="w-4 h-4" />
                  Analyze My Essay Free
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <p className="text-center text-xs text-neutral-500 mt-2">
                No credit card required
              </p>
            </div>

            {/* Navigation Links - with value props */}
            <nav className="flex-1 overflow-y-auto p-4 space-y-1">
              {/* Main nav items with icons and descriptions */}
              <NavItem
                href="/ivy"
                icon={GraduationCap}
                title="Ivy League Analysis"
                description="School-specific feedback for top schools"
                highlight
                onClick={() => setIsOpen(false)}
              />

              <NavItem
                href="/pricing"
                icon={Sparkles}
                title="Pricing"
                description="Simple, transparent pricing"
                onClick={() => setIsOpen(false)}
              />

              <NavItem
                href="/for-parents"
                icon={Users}
                title="For Parents"
                description="How IvyWay helps your student"
                onClick={() => setIsOpen(false)}
              />

              {/* Divider */}
              <div className="pt-4 pb-2">
                <div className="border-t border-neutral-200" />
              </div>

              {/* Auth links */}
              <Link
                href="/login"
                onClick={() => setIsOpen(false)}
                className="block px-4 py-3 text-base font-medium text-neutral-700 hover:bg-neutral-50 active:bg-neutral-100 rounded-xl transition-colors"
              >
                Log In
              </Link>
            </nav>

            {/* Trust indicators - bottom fixed */}
            <div className="p-4 border-t border-neutral-200 bg-neutral-50/80">
              <div className="flex justify-center gap-4 mb-3">
                <TrustIndicator icon={Shield} text="Private" />
                <TrustIndicator icon={Clock} text="60 sec" />
                <TrustIndicator icon={Star} text="4.9/5" filled />
              </div>
              <p className="text-center text-xs text-neutral-500">
                Join 10,000+ students improving their essays
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Navigation item with icon and description
function NavItem({
  href,
  icon: Icon,
  title,
  description,
  highlight,
  onClick,
}: {
  href: string;
  icon: React.ElementType;
  title: string;
  description: string;
  highlight?: boolean;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-start gap-3 px-4 py-3.5 rounded-xl transition-colors ${
        highlight
          ? 'bg-brand-50 hover:bg-brand-100 active:bg-brand-100'
          : 'hover:bg-neutral-50 active:bg-neutral-100'
      }`}
    >
      <div
        className={`p-2 rounded-lg ${
          highlight
            ? 'bg-gradient-to-br from-brand-500 to-brand-600 text-white'
            : 'bg-neutral-100 text-neutral-600'
        }`}
      >
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={`font-semibold ${
              highlight ? 'text-brand-700' : 'text-neutral-900'
            }`}
          >
            {title}
          </span>
          {highlight && (
            <Badge variant="premium" size="sm">
              Popular
            </Badge>
          )}
        </div>
        <p className="text-sm text-neutral-500 mt-0.5">{description}</p>
      </div>
    </Link>
  );
}

// Small trust indicator
function TrustIndicator({
  icon: Icon,
  text,
  filled,
}: {
  icon: React.ElementType;
  text: string;
  filled?: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-neutral-600">
      <Icon
        className={`w-3.5 h-3.5 ${
          filled ? 'text-amber-500 fill-amber-500' : 'text-success-500'
        }`}
      />
      <span>{text}</span>
    </div>
  );
}
