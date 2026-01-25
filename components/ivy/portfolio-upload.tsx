'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { IVY_SCHOOLS, IvySchoolBadge } from './school-selector';
import { cn } from '@/lib/utils/cn';
import {
  Plus,
  Trash2,
  FileText,
  ChevronDown,
  ChevronUp,
  Check,
  AlertCircle,
  Info,
} from 'lucide-react';

// Essay prompts for each school (simplified version - in production would come from ivy-league.ts)
const SCHOOL_PROMPTS: Record<string, { id: string; title: string; wordLimit: number; required: boolean }[]> = {
  harvard: [
    { id: 'harvard-supplement', title: 'Harvard Supplement (Diversity & Contribution)', wordLimit: 200, required: true },
    { id: 'harvard-intellectual', title: 'Intellectual Experience', wordLimit: 200, required: false },
    { id: 'harvard-activities', title: 'Activities & Experiences', wordLimit: 200, required: false },
  ],
  yale: [
    { id: 'yale-why', title: 'Why Yale?', wordLimit: 125, required: true },
    { id: 'yale-contribution', title: 'What will you contribute?', wordLimit: 125, required: true },
    { id: 'yale-engaged', title: 'Engaged with Topic', wordLimit: 400, required: true },
  ],
  princeton: [
    { id: 'princeton-extracurricular', title: 'Extracurricular Activity', wordLimit: 150, required: true },
    { id: 'princeton-community', title: 'Community Contribution', wordLimit: 250, required: true },
    { id: 'princeton-engineering', title: 'Engineering Essay (if applicable)', wordLimit: 300, required: false },
  ],
  columbia: [
    { id: 'columbia-list-books', title: 'List of Books', wordLimit: 150, required: true },
    { id: 'columbia-why', title: 'Why Columbia?', wordLimit: 200, required: true },
    { id: 'columbia-community', title: 'Community Impact', wordLimit: 150, required: true },
  ],
  brown: [
    { id: 'brown-open-curriculum', title: 'Open Curriculum', wordLimit: 200, required: true },
    { id: 'brown-identity', title: 'Community & Identity', wordLimit: 200, required: true },
    { id: 'brown-why', title: 'Why Brown?', wordLimit: 250, required: true },
  ],
  dartmouth: [
    { id: 'dartmouth-community', title: 'Community Membership', wordLimit: 250, required: true },
    { id: 'dartmouth-why', title: 'Why Dartmouth?', wordLimit: 100, required: true },
  ],
  cornell: [
    { id: 'cornell-college', title: 'College-Specific Essay', wordLimit: 650, required: true },
    { id: 'cornell-why', title: 'Why Cornell?', wordLimit: 350, required: true },
  ],
  upenn: [
    { id: 'upenn-why', title: 'Why Penn?', wordLimit: 450, required: true },
    { id: 'upenn-community', title: 'Community Contribution', wordLimit: 200, required: true },
  ],
};

interface Essay {
  promptId: string;
  content: string;
}

interface PortfolioUploadProps {
  selectedSchools: string[];
  essaysBySchool: Record<string, Essay[]>;
  onEssaysUpdate: (schoolId: string, essays: Essay[]) => void;
}

export function IvyPortfolioUpload({
  selectedSchools,
  essaysBySchool,
  onEssaysUpdate,
}: PortfolioUploadProps) {
  const [expandedSchools, setExpandedSchools] = useState<Set<string>>(new Set(selectedSchools.slice(0, 1)));

  const toggleSchool = (schoolId: string) => {
    setExpandedSchools(prev => {
      const next = new Set(prev);
      if (next.has(schoolId)) {
        next.delete(schoolId);
      } else {
        next.add(schoolId);
      }
      return next;
    });
  };

  const addEssay = (schoolId: string) => {
    const prompts = SCHOOL_PROMPTS[schoolId] || [];
    const currentEssays = essaysBySchool[schoolId] || [];
    const usedPromptIds = new Set(currentEssays.map(e => e.promptId));
    const nextPrompt = prompts.find(p => !usedPromptIds.has(p.id));

    if (nextPrompt) {
      onEssaysUpdate(schoolId, [
        ...currentEssays,
        { promptId: nextPrompt.id, content: '' },
      ]);
    }
  };

  const removeEssay = (schoolId: string, index: number) => {
    const currentEssays = essaysBySchool[schoolId] || [];
    onEssaysUpdate(
      schoolId,
      currentEssays.filter((_, i) => i !== index)
    );
  };

  const updateEssayContent = (schoolId: string, index: number, content: string) => {
    const currentEssays = essaysBySchool[schoolId] || [];
    onEssaysUpdate(
      schoolId,
      currentEssays.map((essay, i) => (i === index ? { ...essay, content } : essay))
    );
  };

  const updateEssayPrompt = (schoolId: string, index: number, promptId: string) => {
    const currentEssays = essaysBySchool[schoolId] || [];
    onEssaysUpdate(
      schoolId,
      currentEssays.map((essay, i) => (i === index ? { ...essay, promptId } : essay))
    );
  };

  const getSchoolCompletionStatus = (schoolId: string) => {
    const essays = essaysBySchool[schoolId] || [];
    const hasEssays = essays.length > 0;
    const allHaveContent = essays.every(e => e.content.trim().length > 0);
    return { hasEssays, allHaveContent, count: essays.length };
  };

  return (
    <div className="space-y-4">
      {selectedSchools.map((schoolId) => {
        const school = IVY_SCHOOLS.find(s => s.id === schoolId);
        const prompts = SCHOOL_PROMPTS[schoolId] || [];
        const essays = essaysBySchool[schoolId] || [];
        const isExpanded = expandedSchools.has(schoolId);
        const status = getSchoolCompletionStatus(schoolId);

        return (
          <Card key={schoolId} className={cn(status.hasEssays && status.allHaveContent && 'border-green-200')}>
            <CardHeader
              className="cursor-pointer select-none"
              onClick={() => toggleSchool(schoolId)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: school?.color || '#666' }}
                  >
                    {school?.name[0] || '?'}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{school?.fullName || schoolId}</CardTitle>
                    <CardDescription>
                      {prompts.length} essay{prompts.length !== 1 ? 's' : ''} available
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {status.hasEssays && (
                    <Badge variant={status.allHaveContent ? 'success' : 'warning'}>
                      {status.allHaveContent ? (
                        <Check className="w-3 h-3 mr-1" />
                      ) : (
                        <AlertCircle className="w-3 h-3 mr-1" />
                      )}
                      {status.count} essay{status.count !== 1 ? 's' : ''}
                    </Badge>
                  )}
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-neutral-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-neutral-400" />
                  )}
                </div>
              </div>
            </CardHeader>

            {isExpanded && (
              <CardContent className="space-y-6">
                {/* Existing essays */}
                {essays.map((essay, index) => {
                  const prompt = prompts.find(p => p.id === essay.promptId);
                  const wordCount = essay.content.trim().split(/\s+/).filter(Boolean).length;
                  const isOverLimit = prompt && wordCount > prompt.wordLimit;

                  return (
                    <div key={index} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <Label htmlFor={`prompt-${schoolId}-${index}`}>Essay Prompt</Label>
                          <select
                            id={`prompt-${schoolId}-${index}`}
                            value={essay.promptId}
                            onChange={(e) => updateEssayPrompt(schoolId, index, e.target.value)}
                            className="mt-1 w-full px-3 py-2 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                          >
                            {prompts.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.title} ({p.wordLimit} words){p.required ? ' - Required' : ''}
                              </option>
                            ))}
                          </select>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeEssay(schoolId, index)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <Label htmlFor={`essay-${schoolId}-${index}`}>Essay Content</Label>
                          <span
                            className={cn(
                              'text-xs',
                              isOverLimit ? 'text-red-600 font-medium' : 'text-neutral-500'
                            )}
                          >
                            {wordCount} / {prompt?.wordLimit || '?'} words
                            {isOverLimit && ' (over limit!)'}
                          </span>
                        </div>
                        <Textarea
                          id={`essay-${schoolId}-${index}`}
                          placeholder="Paste or type your essay here..."
                          value={essay.content}
                          onChange={(e) => updateEssayContent(schoolId, index, e.target.value)}
                          className={cn(
                            'min-h-[200px] resize-y',
                            isOverLimit && 'border-red-300 focus:ring-red-500'
                          )}
                        />
                      </div>

                      {prompt && (
                        <div className="flex items-start gap-2 text-xs text-neutral-500 bg-neutral-50 rounded-lg p-3">
                          <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                          <span>
                            {prompt.required
                              ? 'This is a required essay for this school.'
                              : 'This is an optional essay - but recommended if you have something meaningful to add.'}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Add essay button */}
                {essays.length < prompts.length && (
                  <Button
                    variant="outline"
                    onClick={() => addEssay(schoolId)}
                    className="w-full border-dashed"
                  >
                    <Plus className="w-4 h-4" />
                    Add Essay
                  </Button>
                )}

                {/* Empty state */}
                {essays.length === 0 && (
                  <div className="text-center py-8 text-neutral-500">
                    <FileText className="w-10 h-10 mx-auto mb-3 text-neutral-300" />
                    <p className="mb-4">No essays added yet for {school?.name}</p>
                    <Button onClick={() => addEssay(schoolId)}>
                      <Plus className="w-4 h-4" />
                      Add Your First Essay
                    </Button>
                  </div>
                )}

                {/* School-specific tip */}
                {essays.length > 0 && (
                  <div className="bg-brand-50 rounded-lg p-4">
                    <p className="text-sm text-brand-800">
                      <strong>Tip:</strong> Add all essays you&apos;re submitting to {school?.name} to get a full portfolio analysis.
                      We&apos;ll check for thematic coherence and ensure your essays tell a complete story.
                    </p>
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        );
      })}

      {/* Summary */}
      <Card className="bg-neutral-50">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-neutral-400" />
              <span className="text-sm text-neutral-600">
                Total: {Object.values(essaysBySchool).flat().length} essay{Object.values(essaysBySchool).flat().length !== 1 ? 's' : ''} across {selectedSchools.length} school{selectedSchools.length !== 1 ? 's' : ''}
              </span>
            </div>
            {Object.values(essaysBySchool).flat().some(e => !e.content.trim()) && (
              <Badge variant="warning">
                <AlertCircle className="w-3 h-3" />
                Some essays are empty
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
