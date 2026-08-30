import {
  buildReviewBrief,
  compareLawVersions,
  findLawByPath,
  getArticle,
  searchLawsAtDate,
} from "./law-data";

export type PublishedToolResult = {
  tool: string;
  result: unknown;
};

interface ToolExecutionContext {
  signal?: AbortSignal;
}

export interface WebMcpToolDefinition {
  name: string;
  title: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations: {
    readOnlyHint: true;
    untrustedContentHint: true;
  };
  execute: (input: Record<string, unknown>, context?: ToolExecutionContext) => Promise<string>;
}

export interface LawToolServices {
  search: typeof searchLawsAtDate;
  getArticle: typeof getArticle;
  compare: typeof compareLawVersions;
  buildBrief: typeof buildReviewBrief;
  findLaw: typeof findLawByPath;
}

const services: LawToolServices = {
  search: searchLawsAtDate,
  getArticle,
  compare: compareLawVersions,
  buildBrief: buildReviewBrief,
  findLaw: findLawByPath,
};

function asString(input: Record<string, unknown>, key: string): string {
  const value = input[key];
  if (typeof value !== "string" || !value.trim()) throw new Error(`${key} is required.`);
  return value.trim();
}

function serialize(tool: string, result: unknown, publish: (value: PublishedToolResult) => void): string {
  publish({ tool, result });
  return JSON.stringify(result, null, 2);
}

export function createToolDefinitions(
  publish: (value: PublishedToolResult) => void,
  lawServices: LawToolServices = services,
): WebMcpToolDefinition[] {
  const annotations = { readOnlyHint: true, untrustedContentHint: true } as const;
  return [
    {
      name: "search_laws",
      title: "Search Korean statutes",
      description:
        "Search the Legalize-KR statute archive by Korean title and confirm which results existed on a requested date. Use this before selecting law_path for the other tools.",
      inputSchema: {
        type: "object",
        properties: {
          query: { type: "string", description: "Korean statute title or partial title." },
          as_of: { type: "string", format: "date", description: "Archive date in YYYY-MM-DD format." },
          limit: { type: "integer", minimum: 1, maximum: 5, default: 5 },
        },
        required: ["query", "as_of"],
        additionalProperties: false,
      },
      annotations,
      execute: async (input, context) => {
        const limit = typeof input.limit === "number" ? Math.min(5, Math.max(1, input.limit)) : 5;
        const result = await lawServices.search(
          asString(input, "query"),
          asString(input, "as_of"),
          limit,
          context?.signal,
        );
        return serialize("search_laws", result, publish);
      },
    },
    {
      name: "get_articles",
      title: "Get an archived Korean law article",
      description:
        "Retrieve one exact article from a Korean statute as archived on a requested date, including the official source and immutable GitHub version link.",
      inputSchema: {
        type: "object",
        properties: {
          law_path: { type: "string", description: "A law_path returned by search_laws." },
          article: { type: "string", description: "Korean article label, for example 제1조 or 제14조의2." },
          as_of: { type: "string", format: "date", description: "Archive date in YYYY-MM-DD format." },
        },
        required: ["law_path", "article", "as_of"],
        additionalProperties: false,
      },
      annotations,
      execute: async (input, context) => {
        const law = await lawServices.findLaw(asString(input, "law_path"), context?.signal);
        const result = await lawServices.getArticle(
          law,
          asString(input, "as_of"),
          asString(input, "article"),
          context?.signal,
        );
        return serialize("get_articles", result, publish);
      },
    },
    {
      name: "compare_versions",
      title: "Compare two archived article versions",
      description:
        "Compare one Korean statute article at two dates. Returns added, removed, changed, or unchanged with both archived source versions; it does not make a legal conclusion.",
      inputSchema: {
        type: "object",
        properties: {
          law_path: { type: "string", description: "A law_path returned by search_laws." },
          article: { type: "string", description: "Korean article label, for example 제1조." },
          before_date: { type: "string", format: "date" },
          after_date: { type: "string", format: "date" },
        },
        required: ["law_path", "article", "before_date", "after_date"],
        additionalProperties: false,
      },
      annotations,
      execute: async (input, context) => {
        const law = await lawServices.findLaw(asString(input, "law_path"), context?.signal);
        const result = await lawServices.compare(
          law,
          asString(input, "before_date"),
          asString(input, "after_date"),
          asString(input, "article"),
          context?.signal,
        );
        return serialize("compare_versions", result, publish);
      },
    },
    {
      name: "build_review_brief",
      title: "Build a source-linked review brief",
      description:
        "Build a deterministic, source-linked review brief for a person's stated question using an article comparison. Returns review checks and excerpts, not legal advice.",
      inputSchema: {
        type: "object",
        properties: {
          law_path: { type: "string", description: "A law_path returned by search_laws." },
          article: { type: "string", description: "Korean article label, for example 제1조." },
          before_date: { type: "string", format: "date" },
          after_date: { type: "string", format: "date" },
          question: { type: "string", description: "The person's review question. Do not include personal information." },
        },
        required: ["law_path", "article", "before_date", "after_date", "question"],
        additionalProperties: false,
      },
      annotations,
      execute: async (input, context) => {
        const law = await lawServices.findLaw(asString(input, "law_path"), context?.signal);
        const result = await lawServices.buildBrief(
          law,
          asString(input, "before_date"),
          asString(input, "after_date"),
          asString(input, "article"),
          asString(input, "question"),
          context?.signal,
        );
        return serialize("build_review_brief", result, publish);
      },
    },
  ];
}

export async function registerWebMcpTools(
  publish: (value: PublishedToolResult) => void,
): Promise<{ supported: boolean; toolCount: number }> {
  if (!("modelContext" in document) || !document.modelContext) {
    return { supported: false, toolCount: 0 };
  }
  const modelContext = document.modelContext;
  const definitions = createToolDefinitions(publish);
  await Promise.all(
    definitions.map((definition) => modelContext.registerTool(definition)),
  );
  return { supported: true, toolCount: definitions.length };
}
