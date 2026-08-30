import "./style.css";
import {
  buildReviewBrief,
  compareLawVersions,
  findLawByPath,
  getArticle,
  loadLawIndex,
  searchLawIndex,
} from "./law-data";
import type { ArticleResult, ComparisonResult, LawIndexEntry, ReviewBrief } from "./types";
import { DISCLAIMER } from "./types";
import { registerWebMcpTools, type PublishedToolResult } from "./webmcp";

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) throw new Error("App root was not found.");

app.innerHTML = `
  <header class="hero">
    <nav class="nav wrap" aria-label="Project navigation">
      <a class="brand" href="#top" aria-label="Korean Law Review Workbench home">
        <span class="brand-mark">법</span>
        <span>Law Review Workbench</span>
      </a>
      <div class="nav-links">
        <a href="#tools">WebMCP tools</a>
        <a href="https://github.com/9bow/webmcp-legalize-kr" target="_blank" rel="noreferrer">Source</a>
      </div>
    </nav>
    <div class="hero-grid wrap" id="top">
      <div>
        <p class="eyebrow">HUMAN SCOPE · AGENT PRECISION</p>
        <h1>Review how Korean statutes changed, together.</h1>
        <p class="hero-copy">You choose the law, dates, provision, and question. Your agent retrieves the exact archived text and prepares a source-linked comparison you can verify.</p>
        <div class="hero-actions">
          <a class="button primary" href="#workspace">Start a review</a>
          <span id="webmcp-status" class="status checking"><span></span>Checking WebMCP…</span>
        </div>
      </div>
      <aside class="principle-card" aria-label="Collaboration principles">
        <p class="card-number">01</p>
        <h2>People set intent.<br />Agents gather evidence.</h2>
        <ol>
          <li><span>Scope</span> Pick the legal text and two dates.</li>
          <li><span>Retrieve</span> Resolve immutable archived versions.</li>
          <li><span>Review</span> Check every claim against its source.</li>
        </ol>
      </aside>
    </div>
  </header>

  <main>
    <section class="workspace wrap" id="workspace">
      <div class="section-heading">
        <div><p class="eyebrow">REVIEW WORKSPACE</p><h2>Set the boundaries</h2></div>
        <p>The same four operations are available to you here and to an agent through WebMCP.</p>
      </div>

      <form id="review-form" class="scope-panel">
        <div class="field search-field">
          <label for="law-query">Statute title</label>
          <div class="input-action">
            <input id="law-query" name="query" value="민법" autocomplete="off" placeholder="민법" required />
            <button class="button secondary" type="button" id="search-button">Search</button>
          </div>
          <input type="hidden" id="law-path" name="lawPath" />
          <div id="search-results" class="search-results" aria-live="polite"></div>
        </div>
        <div class="field">
          <label for="article">Article</label>
          <input id="article" name="article" value="제1004조의2" placeholder="제1조" required />
        </div>
        <div class="field">
          <label for="before-date">Earlier archive date</label>
          <input id="before-date" name="beforeDate" type="date" value="2020-01-01" required />
        </div>
        <div class="field">
          <label for="after-date">Later archive date</label>
          <input id="after-date" name="afterDate" type="date" value="2026-08-31" required />
        </div>
        <div class="field question-field">
          <label for="question">Review question</label>
          <textarea id="question" name="question" rows="3" required>What text was introduced, and which surrounding succession provisions and effective-date rules should I verify?</textarea>
          <small>Do not enter names, case details, or other personal information.</small>
        </div>
        <div class="scope-actions">
          <button class="button secondary" type="button" id="load-button">Get later article</button>
          <button class="button primary" type="button" id="compare-button">Compare versions</button>
          <button class="button dark" type="submit">Build review brief</button>
        </div>
      </form>

      <div id="activity" class="activity" aria-live="polite">
        <span class="activity-dot"></span><span>Select a statute to begin.</span>
      </div>

      <section id="evidence" class="evidence hidden" aria-labelledby="evidence-heading">
        <div class="evidence-head">
          <div><p class="eyebrow">SOURCE COMPARISON</p><h2 id="evidence-heading">Archived provision</h2></div>
          <span id="change-badge" class="change-badge">Waiting</span>
        </div>
        <div class="version-grid">
          <article class="version-card"><p id="before-label" class="version-label">Earlier</p><div id="before-text" class="law-text"></div></article>
          <article class="version-card"><p id="after-label" class="version-label">Later</p><div id="after-text" class="law-text"></div></article>
        </div>
        <div id="source-links" class="source-links"></div>
      </section>

      <section id="brief" class="brief hidden" aria-labelledby="brief-heading">
        <p class="eyebrow">REVIEW BRIEF</p>
        <h2 id="brief-heading"></h2>
        <p id="brief-finding" class="brief-finding"></p>
        <div class="brief-columns">
          <div><h3>Your question</h3><p id="brief-question"></p></div>
          <div><h3>Checks before relying</h3><ul id="brief-checks"></ul></div>
        </div>
        <div id="brief-citations" class="citations"></div>
      </section>
    </section>

    <section class="tools-section" id="tools">
      <div class="wrap">
        <div class="section-heading inverted">
          <div><p class="eyebrow">STRUCTURED FOR AGENTS</p><h2>Four read-only WebMCP tools</h2></div>
          <p>Each tool has a narrow JSON schema, immutable source links, cancellation support, and explicit trust annotations.</p>
        </div>
        <div class="tool-grid">
          <article><span>01</span><code>search_laws</code><p>Find statutes that existed on a requested archive date.</p></article>
          <article><span>02</span><code>get_articles</code><p>Retrieve one exact provision with its official and archived sources.</p></article>
          <article><span>03</span><code>compare_versions</code><p>Classify an article as added, removed, changed, or unchanged.</p></article>
          <article><span>04</span><code>build_review_brief</code><p>Prepare a deterministic brief around the person's question.</p></article>
        </div>
      </div>
    </section>
  </main>

  <footer class="footer wrap">
    <p>${DISCLAIMER}</p>
    <p>Source: <a href="https://www.law.go.kr" target="_blank" rel="noreferrer">Korean Law Information Center</a>. Archive: <a href="https://github.com/legalize-kr/legalize-kr" target="_blank" rel="noreferrer">Legalize-KR</a>.</p>
  </footer>
`;

const byId = <T extends HTMLElement>(id: string): T => {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Missing element: ${id}`);
  return element as T;
};

const form = byId<HTMLFormElement>("review-form");
const queryInput = byId<HTMLInputElement>("law-query");
const pathInput = byId<HTMLInputElement>("law-path");
const articleInput = byId<HTMLInputElement>("article");
const beforeInput = byId<HTMLInputElement>("before-date");
const afterInput = byId<HTMLInputElement>("after-date");
const questionInput = byId<HTMLTextAreaElement>("question");
const results = byId<HTMLDivElement>("search-results");
const activity = byId<HTMLDivElement>("activity");
const evidence = byId<HTMLElement>("evidence");
const briefSection = byId<HTMLElement>("brief");

function setActivity(message: string, kind: "working" | "success" | "error" = "working"): void {
  activity.className = `activity ${kind}`;
  activity.innerHTML = `<span class="activity-dot"></span><span>${escapeHtml(message)}</span>`;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[character] ?? character);
}

function safeLink(url: string, label: string): string {
  return `<a href="${escapeHtml(url)}" target="_blank" rel="noreferrer">${escapeHtml(label)} ↗</a>`;
}

function selectLaw(law: LawIndexEntry): void {
  queryInput.value = law.name;
  pathInput.value = law.path;
  results.innerHTML = `<span class="selected-law">Selected: ${escapeHtml(law.name)}</span>`;
  setActivity(`${law.name} selected. Choose an article and dates.`, "success");
}

async function runSearch(): Promise<void> {
  setActivity("Searching the bundled statute index…");
  try {
    const index = await loadLawIndex();
    const matches = searchLawIndex(index.entries, queryInput.value, 8);
    if (!matches.length) {
      results.innerHTML = `<span class="empty-result">No matching statute title.</span>`;
      setActivity("No matching statute was found.", "error");
      return;
    }
    results.innerHTML = "";
    matches.forEach((law) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "law-result";
      button.textContent = law.name;
      button.addEventListener("click", () => selectLaw(law));
      results.append(button);
    });
    if (matches.length === 1 && matches[0]) selectLaw(matches[0]);
    else setActivity(`${matches.length} matching statute titles found.`, "success");
  } catch (error) {
    handleError(error);
  }
}

async function selectedLaw(): Promise<LawIndexEntry> {
  if (!pathInput.value) {
    await runSearch();
  }
  if (!pathInput.value) throw new Error("Select a statute from the search results first.");
  return findLawByPath(pathInput.value);
}

function renderArticle(result: ArticleResult): void {
  evidence.classList.remove("hidden");
  briefSection.classList.add("hidden");
  byId<HTMLElement>("evidence-heading").textContent = `${result.law.name} ${result.article.label}`;
  byId<HTMLElement>("change-badge").textContent = "Retrieved";
  byId<HTMLElement>("change-badge").className = "change-badge unchanged";
  byId<HTMLElement>("before-label").textContent = "Requested archive date";
  byId<HTMLElement>("before-text").innerHTML = `<p class="empty-copy">Use Compare versions to load the earlier text.</p>`;
  byId<HTMLElement>("after-label").textContent = `${result.requestedDate} · ${result.commitSha.slice(0, 8)}`;
  byId<HTMLElement>("after-text").innerHTML = `<h3>${escapeHtml(result.article.label)} ${escapeHtml(result.article.title)}</h3><p>${escapeHtml(result.article.text)}</p>`;
  byId<HTMLElement>("source-links").innerHTML = `${safeLink(result.source.archivedVersionUrl, "Archived version")} ${safeLink(result.source.originalUrl, "Official current source")}`;
}

function renderComparison(result: ComparisonResult): void {
  evidence.classList.remove("hidden");
  briefSection.classList.add("hidden");
  byId<HTMLElement>("evidence-heading").textContent = `${result.law.name} ${result.diff.label}`;
  byId<HTMLElement>("change-badge").textContent = result.diff.status;
  byId<HTMLElement>("change-badge").className = `change-badge ${result.diff.status}`;
  byId<HTMLElement>("before-label").textContent = `${result.before.requestedDate} · ${result.before.commitSha.slice(0, 8)}`;
  byId<HTMLElement>("after-label").textContent = `${result.after.requestedDate} · ${result.after.commitSha.slice(0, 8)}`;
  const renderText = (text: string | undefined): string => text
    ? `<p>${escapeHtml(text)}</p>`
    : `<p class="empty-copy">This article is not present in this version.</p>`;
  byId<HTMLElement>("before-text").innerHTML = renderText(result.diff.before?.text);
  byId<HTMLElement>("after-text").innerHTML = renderText(result.diff.after?.text);
  byId<HTMLElement>("source-links").innerHTML = `${safeLink(result.source.beforeVersionUrl, "Earlier archive")} ${safeLink(result.source.afterVersionUrl, "Later archive")} ${safeLink(result.source.originalUrl, "Official current source")}`;
}

function renderBrief(result: ReviewBrief): void {
  briefSection.classList.remove("hidden");
  byId<HTMLElement>("brief-heading").textContent = result.heading;
  byId<HTMLElement>("brief-finding").textContent = result.finding;
  byId<HTMLElement>("brief-question").textContent = result.question;
  byId<HTMLElement>("brief-checks").innerHTML = result.reviewChecks.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  byId<HTMLElement>("brief-citations").innerHTML = result.citations.map((citation) => safeLink(citation.url, citation.label)).join("");
}

function handleError(error: unknown): void {
  const message = error instanceof Error ? error.message : "An unexpected error occurred.";
  setActivity(message, "error");
}

byId<HTMLButtonElement>("search-button").addEventListener("click", () => void runSearch());
queryInput.addEventListener("input", () => { pathInput.value = ""; });

byId<HTMLButtonElement>("load-button").addEventListener("click", async () => {
  setActivity("Resolving the archived article…");
  try {
    const law = await selectedLaw();
    const result = await getArticle(law, afterInput.value, articleInput.value);
    renderArticle(result);
    setActivity("Archived article retrieved with source links.", "success");
  } catch (error) { handleError(error); }
});

byId<HTMLButtonElement>("compare-button").addEventListener("click", async () => {
  setActivity("Resolving and comparing both archived versions…");
  try {
    const law = await selectedLaw();
    const result = await compareLawVersions(law, beforeInput.value, afterInput.value, articleInput.value);
    renderComparison(result);
    setActivity(`Comparison complete: ${result.diff.status}.`, "success");
  } catch (error) { handleError(error); }
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  setActivity("Building a source-linked review brief…");
  try {
    const law = await selectedLaw();
    const comparison = await compareLawVersions(law, beforeInput.value, afterInput.value, articleInput.value);
    renderComparison(comparison);
    const brief = await buildReviewBrief(law, beforeInput.value, afterInput.value, articleInput.value, questionInput.value);
    renderBrief(brief);
    setActivity("Review brief ready. Verify the sources before relying on it.", "success");
  } catch (error) { handleError(error); }
});

function publishToolResult({ tool, result }: PublishedToolResult): void {
  if (tool === "get_articles") renderArticle(result as ArticleResult);
  if (tool === "compare_versions") renderComparison(result as ComparisonResult);
  if (tool === "build_review_brief") renderBrief(result as ReviewBrief);
  setActivity(`Agent completed ${tool}. The shared workspace has been updated.`, "success");
}

void registerWebMcpTools(publishToolResult)
  .then(({ supported, toolCount }) => {
    const status = byId<HTMLElement>("webmcp-status");
    status.className = supported ? "status supported" : "status unavailable";
    status.innerHTML = supported
      ? `<span></span>${toolCount} WebMCP tools ready`
      : `<span></span>Manual mode · enable WebMCP to use agent tools`;
  })
  .catch((error) => {
    byId<HTMLElement>("webmcp-status").textContent = "WebMCP registration failed";
    handleError(error);
  });

void runSearch();
