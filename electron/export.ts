import { BrowserWindow } from 'electron';
import fs from 'fs';
import path from 'path';
import { Report } from '../src/types';

export async function exportReport(
  format: 'pdf' | 'markdown',
  report: Report,
  savePath: string,
  win: BrowserWindow,
): Promise<void> {
  if (format === 'markdown') {
    const md = buildMarkdown(report);
    fs.writeFileSync(savePath, md, 'utf-8');
    return;
  }

  // PDF — use Electron's printToPDF
  const data = await win.webContents.printToPDF({
    printBackground: true,
    pageSize: 'A4',
    margins: { top: 0.5, bottom: 0.5, left: 0.5, right: 0.5 },
  });
  fs.writeFileSync(savePath, data);
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
      a.strategicRead.forEach((s, i) => lines.push(`${i + 1}. ${s}`));
      lines.push('');
    }
  }
  return lines.join('\n');
}
