'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AnalyzingScreen } from './analyzing-screen';
import { ArrowLeft, Download, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import Link from 'next/link';
import { downloadPDFReport } from '@/lib/pdf/export';

export function EssayDetailView({ essay, userName, userEmail }: { essay: any; userName: string; userEmail: string }) {
  const latestVersion = essay.versions[0];
  const latestAnalysis = latestVersion?.analyses[0];
  const latestOrder = essay.orders[0];
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(latestAnalysis?.analysisJson || null);

  // Check if we need to show analyzing screen
  useEffect(() => {
    if (latestOrder?.status === 'PAID' && !latestAnalysis) {
      setIsAnalyzing(true);

      // Poll for analysis completion
      const pollInterval = setInterval(async () => {
        const res = await fetch(`/api/essays/${essay.id}`);
        if (res.ok) {
          const data = await res.json();
          const newAnalysis = data.essay?.versions[0]?.analyses[0];
          if (newAnalysis) {
            setAnalysis(newAnalysis.analysisJson);
            setIsAnalyzing(false);
            clearInterval(pollInterval);
            window.location.reload(); // Refresh to show results
          }
        }
      }, 3000); // Poll every 3 seconds

      return () => clearInterval(pollInterval);
    }
  }, [essay.id, latestOrder, latestAnalysis]);

  if (isAnalyzing) {
    return <AnalyzingScreen />;
  }

  if (!analysis) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="w-12 h-12 mx-auto text-yellow-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Analysis Pending</h3>
            <p className="text-gray-600 mb-4">
              Complete payment to receive AI analysis
            </p>
            <Link href="/pricing">
              <Button>Choose Package</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const scores = analysis.scores;
  const commonsCheck = analysis.commons_check;
  const suggestions = analysis.suggestions;
  const overall = analysis.overall;
  const wordCount = latestVersion.content.split(/\s+/).length;

  const handleExportPDF = () => {
    downloadPDFReport({
      userName,
      essayType: essay.type.replace(/_/g, ' '),
      school: essay.targetSchool,
      wordCount,
      essayContent: latestVersion.content,
      analysis: {
        overallScore: Math.round(overall.score_100),
        scores,
        commonsCheck,
        suggestions,
        overall,
      },
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/dashboard">
            <Button variant="ghost">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Essay Analysis</h1>
          <Button variant="outline" onClick={handleExportPDF}>
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Overall Score */}
        <Card className="mb-6 border-2 border-blue-500">
          <CardHeader>
            <CardTitle className="text-3xl">Overall Score</CardTitle>
            <CardDescription>Weighted across all dimensions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-8">
              <div className="text-6xl font-bold text-blue-600">
                {Math.round(overall.score_100)}
                <span className="text-3xl text-gray-600">/100</span>
              </div>
              <div className="flex-1">
                <p className="text-lg mb-2">{overall.summary}</p>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-purple-600 h-4 rounded-full"
                    style={{ width: `${overall.score_100}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Left Column: Scores */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Rubric Scores</h2>

            {/* Authenticity */}
            <ScoreCard
              title="Authenticity & Voice"
              score={scores.authenticity.score}
              rationales={scores.authenticity.rationales}
              weight="20%"
            />

            {/* Reflection */}
            <ScoreCard
              title="Reflection & Insight"
              score={scores.reflection.score}
              rationales={scores.reflection.rationales}
              weight="20%"
            />

            {/* Structure */}
            <ScoreCard
              title="Narrative Structure"
              score={scores.structure.score}
              rationales={scores.structure.rationales}
              weight="15%"
            />

            {/* Specificity */}
            <ScoreCard
              title="Specificity & School Fit"
              score={scores.specificity_fit.score}
              rationales={scores.specificity_fit.rationales}
              weight="15%"
            />

            {/* Clarity */}
            <ScoreCard
              title="Clarity & Style"
              score={scores.clarity_style.score}
              rationales={scores.clarity_style.rationales}
              weight="10%"
            />

            {/* Mechanics */}
            <ScoreCard
              title="Mechanics"
              score={scores.mechanics.score}
              rationales={scores.mechanics.rationales}
              weight="10%"
            />

            {/* Ethics */}
            <ScoreCard
              title="Ethics & Originality"
              score={scores.ethics_originality.score}
              rationales={scores.ethics_originality.rationales}
              weight="10%"
            />
          </div>

          {/* Right Column: Suggestions & Flags */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Action Items</h2>

            {/* Next Actions Checklist */}
            <Card>
              <CardHeader>
                <CardTitle>Next Steps</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {overall.next_actions_checklist.map((action: string, idx: number) => (
                    <li key={idx} className="flex gap-2">
                      <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Top 5 Fixes */}
            <Card>
              <CardHeader>
                <CardTitle>Top 5 Improvements</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {suggestions.top5.map((fix: any, idx: number) => (
                  <div key={idx} className="border-l-4 border-blue-500 pl-4">
                    <h4 className="font-semibold">{fix.issue}</h4>
                    <p className="text-sm text-gray-600 mt-1">{fix.why_it_matters}</p>
                    <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
                      <strong>Example:</strong> {fix.example_edit}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Commons Check Flags */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Checks</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {Object.entries(commonsCheck).map(([key, value]: [string, any]) => {
                  const isGood = key.includes('goals_articulated') || key.includes('about_applicant');
                  const flagStatus = isGood ? value.flag : !value.flag;

                  return (
                    <div key={key} className="flex items-start gap-2">
                      {flagStatus ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <span className="font-medium">
                          {key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                        </span>
                        {value.evidence && value.evidence.length > 0 && (
                          <p className="text-sm text-gray-600 mt-1">
                            {value.evidence[0]}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

function ScoreCard({
  title,
  score,
  rationales,
  weight,
}: {
  title: string;
  score: number;
  rationales: string[];
  weight: string;
}) {
  const percentage = (score / 6) * 100;
  const color = score >= 5 ? 'bg-green-500' : score >= 3 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-semibold">{title}</h3>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">{weight}</span>
            <span className="text-2xl font-bold">
              {score}<span className="text-sm text-gray-600">/6</span>
            </span>
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
          <div
            className={`${color} h-2 rounded-full transition-all`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <ul className="space-y-1">
          {rationales.map((rationale, idx) => (
            <li key={idx} className="text-sm text-gray-700 flex gap-2">
              <span className="text-blue-600">•</span>
              <span>{rationale}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
