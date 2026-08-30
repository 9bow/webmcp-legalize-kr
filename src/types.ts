export interface LawIndexEntry {
  id: string;
  name: string;
  path: string;
}

export interface LawIndex {
  generatedAt: string;
  count: number;
  entries: LawIndexEntry[];
}

export interface LawMetadata {
  name: string;
  mst?: string;
  lawId?: string;
  promulgationDate?: string;
  effectiveDate?: string;
  sourceUrl: string;
}

export interface LawArticle {
  label: string;
  title: string;
  text: string;
}

export interface LawSnapshot {
  law: LawIndexEntry;
  requestedDate: string;
  commitSha: string;
  commitDate: string;
  metadata: LawMetadata;
  articles: LawArticle[];
  githubUrl: string;
}

export type LawSnapshotReference = Omit<LawSnapshot, "articles">;

export interface ArticleResult {
  law: LawIndexEntry;
  requestedDate: string;
  commitSha: string;
  commitDate: string;
  article: LawArticle;
  source: {
    originalUrl: string;
    archivedVersionUrl: string;
    attribution: string;
  };
  disclaimer: string;
}

export type DiffStatus = "added" | "removed" | "changed" | "unchanged";

export interface ArticleDiff {
  label: string;
  title: string;
  status: DiffStatus;
  before?: LawArticle;
  after?: LawArticle;
}

export interface ComparisonResult {
  law: LawIndexEntry;
  articleLabel: string;
  before: LawSnapshotReference;
  after: LawSnapshotReference;
  diff: ArticleDiff;
  source: {
    originalUrl: string;
    beforeVersionUrl: string;
    afterVersionUrl: string;
    attribution: string;
  };
  disclaimer: string;
}

export interface ReviewBrief {
  question: string;
  heading: string;
  finding: string;
  changeStatus: DiffStatus;
  beforeExcerpt: string;
  afterExcerpt: string;
  citations: Array<{ label: string; url: string }>;
  reviewChecks: string[];
  disclaimer: string;
}

export const DISCLAIMER =
  "This workspace supports source review and does not provide legal advice. Verify conclusions against the official text and seek qualified advice when needed.";
