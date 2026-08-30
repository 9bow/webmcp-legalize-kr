# Demo video script

Target duration: 1 minute 46 seconds. Narration and on-screen text are in English. The produced video uses macOS system speech and contains no music or third-party footage.

## 0:00-0:16 — Problem

**Screen:** Hero and status showing four WebMCP tools ready.

**Narration:**

> Legal research depends on exact text, exact dates, and verifiable sources. But browser agents usually have to guess their way through a human interface and scrape long documents. Korean Law Review Workbench gives people and agents a shared, structured evidence workflow.

## 0:16-0:32 — Human sets the scope

**Screen:** `민법`, `제1004조의2`, two dates, and the review question.

**Narration:**

> I start by choosing the statute, one provision, two archive dates, and the question I want to review. The app does not ask for a case description or personal information, and it does not make a legal judgment. The person controls the scope before any tool runs.

## 0:32-0:51 — Structured WebMCP tools

**Screen:** Four tool cards.

**Narration:**

> The page registers four read-only WebMCP tools: statute search, exact article retrieval, version comparison, and review brief generation. Each has a narrow JSON schema. Retrieved legal text is marked as untrusted content, and every tool returns source links instead of an uncited conclusion.

## 0:51-1:13 — Real archived comparison

**Screen:** `compare_versions` result showing `ADDED`, an absent 2020 side, and the 2026 text.

**Narration:**

> The agent resolves the last archived revision on or before each requested date. Here, Civil Act Article 1004-2 was absent in the January 2020 archive and present in August 2026. The result is classified as added. The tool returns only the selected article and compact version metadata rather than flooding the agent with the entire statute.

## 1:13-1:34 — Shared review brief

**Screen:** Immutable source links and visible review brief.

**Narration:**

> Every result carries two immutable Git revision links and the official Korean Law Information Center source. The deterministic review brief preserves my question, describes only the textual change, and reminds me to check surrounding provisions and effective-date rules. The tool call updates the same workspace I can see, so the person and agent share one evidence state.

## 1:34-1:46 — Close

**Screen:** Hero and WebMCP-ready status.

**Narration:**

> People set the legal question. Agents retrieve the exact evidence. Korean Law Review Workbench is open source, requires no login, and provides source review rather than legal advice.
