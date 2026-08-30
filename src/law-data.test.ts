import { describe, expect, it } from "vitest";
import {
  diffArticle,
  findArticle,
  LawDataError,
  parseLawMarkdown,
  searchLawIndex,
  snapshotReference,
} from "./law-data";
import type { LawIndexEntry, LawSnapshot } from "./types";

const sampleMarkdown = `---
제목: 시험법
법령MST: 12345
법령ID: '000001'
공포일자: 2025-01-01
시행일자: 2025-02-01
출처: https://www.law.go.kr/법령/시험법
---

# 시험법

##### 제1조 (목적)

이 법은 정확한 비교를 목적으로 한다.

##### 제2조의2 (검증)

**①** 출처를 확인한다.

**②** 기준일을 확인한다.
`;

const law: LawIndexEntry = { id: "kr/시험법/법률.md", name: "시험법", path: "kr/시험법/법률.md" };

function snapshot(articles = parseLawMarkdown(sampleMarkdown).articles): LawSnapshot {
  return {
    law,
    requestedDate: "2025-02-01",
    commitSha: "abc123",
    commitDate: "2025-02-01T00:00:00Z",
    metadata: parseLawMarkdown(sampleMarkdown).metadata,
    articles,
    githubUrl: "https://github.com/example",
  };
}

describe("parseLawMarkdown", () => {
  it("extracts source metadata and numbered articles", () => {
    const result = parseLawMarkdown(sampleMarkdown);
    expect(result.metadata).toMatchObject({
      name: "시험법",
      mst: "12345",
      lawId: "000001",
      effectiveDate: "2025-02-01",
      sourceUrl: "https://www.law.go.kr/법령/시험법",
    });
    expect(result.articles).toHaveLength(2);
    expect(result.articles[1]).toMatchObject({
      label: "제2조의2",
      title: "검증",
    });
    expect(result.articles[1]?.text).toContain("기준일을 확인한다");
  });
});

describe("searchLawIndex", () => {
  const entries: LawIndexEntry[] = [
    { id: "1", name: "민법", path: "kr/민법/법률.md" },
    { id: "2", name: "민사소송법", path: "kr/민사소송법/법률.md" },
    { id: "3", name: "기부금품의모집ㆍ사용및기부문화활성화에관한법률", path: "3" },
  ];

  it("prioritizes prefix matches and normalizes Korean separators", () => {
    expect(searchLawIndex(entries, "민", 2).map(({ name }) => name)).toEqual(["민법", "민사소송법"]);
    expect(searchLawIndex(entries, "모집 사용", 5)[0]?.id).toBe("3");
  });

  it("does not return results for an empty query", () => {
    expect(searchLawIndex(entries, "  ")).toEqual([]);
  });
});

describe("article lookup and comparison", () => {
  it("matches article labels and reports all four statuses", () => {
    const original = findArticle(snapshot(), "제2조의2");
    const changed = { ...original, text: `${original.text}\n새 항을 추가한다.` };
    expect(diffArticle(original, original).status).toBe("unchanged");
    expect(diffArticle(original, changed).status).toBe("changed");
    expect(diffArticle(undefined, changed).status).toBe("added");
    expect(diffArticle(original, undefined).status).toBe("removed");
  });

  it("returns actionable labels when an article is missing", () => {
    expect(() => findArticle(snapshot(), "제99조")).toThrow(LawDataError);
    expect(() => findArticle(snapshot(), "제99조")).toThrow("Available examples: 제1조, 제2조의2");
  });

  it("keeps full article collections out of agent-facing version references", () => {
    const reference = snapshotReference(snapshot());
    expect(reference).not.toHaveProperty("articles");
    expect(reference).toMatchObject({ commitSha: "abc123", requestedDate: "2025-02-01" });
  });
});
