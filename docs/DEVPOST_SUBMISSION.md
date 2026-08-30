# Devpost submission draft

## Project name

Korean Law Review Workbench

## Tagline

People set the legal question. Agents retrieve the exact evidence.

## One-line description

A WebMCP-powered workspace for source-linked, human-supervised comparison of Korean statute provisions across time.

## What it does

Korean Law Review Workbench lets a person choose a statute, one provision, two archive dates, and a review question. The page then exposes four structured WebMCP tools that let a browser agent search Korean statutes, retrieve an exact article at a date, compare two immutable archived versions, and prepare a source-linked review brief.

The person remains responsible for the scope and judgment. The agent handles repeatable evidence retrieval. Every result includes the official Korean Law Information Center URL, immutable Legalize-KR revision links, the requested dates, and a clear statement that the output is not legal advice.

## Why this is a strong fit for WebMCP

Legal research is unusually sensitive to source, version, and scope. A generic agent navigating a website must infer button semantics, scrape long documents, and guess whether a visible text matches the requested date. WebMCP replaces those guesses with narrow operations and explicit JSON schemas.

The result is more than a hidden API. Tool calls update the same visible comparison workspace the person uses, so both participants share one evidence state. The human can immediately inspect what the agent retrieved and open the exact sources behind it.

## What people and agents can do together

Before WebMCP, a person had to manually locate historical versions, copy provisions, compare them, and hand the resulting context to an agent. In this app, the person defines the boundaries once. The agent can then reproduce the retrieval, comparison, and brief-building steps without guessing its way through the interface, while the person verifies each cited source.

## How WebMCP is implemented

The app uses the imperative `document.modelContext.registerTool()` API to register:

- `search_laws`
- `get_articles`
- `compare_versions`
- `build_review_brief`

All four tools are read-only, mark retrieved legal text as untrusted content, accept strict JSON schemas, propagate cancellation to fetch requests, and return compact strings suitable for agent context. The same TypeScript services power the visible controls and the WebMCP execution path.

## Demo scenario

The default review compares `민법 제1004조의2` between January 1, 2020 and August 31, 2026. The source archive shows the provision was added during that period. The review brief links both immutable versions and asks the reviewer to check surrounding succession and effective-date rules instead of presenting an automatic legal conclusion.

## How it was built

- TypeScript and Vite
- WebMCP imperative API and `webmcp-types`
- GitHub's public REST and raw-content endpoints
- Korean statute revisions archived by Legalize-KR
- Cloudflare Pages
- Vitest

## Privacy and data use

The app requires no account and has no database, cookies, analytics, or application-side personal-data storage. Users are told not to enter personal or case information. The statute-title index and every retrieved provision are attributed to the Korean Law Information Center and Legalize-KR archive.

## Hackathon work boundary

The app and repository were created from scratch during the WebMCP Challenge submission period. No production `legalize-web` source code was copied. The existing Legalize-KR archive supplies attributed public legal data and demonstrates the real problem the new WebMCP experience addresses.

## Links

- Live app: https://webmcp-legalize-kr.pages.dev
- Public repository: https://github.com/9bow/webmcp-legalize-kr
- Demo video: TO BE ADDED AFTER PUBLIC YOUTUBE UPLOAD
