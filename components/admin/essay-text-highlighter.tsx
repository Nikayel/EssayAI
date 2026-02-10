'use client';

import { useState, useMemo, useCallback } from 'react';
import type { TextAnnotation } from '@/lib/rag/types';

// =============================================================================
// TYPES
// =============================================================================

interface EssayTextHighlighterProps {
  essayText: string;
  annotations: TextAnnotation[];
  onAnnotationClick?: (annotation: TextAnnotation) => void;
  activeAnnotation?: TextAnnotation | null;
  showLegend?: boolean;
}

interface HighlightSegment {
  text: string;
  start: number;
  end: number;
  annotations: TextAnnotation[];
  isHighlighted: boolean;
}

// =============================================================================
// STYLE CONFIG
// =============================================================================

const ANNOTATION_STYLES: Record<TextAnnotation['type'], Record<TextAnnotation['severity'], {
  bg: string;
  border: string;
  activeBg: string;
  dot: string;
  label: string;
}>> = {
  strength: {
    positive: { bg: 'bg-emerald-50', border: 'border-b-2 border-emerald-400', activeBg: 'bg-emerald-100 ring-2 ring-emerald-400', dot: 'bg-emerald-500', label: 'Strength' },
    minor: { bg: 'bg-emerald-50', border: 'border-b-2 border-emerald-300', activeBg: 'bg-emerald-100 ring-2 ring-emerald-400', dot: 'bg-emerald-400', label: 'Strength' },
    major: { bg: 'bg-emerald-50', border: 'border-b-2 border-emerald-400', activeBg: 'bg-emerald-100 ring-2 ring-emerald-400', dot: 'bg-emerald-500', label: 'Strength' },
    critical: { bg: 'bg-emerald-50', border: 'border-b-2 border-emerald-500', activeBg: 'bg-emerald-100 ring-2 ring-emerald-500', dot: 'bg-emerald-600', label: 'Strength' },
  },
  issue: {
    positive: { bg: 'bg-amber-50', border: 'border-b-2 border-amber-300', activeBg: 'bg-amber-100 ring-2 ring-amber-400', dot: 'bg-amber-400', label: 'Minor Issue' },
    minor: { bg: 'bg-amber-50', border: 'border-b-2 border-amber-300', activeBg: 'bg-amber-100 ring-2 ring-amber-400', dot: 'bg-amber-400', label: 'Minor Issue' },
    major: { bg: 'bg-orange-50', border: 'border-b-2 border-orange-400', activeBg: 'bg-orange-100 ring-2 ring-orange-400', dot: 'bg-orange-500', label: 'Major Issue' },
    critical: { bg: 'bg-red-50', border: 'border-b-2 border-red-400', activeBg: 'bg-red-100 ring-2 ring-red-400', dot: 'bg-red-500', label: 'Critical Issue' },
  },
  red_flag: {
    positive: { bg: 'bg-red-50', border: 'border-b-2 border-red-300', activeBg: 'bg-red-100 ring-2 ring-red-400', dot: 'bg-red-400', label: 'Red Flag' },
    minor: { bg: 'bg-red-50', border: 'border-b-2 border-red-300', activeBg: 'bg-red-100 ring-2 ring-red-400', dot: 'bg-red-400', label: 'Red Flag' },
    major: { bg: 'bg-red-50', border: 'border-b-2 border-red-400', activeBg: 'bg-red-100 ring-2 ring-red-500', dot: 'bg-red-500', label: 'Red Flag' },
    critical: { bg: 'bg-red-100', border: 'border-b-3 border-red-500', activeBg: 'bg-red-200 ring-2 ring-red-600', dot: 'bg-red-600', label: 'Critical Red Flag' },
  },
  ai_signal: {
    positive: { bg: 'bg-purple-50', border: 'border-b-2 border-purple-300', activeBg: 'bg-purple-100 ring-2 ring-purple-400', dot: 'bg-purple-400', label: 'AI Signal' },
    minor: { bg: 'bg-purple-50', border: 'border-b-2 border-purple-300', activeBg: 'bg-purple-100 ring-2 ring-purple-400', dot: 'bg-purple-400', label: 'AI Signal' },
    major: { bg: 'bg-purple-50', border: 'border-b-2 border-purple-400', activeBg: 'bg-purple-100 ring-2 ring-purple-500', dot: 'bg-purple-500', label: 'AI Signal' },
    critical: { bg: 'bg-purple-100', border: 'border-b-3 border-purple-500', activeBg: 'bg-purple-200 ring-2 ring-purple-600', dot: 'bg-purple-600', label: 'AI Signal' },
  },
  suggestion: {
    positive: { bg: 'bg-blue-50', border: 'border-b-2 border-blue-300', activeBg: 'bg-blue-100 ring-2 ring-blue-400', dot: 'bg-blue-400', label: 'Suggestion' },
    minor: { bg: 'bg-blue-50', border: 'border-b-2 border-blue-300', activeBg: 'bg-blue-100 ring-2 ring-blue-400', dot: 'bg-blue-400', label: 'Suggestion' },
    major: { bg: 'bg-blue-50', border: 'border-b-2 border-blue-400', activeBg: 'bg-blue-100 ring-2 ring-blue-500', dot: 'bg-blue-500', label: 'Suggestion' },
    critical: { bg: 'bg-blue-50', border: 'border-b-2 border-blue-500', activeBg: 'bg-blue-100 ring-2 ring-blue-600', dot: 'bg-blue-600', label: 'Suggestion' },
  },
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function EssayTextHighlighter({
  essayText,
  annotations,
  onAnnotationClick,
  activeAnnotation,
  showLegend = true,
}: EssayTextHighlighterProps) {
  const [hoveredAnnotation, setHoveredAnnotation] = useState<TextAnnotation | null>(null);

  // Find actual positions of quoted text in essay
  const resolvedAnnotations = useMemo(() => {
    return annotations.map(annotation => {
      // Try to find the text in the essay by fuzzy matching
      const normalizedEssay = essayText.toLowerCase();
      const normalizedQuote = annotation.text.toLowerCase().trim();

      if (!normalizedQuote) return null;

      const idx = normalizedEssay.indexOf(normalizedQuote);
      if (idx === -1) {
        // Try with whitespace normalization
        const essayNorm = normalizedEssay.replace(/\s+/g, ' ');
        const quoteNorm = normalizedQuote.replace(/\s+/g, ' ');
        const normIdx = essayNorm.indexOf(quoteNorm);
        if (normIdx === -1) return null;

        // Map normalized position back to original
        return {
          ...annotation,
          start_index: normIdx,
          end_index: normIdx + quoteNorm.length,
          _resolved: true,
        };
      }

      return {
        ...annotation,
        start_index: idx,
        end_index: idx + normalizedQuote.length,
        _resolved: true,
      };
    }).filter((a): a is TextAnnotation & { _resolved: true } => a !== null);
  }, [essayText, annotations]);

  // Build highlight segments
  const segments = useMemo(() => {
    return buildSegments(essayText, resolvedAnnotations);
  }, [essayText, resolvedAnnotations]);

  const handleAnnotationHover = useCallback((annotation: TextAnnotation | null) => {
    setHoveredAnnotation(annotation);
  }, []);

  return (
    <div className="space-y-4">
      {/* Legend */}
      {showLegend && resolvedAnnotations.length > 0 && (
        <HighlightLegend annotations={resolvedAnnotations} />
      )}

      {/* Essay text with highlights */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-6 sm:p-8">
          <div className="font-serif text-base leading-[1.8] text-gray-800 whitespace-pre-wrap">
            {segments.map((segment, i) => (
              <SegmentRenderer
                key={i}
                segment={segment}
                isActive={activeAnnotation !== null && activeAnnotation !== undefined &&
                  segment.annotations.some(a => a.text === activeAnnotation.text && a.type === activeAnnotation.type)}
                isHovered={hoveredAnnotation !== null &&
                  segment.annotations.some(a => a.text === hoveredAnnotation.text && a.type === hoveredAnnotation.type)}
                onHover={handleAnnotationHover}
                onClick={onAnnotationClick}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Floating annotation tooltip */}
      {hoveredAnnotation && (
        <AnnotationTooltip annotation={hoveredAnnotation} />
      )}
    </div>
  );
}

// =============================================================================
// SEGMENT RENDERER
// =============================================================================

function SegmentRenderer({
  segment,
  isActive,
  isHovered,
  onHover,
  onClick,
}: {
  segment: HighlightSegment;
  isActive: boolean;
  isHovered: boolean;
  onHover: (annotation: TextAnnotation | null) => void;
  onClick?: (annotation: TextAnnotation) => void;
}) {
  if (!segment.isHighlighted || segment.annotations.length === 0) {
    return <span>{segment.text}</span>;
  }

  // Use the highest-priority annotation for styling
  const primary = getHighestPriorityAnnotation(segment.annotations);
  const style = ANNOTATION_STYLES[primary.type]?.[primary.severity]
    || ANNOTATION_STYLES.issue.minor;

  const className = isActive
    ? `${style.activeBg} rounded px-0.5 cursor-pointer transition-all duration-200`
    : isHovered
    ? `${style.activeBg} rounded px-0.5 cursor-pointer transition-all duration-200`
    : `${style.bg} ${style.border} rounded-sm px-0.5 cursor-pointer transition-all duration-200 hover:ring-1 hover:ring-gray-300`;

  return (
    <span
      className={className}
      onMouseEnter={() => onHover(primary)}
      onMouseLeave={() => onHover(null)}
      onClick={() => onClick?.(primary)}
      title={primary.message}
    >
      {segment.text}
      {segment.annotations.length > 1 && (
        <sup className="text-[10px] text-gray-500 ml-0.5">{segment.annotations.length}</sup>
      )}
    </span>
  );
}

// =============================================================================
// ANNOTATION TOOLTIP
// =============================================================================

function AnnotationTooltip({ annotation }: { annotation: TextAnnotation }) {
  const style = ANNOTATION_STYLES[annotation.type]?.[annotation.severity]
    || ANNOTATION_STYLES.issue.minor;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 max-w-lg w-full mx-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 p-4 space-y-2">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${style.dot}`} />
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            {style.label}
          </span>
          <span className="text-xs text-gray-400">|</span>
          <span className="text-xs text-gray-500 capitalize">{annotation.category}</span>
        </div>
        <p className="text-sm font-medium text-gray-900">{annotation.message}</p>
        {annotation.suggestion && (
          <div className="pt-2 border-t border-gray-100">
            <p className="text-xs font-semibold text-blue-600 mb-0.5">Coaching Suggestion</p>
            <p className="text-sm text-gray-700">{annotation.suggestion}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// HIGHLIGHT LEGEND
// =============================================================================

function HighlightLegend({ annotations }: { annotations: TextAnnotation[] }) {
  const counts = useMemo(() => {
    const c = { strength: 0, issue: 0, red_flag: 0, ai_signal: 0, suggestion: 0 };
    for (const a of annotations) {
      c[a.type] = (c[a.type] || 0) + 1;
    }
    return c;
  }, [annotations]);

  const items = [
    { type: 'strength' as const, label: 'Strengths', color: 'bg-emerald-500', count: counts.strength },
    { type: 'issue' as const, label: 'Issues', color: 'bg-orange-500', count: counts.issue },
    { type: 'red_flag' as const, label: 'Red Flags', color: 'bg-red-500', count: counts.red_flag },
    { type: 'ai_signal' as const, label: 'AI Signals', color: 'bg-purple-500', count: counts.ai_signal },
    { type: 'suggestion' as const, label: 'Suggestions', color: 'bg-blue-500', count: counts.suggestion },
  ].filter(item => item.count > 0);

  return (
    <div className="flex flex-wrap items-center gap-3 px-4 py-2.5 bg-gray-50 rounded-lg border border-gray-200">
      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Annotations</span>
      <span className="w-px h-4 bg-gray-300" />
      {items.map(item => (
        <div key={item.type} className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${item.color}`} />
          <span className="text-xs text-gray-600">{item.label}</span>
          <span className="text-xs font-medium text-gray-800">({item.count})</span>
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// HELPERS
// =============================================================================

function getHighestPriorityAnnotation(annotations: TextAnnotation[]): TextAnnotation {
  const severityOrder = { critical: 0, major: 1, minor: 2, positive: 3 };
  const typeOrder = { red_flag: 0, issue: 1, ai_signal: 2, suggestion: 3, strength: 4 };

  return annotations.sort((a, b) => {
    const typeDiff = (typeOrder[a.type] ?? 5) - (typeOrder[b.type] ?? 5);
    if (typeDiff !== 0) return typeDiff;
    return (severityOrder[a.severity] ?? 5) - (severityOrder[b.severity] ?? 5);
  })[0];
}

function buildSegments(text: string, annotations: TextAnnotation[]): HighlightSegment[] {
  if (annotations.length === 0) {
    return [{ text, start: 0, end: text.length, annotations: [], isHighlighted: false }];
  }

  // Collect all boundary points
  const boundaries = new Set<number>();
  boundaries.add(0);
  boundaries.add(text.length);

  for (const ann of annotations) {
    if (ann.start_index >= 0 && ann.start_index <= text.length) {
      boundaries.add(ann.start_index);
    }
    if (ann.end_index >= 0 && ann.end_index <= text.length) {
      boundaries.add(ann.end_index);
    }
  }

  const sortedBoundaries = Array.from(boundaries).sort((a, b) => a - b);
  const segments: HighlightSegment[] = [];

  for (let i = 0; i < sortedBoundaries.length - 1; i++) {
    const start = sortedBoundaries[i];
    const end = sortedBoundaries[i + 1];
    const segText = text.slice(start, end);

    if (!segText) continue;

    // Find all annotations that cover this segment
    const coveringAnnotations = annotations.filter(
      ann => ann.start_index <= start && ann.end_index >= end
    );

    segments.push({
      text: segText,
      start,
      end,
      annotations: coveringAnnotations,
      isHighlighted: coveringAnnotations.length > 0,
    });
  }

  return segments;
}
