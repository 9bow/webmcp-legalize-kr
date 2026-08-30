import type {
  ArticleDiff,
  ArticleResult,
  ComparisonResult,
  LawArticle,
  LawIndex,
  LawIndexEntry,
  LawMetadata,
  LawSnapshot,
  LawSnapshotReference,
  ReviewBrief,
} from "./types";
import { DISCLAIMER } from "./types";

const REPOSITORY = "legalize-kr/legalize-kr";
const API_ROOT = `https://api.github.com/repos/${REPOSITORY}`;
const RAW_ROOT = `https://raw.githubusercontent.com/${REPOSITORY}`;
const ARCHIVE_ROOT = `https://github.com/${REPOSITORY}/blob`;
const ATTRIBUTION =
  "Source: Korea Ministry of Government Legislation, Korean Law Information Center (law.go.kr), archived by Legalize-KR.";

let lawIndexPromise: Promise<LawIndex> | undefined;

export class LawDataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LawDataError";
  }
}

function normalizeSearchValue(value: string): string {
  return value.normalize("NFKC").replace(/[\s·ㆍᆞ・]/g, "").toLocaleLowerCase("ko");
}

export function searchLawIndex(
  entries: LawIndexEntry[],
  query: string,
  limit = 8,
): LawIndexEntry[] {
  const normalizedQuery = normalizeSearchValue(query.trim());
  if (!normalizedQuery) return [];

  return entries
    .map((entry) => {
      const name = normalizeSearchValue(entry.name);
      const position = name.indexOf(normalizedQuery);
      return {
        entry,
        score: position === 0 ? 0 : position > 0 ? position + 10 : Number.POSITIVE_INFINITY,
      };
    })
    .filter(({ score }) => Number.isFinite(score))
    .sort((left, right) => left.score - right.score || left.entry.name.localeCompare(right.entry.name, "ko"))
    .slice(0, Math.max(1, Math.min(limit, 20)))
    .map(({ entry }) => entry);
}

export async function loadLawIndex(signal?: AbortSignal): Promise<LawIndex> {
  lawIndexPromise ??= fetch("/data/laws.json", { signal }).then(async (response) => {
    if (!response.ok) throw new LawDataError("The bundled statute index could not be loaded.");
    return (await response.json()) as LawIndex;
  });
  return lawIndexPromise;
}

export function parseLawMarkdown(markdown: string): {
  metadata: LawMetadata;
  articles: LawArticle[];
} {
  const frontMatterMatch = markdown.match(/^---\n([\s\S]*?)\n---/);
  const frontMatter = frontMatterMatch?.[1] ?? "";
  const field = (name: string): string | undefined => {
    const match = frontMatter.match(new RegExp(`^${name}:\\s*(.*)$`, "m"));
    return match?.[1]?.trim().replace(/^['"]|['"]$/g, "") || undefined;
  };

  const name = field("제목") ?? "Unknown statute";
  const sourceUrl = field("출처") ?? `https://www.law.go.kr/법령/${encodeURIComponent(name)}`;
  const body = frontMatterMatch ? markdown.slice(frontMatterMatch[0].length) : markdown;
  const headingPattern = /^#####\s+(제\d+조(?:의\d+)?)\s*(?:\(([^\n)]*)\))?\s*$/gm;
  const headings = [...body.matchAll(headingPattern)];
  const articles = headings.map((match, index) => {
    const start = (match.index ?? 0) + match[0].length;
    const nextArticle = headings[index + 1]?.index ?? body.length;
    const nextStructuralHeading = body.slice(start).match(/^#{1,4}\s+.+$/m);
    const nextStructure = nextStructuralHeading?.index === undefined
      ? body.length
      : start + nextStructuralHeading.index;
    const end = Math.min(nextArticle, nextStructure);
    return {
      label: match[1] ?? "",
      title: match[2]?.trim() ?? "",
      text: body.slice(start, end).trim(),
    };
  });

  return {
    metadata: {
      name,
      mst: field("법령MST"),
      lawId: field("법령ID"),
      promulgationDate: field("공포일자"),
      effectiveDate: field("시행일자"),
      sourceUrl,
    },
    articles,
  };
}

function validateDate(date: string, fieldName: string): void {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(`${date}T00:00:00Z`))) {
    throw new LawDataError(`${fieldName} must be a valid date in YYYY-MM-DD format.`);
  }
}

function encodePath(path: string): string {
  return path.split("/").map(encodeURIComponent).join("/");
}

async function fetchJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    signal,
  });

  if (!response.ok) {
    if (response.status === 403) {
      throw new LawDataError(
        "GitHub's anonymous request limit was reached. Wait for the limit to reset, then retry.",
      );
    }
    throw new LawDataError(`GitHub returned ${response.status} while resolving the archived law.`);
  }
  return (await response.json()) as T;
}

interface CommitResponse {
  sha: string;
  commit: { committer: { date: string } };
}

export async function resolveLawSnapshot(
  law: LawIndexEntry,
  date: string,
  signal?: AbortSignal,
): Promise<LawSnapshot> {
  validateDate(date, "date");
  const endOfKoreanDay = `${date}T14:59:59Z`;
  const commits = await fetchJson<CommitResponse[]>(
    `${API_ROOT}/commits?path=${encodeURIComponent(law.path)}&until=${encodeURIComponent(endOfKoreanDay)}&per_page=1`,
    signal,
  );
  const commit = commits[0];
  if (!commit) throw new LawDataError(`${law.name} has no archived version on or before ${date}.`);

  const rawUrl = `${RAW_ROOT}/${commit.sha}/${encodePath(law.path)}`;
  const response = await fetch(rawUrl, { signal });
  if (!response.ok) {
    throw new LawDataError(`The archived text for ${law.name} could not be loaded.`);
  }
  const { metadata, articles } = parseLawMarkdown(await response.text());
  return {
    law,
    requestedDate: date,
    commitSha: commit.sha,
    commitDate: commit.commit.committer.date,
    metadata,
    articles,
    githubUrl: `${ARCHIVE_ROOT}/${commit.sha}/${encodePath(law.path)}`,
  };
}

function normalizeArticleLabel(label: string): string {
  return label.normalize("NFKC").replace(/\s+/g, "").replace(/[()]/g, "");
}

export function findArticle(snapshot: LawSnapshot, requestedLabel: string): LawArticle {
  const normalized = normalizeArticleLabel(requestedLabel);
  const article = snapshot.articles.find(
    (candidate) => normalizeArticleLabel(candidate.label) === normalized,
  );
  if (article) return article;
  const examples = snapshot.articles.slice(0, 8).map(({ label }) => label).join(", ");
  throw new LawDataError(
    `${requestedLabel} was not found in ${snapshot.metadata.name} at ${snapshot.requestedDate}. Available examples: ${examples}.`,
  );
}

export function diffArticle(before?: LawArticle, after?: LawArticle): ArticleDiff {
  const article = after ?? before;
  if (!article) throw new LawDataError("At least one article version is required for comparison.");
  const status = !before
    ? "added"
    : !after
      ? "removed"
      : before.text === after.text && before.title === after.title
        ? "unchanged"
        : "changed";
  return {
    label: article.label,
    title: article.title,
    status,
    before,
    after,
  };
}

export function snapshotReference(snapshot: LawSnapshot): LawSnapshotReference {
  const { articles: _articles, ...reference } = snapshot;
  return reference;
}

export async function searchLawsAtDate(
  query: string,
  asOf: string,
  limit = 5,
  signal?: AbortSignal,
): Promise<Array<LawIndexEntry & { commitSha: string; commitDate: string }>> {
  validateDate(asOf, "as_of");
  const index = await loadLawIndex(signal);
  const matches = searchLawIndex(index.entries, query, limit);
  const resolved = await Promise.allSettled(
    matches.map(async (law) => {
      const snapshot = await resolveLawSnapshot(law, asOf, signal);
      return { ...law, commitSha: snapshot.commitSha, commitDate: snapshot.commitDate };
    }),
  );
  return resolved
    .filter((result): result is PromiseFulfilledResult<LawIndexEntry & { commitSha: string; commitDate: string }> => result.status === "fulfilled")
    .map((result) => result.value);
}

export async function getArticle(
  law: LawIndexEntry,
  date: string,
  articleLabel: string,
  signal?: AbortSignal,
): Promise<ArticleResult> {
  const snapshot = await resolveLawSnapshot(law, date, signal);
  const article = findArticle(snapshot, articleLabel);
  return {
    law,
    requestedDate: date,
    commitSha: snapshot.commitSha,
    commitDate: snapshot.commitDate,
    article,
    source: {
      originalUrl: snapshot.metadata.sourceUrl,
      archivedVersionUrl: snapshot.githubUrl,
      attribution: ATTRIBUTION,
    },
    disclaimer: DISCLAIMER,
  };
}

export async function compareLawVersions(
  law: LawIndexEntry,
  beforeDate: string,
  afterDate: string,
  articleLabel: string,
  signal?: AbortSignal,
): Promise<ComparisonResult> {
  if (beforeDate >= afterDate) {
    throw new LawDataError("before_date must be earlier than after_date.");
  }
  const [before, after] = await Promise.all([
    resolveLawSnapshot(law, beforeDate, signal),
    resolveLawSnapshot(law, afterDate, signal),
  ]);
  const normalized = normalizeArticleLabel(articleLabel);
  const beforeArticle = before.articles.find(
    (candidate) => normalizeArticleLabel(candidate.label) === normalized,
  );
  const afterArticle = after.articles.find(
    (candidate) => normalizeArticleLabel(candidate.label) === normalized,
  );
  const diff = diffArticle(beforeArticle, afterArticle);
  return {
    law,
    articleLabel,
    before: snapshotReference(before),
    after: snapshotReference(after),
    diff,
    source: {
      originalUrl: after.metadata.sourceUrl,
      beforeVersionUrl: before.githubUrl,
      afterVersionUrl: after.githubUrl,
      attribution: ATTRIBUTION,
    },
    disclaimer: DISCLAIMER,
  };
}

function excerpt(text: string | undefined, length = 600): string {
  if (!text) return "Not present in this version.";
  const compact = text.replace(/\s+/g, " ").trim();
  return compact.length > length ? `${compact.slice(0, length)}…` : compact;
}

export async function buildReviewBrief(
  law: LawIndexEntry,
  beforeDate: string,
  afterDate: string,
  articleLabel: string,
  question: string,
  signal?: AbortSignal,
): Promise<ReviewBrief> {
  if (!question.trim()) throw new LawDataError("question is required.");
  const comparison = await compareLawVersions(
    law,
    beforeDate,
    afterDate,
    articleLabel,
    signal,
  );
  const title = comparison.diff.title ? ` (${comparison.diff.title})` : "";
  return {
    question: question.trim(),
    heading: `${law.name} ${comparison.diff.label}${title}`,
    finding: `The archived article is ${comparison.diff.status} between ${beforeDate} and ${afterDate}. This is a textual comparison, not a legal conclusion.`,
    changeStatus: comparison.diff.status,
    beforeExcerpt: excerpt(comparison.diff.before?.text),
    afterExcerpt: excerpt(comparison.diff.after?.text),
    citations: [
      { label: `Archived version at ${beforeDate}`, url: comparison.source.beforeVersionUrl },
      { label: `Archived version at ${afterDate}`, url: comparison.source.afterVersionUrl },
      { label: "Official current source", url: comparison.source.originalUrl },
    ],
    reviewChecks: [
      "Confirm that the requested dates match the intended legal question.",
      "Read the surrounding provisions and supplementary provisions before drawing a conclusion.",
      "Verify the text against the official Korean Law Information Center source.",
    ],
    disclaimer: DISCLAIMER,
  };
}

export async function findLawByPath(path: string, signal?: AbortSignal): Promise<LawIndexEntry> {
  const index = await loadLawIndex(signal);
  const law = index.entries.find((entry) => entry.path === path);
  if (!law) throw new LawDataError(`Unknown law_path: ${path}`);
  return law;
}
