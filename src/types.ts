// ── Shared types used by both renderer and electron main (via IPC) ─────────────

export const FUNCTIONS = [
  'Finance',
  'Operations',
  'Marketing',
  'HR',
  'Product Management',
  'Analytics',
  'Consulting',
] as const;

export type FunctionTag = typeof FUNCTIONS[number];

export interface SwotData {
  strengths:     string[];
  weaknesses:    string[];
  opportunities: string[];
  threats:       string[];
}

export interface Article {
  id:               number;
  uploadId:         number;
  headline:         string;
  page:             number;
  summary:          string;   // 2–3 sentences — card teaser
  detailedSummary:  string;   // 4–6 sentences — detail page
  businessImpact:   string;
  functions:        FunctionTag[];
  relevanceScore:   number;
  sector:           string | null;
  swot:             SwotData | null;
  strategicRead:    string[];
  createdAt:        string;
}

export interface Upload {
  id:          number;
  filename:    string;
  pageCount:   number;
  articleCount: number;
  createdAt:   string;
}

export interface Report {
  upload:   Upload;
  articles: Article[];
}

export interface AppConfig {
  geminiApiKey: string;
}

// IPC channel names (single source of truth)
export const IPC = {
  PICK_PDF:        'pick-pdf',
  PROCESS_PDF:     'process-pdf',
  GET_REPORT:      'get-report',
  GET_ALL_UPLOADS: 'get-all-uploads',
  DELETE_UPLOAD:   'delete-upload',
  GET_CONFIG:      'get-config',
  SAVE_CONFIG:     'save-config',
  EXPORT_REPORT:   'export-report',
  OPEN_DATA_DIR:   'open-data-dir',
} as const;
