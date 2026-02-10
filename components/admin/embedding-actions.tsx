'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, RotateCcw, Trash2, Plus } from 'lucide-react';

// =============================================================================
// Rebuild Missing Embeddings Button
// =============================================================================

interface RebuildButtonProps {
  totalMissing: number;
}

export function RebuildButton({ totalMissing }: RebuildButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function handleRebuild() {
    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/admin/embeddings/rebuild', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'all' }),
      });

      const data = await response.json();

      if (data.success) {
        setResult(data.message);
      } else {
        setResult(`Error: ${data.error}`);
      }
    } catch {
      setResult('Failed to trigger rebuild. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button
        onClick={handleRebuild}
        disabled={isLoading || totalMissing === 0}
        variant={totalMissing > 0 ? 'default' : 'outline'}
        className="w-full sm:w-auto"
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <RotateCcw className="w-4 h-4 mr-2" />
        )}
        {isLoading ? 'Processing...' : 'Rebuild Missing Embeddings'}
      </Button>
      {result && (
        <p className="text-sm text-neutral-600 dark:text-neutral-400">{result}</p>
      )}
    </div>
  );
}

// =============================================================================
// Delete Item Button
// =============================================================================

interface DeleteItemButtonProps {
  id: string;
  label?: string;
}

export function DeleteItemButton({ id, label = 'Delete' }: DeleteItemButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  async function handleDelete() {
    if (!isConfirming) {
      setIsConfirming(true);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`/api/admin/embeddings/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        window.location.reload();
      }
    } catch {
      setIsLoading(false);
      setIsConfirming(false);
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleDelete}
      disabled={isLoading}
      className={isConfirming ? 'text-error-600 hover:text-error-700' : 'text-neutral-500'}
    >
      {isLoading ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : (
        <Trash2 className="w-3 h-3" />
      )}
      <span className="ml-1 text-xs">{isConfirming ? 'Confirm?' : label}</span>
    </Button>
  );
}

// =============================================================================
// Add New Entry Form (modal-like)
// =============================================================================

interface AddEntryFormProps {
  type: 'example_essay' | 'feedback_pattern' | 'school_insight';
  typeLabel: string;
}

export function AddEntryButton({ type, typeLabel }: AddEntryFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data: Record<string, unknown> = {};

    formData.forEach((value, key) => {
      const strValue = value.toString().trim();
      if (strValue === '') return;

      // Handle array fields (comma-separated)
      if (['themeTags', 'keyTechniques', 'essayTypes'].includes(key)) {
        data[key] = strValue.split(',').map((s) => s.trim()).filter(Boolean);
      } else if (['severity', 'relevanceScore'].includes(key)) {
        data[key] = parseFloat(strValue);
      } else {
        data[key] = strValue;
      }
    });

    try {
      const response = await fetch('/api/admin/embeddings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, data }),
      });

      const result = await response.json();

      if (result.success) {
        setIsOpen(false);
        window.location.reload();
      } else {
        setError(result.error || 'Failed to create entry');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  if (!isOpen) {
    return (
      <Button variant="outline" size="sm" onClick={() => setIsOpen(true)}>
        <Plus className="w-3 h-3 mr-1" />
        Add {typeLabel}
      </Button>
    );
  }

  return (
    <Card className="border-2 border-brand-200 mt-3">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Add New {typeLabel}</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          {type === 'example_essay' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField name="schoolId" label="School ID" required placeholder="e.g., harvard" />
                <FormField name="essayType" label="Essay Type" required placeholder="e.g., PERSONAL_STATEMENT" />
                <FormField name="outcome" label="Outcome" placeholder="e.g., ACCEPTED" />
                <FormField name="scoreRange" label="Score Range" placeholder="e.g., 90-100" />
              </div>
              <FormField name="contentSnippet" label="Content Snippet" required textarea placeholder="200-500 word excerpt (anonymized)" />
              <FormField name="contentHash" label="Content Hash" required placeholder="Unique hash for deduplication" />
              <FormField name="themeTags" label="Theme Tags" placeholder="Comma-separated: overcoming-adversity, intellectual-curiosity" />
              <FormField name="spikeCategory" label="Spike Category" placeholder="e.g., stem-research" />
              <FormField name="strengthNotes" label="Strength Notes" textarea placeholder="What made this essay work" />
              <FormField name="keyTechniques" label="Key Techniques" placeholder="Comma-separated: in-medias-res, circular-structure" />
            </>
          )}

          {type === 'feedback_pattern' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField name="issueType" label="Issue Type" required placeholder="e.g., generic_opening" />
                <FormField name="issueCategory" label="Issue Category" required placeholder="e.g., structure, content, style, fit" />
                <FormField name="essayType" label="Essay Type" placeholder="Which essay types this applies to" />
                <FormField name="schoolId" label="School ID" placeholder="School-specific (optional)" />
              </div>
              <FormField name="patternName" label="Pattern Name" required placeholder="Human-readable name" />
              <FormField name="description" label="Description" required textarea placeholder="Full description of the pattern" />
              <FormField name="exampleBefore" label="Example Before" textarea placeholder="Original problematic text" />
              <FormField name="exampleAfter" label="Example After" textarea placeholder="Improved version" />
              <FormField name="fixStrategy" label="Fix Strategy" textarea placeholder="How to fix it" />
              <FormField name="severity" label="Severity (1-5)" placeholder="3" />
            </>
          )}

          {type === 'school_insight' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField name="schoolId" label="School ID" required placeholder="e.g., harvard" />
                <FormField name="insightType" label="Insight Type" required placeholder="e.g., ao_quote, student_tip, common_mistake" />
              </div>
              <FormField name="content" label="Content" required textarea placeholder="The insight content" />
              <FormField name="source" label="Source" placeholder="Where this came from" />
              <FormField name="essayTypes" label="Essay Types" placeholder="Comma-separated: PERSONAL_STATEMENT, WHY_US" />
              <FormField name="relevanceScore" label="Relevance Score (1-5)" placeholder="3" />
            </>
          )}

          {error && (
            <div className="p-3 bg-error-50 border border-error-200 rounded-lg">
              <p className="text-sm text-error-700">{error}</p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create Entry
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// =============================================================================
// Form Field Helper
// =============================================================================

function FormField({
  name,
  label,
  required = false,
  placeholder,
  textarea = false,
}: {
  name: string;
  label: string;
  required?: boolean;
  placeholder?: string;
  textarea?: boolean;
}) {
  const baseClasses =
    'w-full px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent';

  return (
    <div>
      <label htmlFor={name} className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
        {label}
        {required && <span className="text-error-500 ml-0.5">*</span>}
      </label>
      {textarea ? (
        <textarea
          id={name}
          name={name}
          required={required}
          placeholder={placeholder}
          rows={3}
          className={baseClasses}
        />
      ) : (
        <input
          id={name}
          name={name}
          type="text"
          required={required}
          placeholder={placeholder}
          className={baseClasses}
        />
      )}
    </div>
  );
}

// =============================================================================
// Embedding Status Dot
// =============================================================================

export function EmbeddingStatusDot({ hasEmbedding }: { hasEmbedding: boolean }) {
  return (
    <span
      className={`inline-block w-2.5 h-2.5 rounded-full ${
        hasEmbedding
          ? 'bg-success-500'
          : 'bg-error-400'
      }`}
      title={hasEmbedding ? 'Has embedding' : 'Missing embedding'}
    />
  );
}

// =============================================================================
// Active/Inactive Badge
// =============================================================================

export function ActiveBadge({ isActive }: { isActive: boolean }) {
  return (
    <Badge variant={isActive ? 'success' : 'secondary'} size="sm">
      {isActive ? 'Active' : 'Inactive'}
    </Badge>
  );
}
