# Demo video script

Target duration: 2 minutes 35 seconds. Narration and on-screen text are in English. Do not add copyrighted music.

## 0:00-0:18 — Problem

**Screen:** Hero and status showing four WebMCP tools ready.

**Narration:**

> Legal research depends on exact text, exact dates, and verifiable sources. But browser agents usually have to guess their way through a human interface and scrape long documents. Korean Law Review Workbench gives people and agents a shared, structured evidence workflow.

## 0:18-0:40 — Human sets the scope

**Screen:** Scroll to the workspace. Show `민법`, `제1004조의2`, the two dates, and the review question.

**Narration:**

> I start by choosing the statute, provision, two archive dates, and the question I want to review. The app does not ask for a case description or personal information, and it does not make a legal judgment.

## 0:40-1:05 — Discover WebMCP tools

**Screen:** Ask the ChatGPT in-app browser agent to use the page tools. Briefly show the four tool names.

**Narration:**

> The page registers four read-only WebMCP tools: search, exact article retrieval, version comparison, and review-brief generation. Each has a narrow JSON schema. Retrieved legal text is explicitly marked as untrusted content.

## 1:05-1:35 — Agent compares real versions

**Screen:** Agent calls `compare_versions`. Show the page update to `ADDED`, with the empty 2020 side and the 2026 text for `상속권 상실 선고`.

**Narration:**

> The agent resolves the last archived revision on or before each requested date. Here, Article 1004-2 was absent in the 2020 archive and present in 2026. The tool returns only the selected article and compact version metadata, rather than flooding the agent with the entire statute.

## 1:35-2:02 — Verify sources

**Screen:** Point to the earlier archive, later archive, and official current-source links.

**Narration:**

> Every result carries two immutable Git revision links and the official Korean Law Information Center source. The human can inspect exactly what the agent used instead of trusting an uncited summary.

## 2:02-2:25 — Shared review brief

**Screen:** Agent calls `build_review_brief`. Show the visible brief and review checks.

**Narration:**

> The brief is deterministic and source-linked. It preserves my question, describes only the textual change, and reminds me to check surrounding provisions and effective-date rules. The tool call updates the same workspace I can see, keeping the person and agent on one evidence state.

## 2:25-2:35 — Close

**Screen:** Tool cards, repository link, and footer disclaimer.

**Narration:**

> People set the legal question. Agents retrieve the exact evidence. The project is open source, requires no login, and is live on Cloudflare Pages.
