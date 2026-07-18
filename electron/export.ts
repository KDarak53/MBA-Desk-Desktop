import { BrowserWindow } from 'electron';
import fs from 'fs';
import path from 'path';

// Inline to avoid cross-rootDir import
type Report = { upload: { filename: string; articleCount: number; createdAt: string }; articles: any[] };

export async function exportReport(
  format: 'markdown',
  report: Report,
  savePath: string,
  win: BrowserWindow,
): Promise<void> {
  const md = buildMarkdown(report);
  fs.writeFileSync(savePath, md, 'utf-8');
}

function buildMarkdown(report: Report): string {
  const lines: string[] = [];
  lines.push(`# MBA Intelligence Report — ${report.upload.filename}`);
  lines.push(`**Processed:** ${new Date(report.upload.createdAt).toLocaleString()}`);
  lines.push(`**Articles:** ${report.upload.articleCount}`);
  lines.push('');

  for (const a of report.articles) {
    lines.push(`---`);
    lines.push(`## ${a.headline}`);
    lines.push(`**Page:** ${a.page} | **Score:** ${a.relevanceScore}/5 | **Sector:** ${a.sector ?? '—'}`);
    lines.push(`**Functions:** ${a.functions.join(', ') || '—'}`);
    lines.push('');
    lines.push(`### Detailed Summary`);
    lines.push(a.detailedSummary);
    lines.push('');
    lines.push(`### Business Impact`);
    lines.push(a.businessImpact);
    lines.push('');

    if (a.swot) {
      lines.push(`### SWOT Analysis`);
      lines.push(`**Strengths:** ${a.swot.strengths.join(' | ')}`);
      lines.push(`**Weaknesses:** ${a.swot.weaknesses.join(' | ')}`);
      lines.push(`**Opportunities:** ${a.swot.opportunities.join(' | ')}`);
      lines.push(`**Threats:** ${a.swot.threats.join(' | ')}`);
      lines.push('');
    }

    if (a.strategicRead.length > 0) {
      lines.push(`### The Strategic Read`);
      a.strategicRead.forEach((s: string, i: number) => lines.push(`${i + 1}. ${s}`));
      lines.push('');
    }
  }
  return lines.join('\n');
}
