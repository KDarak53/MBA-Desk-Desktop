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
You are a business school analyst extracting and analysing articles from a newspaper PDF.

## Output format
Return ONLY a single JSON object: { "articles": [ ...one object per article... ] }

Each article object must have these exact keys:
- headline         (string, REQUIRED, never empty)
- page             (integer, the page number)
- summary          (string, 2-3 sentences, factual news-brief - what happened, who, numbers)
- detailed_summary (string, 4-6 sentences, fuller briefing for the detail page)
- business_impact  (string, 2-3 sentences, analyst voice - see voice rules)
- functions        (array - pick from ONLY: Finance, Operations, Marketing, HR, Product Management, Analytics, Consulting)
- relevance_score  (integer 1-5, REQUIRED, must vary - never stuck at 0 or 1 for all articles)
- sector           (string, e.g. "FMCG", "Banking", "Telecom" - or null)
- swot             (object, required for relevance_score >= 2)
- strategic_read   (array of 2-4 strings)

## swot object (required for relevance_score >= 2)
{
  "strengths":     ["1-3 bullets specific to the company or sector in this article"],
  "weaknesses":    ["1-3 bullets specific to the company or sector in this article"],
  "opportunities": ["1-3 bullets specific to the company or sector in this article"],
  "threats":       ["1-3 bullets specific to the company or sector in this article"]
}
Each bullet MUST be specific to this article. No generic filler. No copy-paste across articles.

## strategic_read (2-4 bullets)
Each bullet must:
- Connect one specific SWOT point to a concrete action or prediction
- Name the company or sector explicitly
- Pattern: "Because [Strength/Weakness/Opportunity/Threat], [Company] should/will [action] -- competitors without [X] should instead [Y]."

## VOICE RULES - strictly enforced
NEVER use these phrases: "this article", "the article", "this piece", "the passage",
"highlights", "demonstrates", "illustrates", "shows how", "the article states/notes/reports".

Write as if asserting business reality directly:
WRONG: "This article highlights a strategic shift toward profitability."
RIGHT: "BigBasket is pivoting from growth-at-all-costs to unit economics."

WRONG: "The article demonstrates how companies use M&A to enter markets."
RIGHT: "Tata's Air India acquisition is a bet that brand ownership beats code-sharing in premium travel."

Rules:
- summary: factual, news-brief style. State facts. No "the article says."
- detailed_summary: factual, extended briefing. Still no narrator voice.
- business_impact: analyst voice, direct assertions about the company/market.
- strategic_read: sharp, opinionated, each bullet derives from a specific SWOT point.
- functions: tag ONLY if there is a real, explainable implication for that function.
- Skip pure human-interest, sports, or entertainment content with no business angle.
`;

// ── User prompt (ASCII only) ───────────────────────────────────────────────────

const USER_PROMPT = `Extract and analyse every article from this newspaper PDF.

For each article, return: headline (REQUIRED, never empty), page, summary (2-3 sentences), detailed_summary (4-6 sentences), business_impact (2-3 sentences, analyst voice), functions (array), relevance_score (1-5, REQUIRED, must vary across articles), sector, swot (object with 4 arrays), strategic_read (2-4 bullets each linking a SWOT point to an action).

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
