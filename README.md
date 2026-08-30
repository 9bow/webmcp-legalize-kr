# Korean Law Review Workbench

A WebMCP-powered workspace where a person defines the legal text, dates, provision, and review question, while an agent retrieves exact archived sources and prepares a comparison that the person can verify.

Live demo: `https://webmcp-legalize-kr.pages.dev`
Source: `https://github.com/9bow/webmcp-legalize-kr`
Devpost: `https://devpost.com/software/legalize-kr-webmcp`
Demo video: `https://www.youtube.com/watch?v=jqVPedEtprw`

> This project supports source review and does not provide legal advice. Verify conclusions against the official text and seek qualified advice when needed.

## Why WebMCP

Legal research interfaces usually force an agent to infer intent from buttons, scrape long pages, and guess whether a result belongs to the requested date. This app exposes the same evidence operations used by its human interface as four narrow, read-only WebMCP tools:

| Tool | Purpose |
| --- | --- |
| `search_laws` | Find Korean statutes that existed on a requested archive date. |
| `get_articles` | Retrieve one exact article with its official and immutable archive sources. |
| `compare_versions` | Classify a provision as added, removed, changed, or unchanged across two dates. |
| `build_review_brief` | Prepare a deterministic, source-linked review brief around the person's question. |

Every tool has a JSON input schema, `readOnlyHint: true`, `untrustedContentHint: true`, cancellation propagation for network requests, and a compact result. Tool execution also updates the visible workspace, so the person and agent stay on the same evidence.

## Demo scenario

The default scenario compares `민법 제1004조의2` between `2020-01-01` and `2026-08-31`. The archived text shows that the provision on declaring loss of inheritance rights was added during that period. The app does not interpret the provision; it returns the earlier and later immutable versions, the official source, and checks the reviewer should perform before relying on the comparison.

Suggested agent prompt:

```text
Use the page's WebMCP tools to compare 민법 제1004조의2 on 2020-01-01 and 2026-08-31. Then build a review brief for: What text was introduced, and which surrounding succession provisions and effective-date rules should I verify?
```

## Run locally

Requirements: Node.js 20 or later and pnpm.

```bash
pnpm install
pnpm test
pnpm run build
pnpm run verify:static
pnpm dev
```

Open `http://127.0.0.1:5173/` in the ChatGPT in-app browser, or use Chrome with WebMCP enabled. The page should report `4 WebMCP tools ready`.

To regenerate the bundled law-title index from a sibling clone of `legalize-kr/legalize-kr`:

```bash
LEGALIZE_LAWS_DIR=../legalize-kr/kr pnpm run index:laws
```

## Implementation

- Vanilla TypeScript and Vite keep the browser surface small and auditable.
- `document.modelContext.registerTool()` registers the four imperative WebMCP tools.
- The bundled index covers 1,733 statute titles. It contains no statute bodies.
- At execution time, the app resolves the last Git commit for the selected path on or before the requested Korean calendar date, then retrieves that immutable Markdown revision.
- A focused parser extracts front matter, the official source URL, and numbered articles.
- Human controls and WebMCP tools call the same data functions and render the same evidence model.
- Cloudflare Pages serves the static production build without accounts, cookies, or application-side storage.

## Cloudflare cost boundary

This project deploys only static assets to Cloudflare Pages. It deliberately has no Pages Functions directory, Worker entry point, KV, D1, R2, Durable Objects, Workers AI, or other Cloudflare compute/storage binding. Cloudflare documents that [static asset requests on Pages are free and unlimited](https://developers.cloudflare.com/pages/functions/pricing/), while Pages Functions are billed as Workers requests.

`pnpm run verify:static` blocks deployment if a Functions/Worker entry point, routing file, or Cloudflare binding is found. `pnpm run deploy` automatically builds and runs this guard, then uses `wrangler pages deploy`; it never invokes `wrangler deploy`.

## Trust, privacy, and limits

- All tools are read-only and make no external changes.
- The app has no login, database, analytics, cookies, or personal-data storage.
- Review questions stay in the current page and are not sent to this project's server. They are supplied to the local WebMCP execution initiated by the browser agent.
- Retrieved legal text is untrusted external content and must not be treated as instructions.
- Anonymous GitHub API access is rate-limited. A clear retry message is shown if the public limit is reached.
- Archive dates resolve Git revisions, not a legal opinion about which transitional rule governs a particular case.

See [ATTRIBUTION.md](./ATTRIBUTION.md) for the data boundary and source policy, and [docs/TESTING.md](./docs/TESTING.md) for the verification procedure.

## Hackathon work boundary

This repository and its application code were created during the OpenAI WebMCP Challenge submission period. It does not copy the production `legalize-web` source. The pre-existing Legalize-KR project is used only as an attributed public archive and as context for the problem being solved. Git history in this repository is the timestamped record of the new WebMCP work.

## License

Application source code is released under the [MIT License](./LICENSE). Underlying Korean statute text remains subject to its applicable public-work terms.
