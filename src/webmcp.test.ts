import { describe, expect, it, vi } from "vitest";
import type { ArticleResult, ComparisonResult, LawIndexEntry, ReviewBrief } from "./types";
import { DISCLAIMER } from "./types";
import { createToolDefinitions, type LawToolServices, type PublishedToolResult } from "./webmcp";

const law: LawIndexEntry = { id: "kr/민법/법률.md", name: "민법", path: "kr/민법/법률.md" };
const articleResult: ArticleResult = {
  law,
  requestedDate: "2026-08-31",
  commitSha: "abc",
  commitDate: "2026-08-30T00:00:00Z",
  article: { label: "제1조", title: "법원", text: "본문" },
  source: {
    originalUrl: "https://www.law.go.kr/법령/민법",
    archivedVersionUrl: "https://github.com/example",
    attribution: "Source attribution",
  },
  disclaimer: DISCLAIMER,
};
const comparison = {
  law,
  articleLabel: "제1조",
  before: {},
  after: {},
  diff: { label: "제1조", title: "법원", status: "unchanged" },
  source: {
    originalUrl: "https://www.law.go.kr/법령/민법",
    beforeVersionUrl: "https://github.com/before",
    afterVersionUrl: "https://github.com/after",
    attribution: "Source attribution",
  },
  disclaimer: DISCLAIMER,
} as unknown as ComparisonResult;
const brief: ReviewBrief = {
  question: "What changed?",
  heading: "민법 제1조",
  finding: "unchanged",
  changeStatus: "unchanged",
  beforeExcerpt: "본문",
  afterExcerpt: "본문",
  citations: [],
  reviewChecks: [],
  disclaimer: DISCLAIMER,
};

function serviceStubs(): LawToolServices {
  return {
    search: vi.fn().mockResolvedValue([{ ...law, commitSha: "abc", commitDate: "2026-08-30" }]),
    getArticle: vi.fn().mockResolvedValue(articleResult),
    compare: vi.fn().mockResolvedValue(comparison),
    buildBrief: vi.fn().mockResolvedValue(brief),
    findLaw: vi.fn().mockResolvedValue(law),
  } as LawToolServices;
}

describe("WebMCP tool definitions", () => {
  it("registers the four required, read-only, untrusted-content tools", () => {
    const tools = createToolDefinitions(() => undefined, serviceStubs());
    expect(tools.map(({ name }) => name)).toEqual([
      "search_laws",
      "get_articles",
      "compare_versions",
      "build_review_brief",
    ]);
    for (const tool of tools) {
      expect(tool.annotations).toEqual({ readOnlyHint: true, untrustedContentHint: true });
      expect(tool.inputSchema).toMatchObject({ type: "object", additionalProperties: false });
    }
  });

  it("passes inputs to the comparison service and publishes the shared result", async () => {
    const published: PublishedToolResult[] = [];
    const stubs = serviceStubs();
    const tool = createToolDefinitions((value) => published.push(value), stubs).find(
      ({ name }) => name === "compare_versions",
    );
    expect(tool).toBeDefined();
    const output = await tool?.execute({
      law_path: law.path,
      article: "제1조",
      before_date: "2020-01-01",
      after_date: "2026-08-31",
    });
    expect(stubs.findLaw).toHaveBeenCalledWith(law.path, undefined);
    expect(stubs.compare).toHaveBeenCalledWith(
      law,
      "2020-01-01",
      "2026-08-31",
      "제1조",
      undefined,
    );
    expect(JSON.parse(output ?? "{}").diff.status).toBe("unchanged");
    expect(published).toEqual([{ tool: "compare_versions", result: comparison }]);
  });

  it("rejects missing required strings before data access", async () => {
    const tool = createToolDefinitions(() => undefined, serviceStubs()).find(
      ({ name }) => name === "get_articles",
    );
    await expect(tool?.execute({ law_path: law.path, as_of: "2026-08-31" })).rejects.toThrow(
      "article is required",
    );
  });
});
