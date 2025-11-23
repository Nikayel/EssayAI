import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface EssayExportData {
  userName: string;
  essayType: string;
  school?: string;
  wordCount: number;
  essayContent: string;
  analysis: {
    overallScore: number;
    scores: Record<string, { score: number; rationales: string[] }>;
    commonsCheck: Record<string, { flag: boolean; evidence?: string[] }>;
    suggestions: {
      top5: Array<{ issue: string; why_it_matters: string; example_edit: string }>;
    };
    overall: {
      summary: string;
      next_actions_checklist: string[];
    };
  };
}

/**
 * Generate PDF report for essay analysis
 */
export function generatePDFReport(data: EssayExportData): jsPDF {
  const doc = new jsPDF();
  let yPos = 20;

  // Header
  doc.setFontSize(22);
  doc.setTextColor(37, 99, 235); // Blue
  doc.text('EssayEdge AI Analysis Report', 20, yPos);

  yPos += 10;
  doc.setFontSize(10);
  doc.setTextColor(107, 114, 128); // Gray
  doc.text(new Date().toLocaleDateString(), 20, yPos);

  // Student Info
  yPos += 15;
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text('Student Information', 20, yPos);

  yPos += 8;
  doc.setFontSize(10);
  doc.text(`Name: ${data.userName}`, 20, yPos);
  yPos += 6;
  doc.text(`Essay Type: ${data.essayType}`, 20, yPos);
  if (data.school) {
    yPos += 6;
    doc.text(`Target School: ${data.school}`, 20, yPos);
  }
  yPos += 6;
  doc.text(`Word Count: ${data.wordCount}`, 20, yPos);

  // Overall Score
  yPos += 15;
  doc.setFontSize(18);
  doc.setTextColor(16, 185, 129); // Green
  doc.text(`Overall Score: ${data.analysis.overallScore}/100`, 20, yPos);

  yPos += 8;
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  const summaryLines = doc.splitTextToSize(data.analysis.overall.summary, 170);
  doc.text(summaryLines, 20, yPos);
  yPos += summaryLines.length * 6 + 10;

  // Rubric Scores Table
  if (yPos > 250) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFontSize(14);
  doc.text('Rubric Breakdown', 20, yPos);
  yPos += 5;

  const rubricData = Object.entries(data.analysis.scores).map(([dimension, { score, rationales }]) => [
    dimension.replace(/_/g, ' ').toUpperCase(),
    `${score}/6`,
    rationales.join('; '),
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [['Dimension', 'Score', 'Rationale']],
    body: rubricData,
    theme: 'grid',
    headStyles: { fillColor: [37, 99, 235] },
    columnStyles: {
      0: { cellWidth: 40 },
      1: { cellWidth: 20 },
      2: { cellWidth: 120 },
    },
  });

  yPos = (doc as any).lastAutoTable.finalY + 15;

  // Top 5 Suggestions
  if (yPos > 250) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFontSize(14);
  doc.text('Top 5 Improvement Suggestions', 20, yPos);
  yPos += 10;

  data.analysis.suggestions.top5.forEach((suggestion, idx) => {
    if (yPos > 270) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text(`${idx + 1}. ${suggestion.issue}`, 20, yPos);
    yPos += 6;

    doc.setFont(undefined, 'normal');
    doc.setFontSize(9);

    const whyLines = doc.splitTextToSize(`Why it matters: ${suggestion.why_it_matters}`, 170);
    doc.text(whyLines, 25, yPos);
    yPos += whyLines.length * 5 + 4;

    const exampleLines = doc.splitTextToSize(`Example: ${suggestion.example_edit}`, 170);
    doc.setTextColor(59, 130, 246); // Blue for examples
    doc.text(exampleLines, 25, yPos);
    doc.setTextColor(0, 0, 0);
    yPos += exampleLines.length * 5 + 8;
  });

  // Next Steps Checklist
  if (yPos > 250) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFontSize(14);
  doc.text('Next Steps Checklist', 20, yPos);
  yPos += 10;

  data.analysis.overall.next_actions_checklist.forEach((action, idx) => {
    if (yPos > 280) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(10);
    doc.text(`☐ ${action}`, 25, yPos);
    yPos += 7;
  });

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128);
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.text(
      `Page ${i} of ${pageCount} | EssayEdge AI Report | Confidential`,
      105,
      290,
      { align: 'center' }
    );
  }

  return doc;
}

/**
 * Download PDF report
 */
export function downloadPDFReport(data: EssayExportData, filename?: string) {
  const doc = generatePDFReport(data);
  const finalFilename = filename || `essay-analysis-${Date.now()}.pdf`;
  doc.save(finalFilename);
}
