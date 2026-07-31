import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import { saveReport } from './db';

// Inline types to avoid cross-rootDir imports
const FUNCTIONS = ['Finance','Operations','Marketing','HR','Product Management','Analytics','Consulting'] as const;
type FunctionTag = typeof FUNCTIONS[number];
interface Report { upload: { id: number; filename: string; pageCount: number; articleCount: number; createdAt: string }; articles: any[]; }

// ── Zod Schema ─────────────────────────────────────────────────────────────────

const FunctionEnum = z.enum([
  'Finance', 'Operations', 'Marketing', 'HR',
  'Product Management', 'Analytics', 'Consulting',
]);

const SwotSchema = z.object({
  strengths:     z.array(z.string()).default([]),
  weaknesses:    z.array(z.string()).default([]),
  opportunities: z.array(z.string()).default([]),
  threats:       z.array(z.string()).default([]),
});

const ArticleSchema = z.object({
  headline:         z.string().min(1),
  page:             z.number().int().positive().default(1),
  summary:          z.string().default(''),
  detailed_summary: z.string().default(''),
  business_impact:  z.string().default(''),
  functions: z.union([
    z.array(FunctionEnum),
    z.string().transform((s) => {
      try { return JSON.parse(s) as z.infer<typeof FunctionEnum>[]; }
      catch { return []; }
    }),
  ]).default([]),
  relevance_score: z.number().int().min(1).max(5),
  sector:          z.string().optional(),
  swot:            SwotSchema.optional(),
  strategic_read:  z.array(z.string()).default([]),
});

const ReportSchema = z.object({
  articles: z.array(ArticleSchema),
});

// ── System Prompt (ASCII only - no Unicode dashes or special chars) ────────────

const SYSTEM_INSTRUCTION = `
You are a senior business school professor and strategy analyst extracting high-impact business news from a newspaper PDF.

## Output format
Return ONLY a single JSON object: { "articles": [ ...one object per article... ] }

Each article object must have these exact keys:
- headline         (string, REQUIRED, never empty. Re-write the headline if the original is too vague to be impactful)
- page             (integer, the page number)
- summary          (string, 2-3 sentences, factual executive summary - what happened, who, numbers, core business event)
- detailed_summary (string, 4-6 sentences, fuller briefing diving into the mechanisms, financial implications, and competitive landscape)
- business_impact  (string, 2-3 sentences, sharp analyst voice - what does this mean for the industry or macroeconomic scenario)
- functions        (array - pick from ONLY: Finance, Operations, Marketing, HR, Product Management, Analytics, Consulting)
- relevance_score  (integer 1-5, REQUIRED. Use 4 and 5 ONLY for massive structural industry shifts or major M&A. Use 1 and 2 for minor local business updates.)
- sector           (string, e.g. "FMCG", "Banking", "Telecom" - or null)
- swot             (object, required for relevance_score >= 2)
- strategic_read   (array of 2-4 strings)

## swot object (required for relevance_score >= 2)
{
  "strengths":     ["1-3 sharp bullets specific to the company's core advantage in this scenario"],
  "weaknesses":    ["1-3 sharp bullets exposing structural vulnerabilities or risks mentioned or implied"],
  "opportunities": ["1-3 sharp bullets on whitespace, TAM expansion, or regulatory tailwinds"],
  "threats":       ["1-3 sharp bullets on competitive response, macro risks, or execution hurdles"]
}
Each bullet MUST be highly specific to this scenario. No generic filler (e.g., "strong brand name").

## strategic_read (2-4 bullets)
Each bullet must:
- Connect one specific SWOT point to a concrete strategic action or prediction.
- Act as a mini case-study lesson for an MBA student.
- Pattern: "Because [Company] faces [Weakness/Threat], they must [action] -- otherwise competitors like [Competitor] will capture [Market]."

## VOICE RULES - strictly enforced
NEVER use these phrases: "this article", "the article", "this piece", "the passage", "highlights", "demonstrates", "illustrates", "shows how", "the article states/notes/reports".

Write as if asserting business reality directly from the boardroom:
WRONG: "This article highlights a strategic shift toward profitability."
RIGHT: "BigBasket is pivoting from growth-at-all-costs to unit economics, signaling an end to ZIRP-era subsidies."

- Skip pure human-interest, sports, or entertainment content entirely. Only extract business, finance, macro, and strategic tech news.
`;

// ── User prompt (ASCII only) ───────────────────────────────────────────────────

const USER_PROMPT = `Extract and analyse the highest quality, most strategically important business articles from this newspaper PDF.
Prioritize M&A, macroeconomic shifts, regulatory changes, and major corporate strategy pivots over minor earnings beats or local news.

For each article, return: headline, page, summary, detailed_summary, business_impact, functions (array), relevance_score (1-5, rigorously graded), sector, swot (object), strategic_read (2-4 MBA-level takeaways).

CRITICAL VOICE RULE: Do NOT use "this article", "the article", "this piece", "highlights", "demonstrates", or "illustrates" anywhere in any field. State business reality directly.

Return ONLY valid JSON: { "articles": [ ... ] }`;

// Removed banned phrase check. It is too strict and rejects valid business phrasing like 'highlights'.
// ── Main export ────────────────────────────────────────────────────────────────

export async function processNewspaperPdf(filePath: string, apiKey: string, limit: string = 'all'): Promise<Report> {
  const ai = new GoogleGenAI({ apiKey });

  // Read as binary Buffer -> Blob so the SDK doesn't try string conversions on path
  const fileBuffer = fs.readFileSync(filePath);
  const fileBlob = new Blob([fileBuffer], { type: 'application/pdf' });
  const displayName = path.basename(filePath);

  console.log(`[gemini] Uploading ${displayName} (${(fileBuffer.length / 1024).toFixed(0)} KB)`);
  const fileUpload = await ai.files.upload({
    file: fileBlob,
    config: { displayName, mimeType: 'application/pdf' },
  });
  console.log(`[gemini] File uploaded: ${fileUpload.uri}`);

  try {
    let result: z.infer<typeof ReportSchema> | undefined;
    let retries = 2;

    while (retries >= 0) {
      try {
        let response;
        let attempt = 0;
        const maxAttempts = 5;

        while (attempt < maxAttempts) {
          try {
            response = await ai.models.generateContent({
              model: 'gemini-3.5-flash',
              contents: [{
                role: 'user',
                parts: [
                  { fileData: { fileUri: fileUpload.uri, mimeType: fileUpload.mimeType } },
                  { text: USER_PROMPT + (limit !== 'all' ? `\n\nONLY EXTRACT THE TOP ${limit} MOST IMPORTANT ARTICLES. DO NOT EXCEED THIS LIMIT.` : '') },
                ],
              }],
              config: {
                systemInstruction: SYSTEM_INSTRUCTION,
                responseMimeType: 'application/json',
                temperature: 0.3,
              },
            });
            break;
          } catch (err: any) {
            if ((err?.status === 429 || err?.error?.code === 429) && attempt < maxAttempts - 1) {
              const delay = Math.pow(2, attempt) * 2000;
              console.warn(`Rate limited, retrying in ${delay}ms`);
              await new Promise((r) => setTimeout(r, delay));
              attempt++;
              continue;
            }
            throw err;
          }
        }

        const text = response?.text || '{}';
        const parsed = JSON.parse(text);
        result = ReportSchema.parse(parsed);

        break; // success
      } catch (err: any) {
        retries--;
        console.warn('Generation failed, retries left:', retries, err.message);
        if (retries < 0) {
          throw new Error('Failed to generate a valid report: ' + err.message);
        }
      }
    }

    // Map Gemini output -> DB types -> save to SQLite
    const articles = (result!.articles).map((a) => ({
      headline:        a.headline,
      page:            a.page,
      summary:         a.summary,
      detailedSummary: a.detailed_summary,
      businessImpact:  a.business_impact,
      functions:       a.functions as any[],
      relevanceScore:  a.relevance_score,
      sector:          a.sector ?? null,
      swot:            a.swot ?? null,
      strategicRead:   a.strategic_read ?? [],
    }));

    const filename = filePath.split(/[/\\]/).pop() ?? 'newspaper.pdf';
    return saveReport(filename, articles);
  } finally {
    try {
      await ai.files.delete({ name: fileUpload.name ?? '' });
    } catch (e) {
      console.warn('Could not delete Gemini file:', e);
    }
  }
}
