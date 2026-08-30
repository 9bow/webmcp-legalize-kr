# Testing and judging instructions

## Supported judging environments

- ChatGPT desktop app in-app browser, which supports WebMCP for the challenge.
- Google Chrome 149 or later with `chrome://flags/#enable-webmcp-testing` enabled and the browser restarted.

No account, credential, payment, or personal information is required.

## Automated checks

```bash
pnpm install
pnpm test
pnpm run build
pnpm run verify:static
```

The tests cover Markdown metadata and article parsing, Korean title normalization, missing-article errors, all four comparison statuses, the compact agent-facing result boundary, required tool names, trust annotations, JSON schemas, service arguments, and visible-result publication.

## Manual human-interface check

1. Open the live URL.
2. Confirm the status reads `4 WebMCP tools ready` in a WebMCP-capable browser.
3. Search for `민법` and choose the exact `민법` result.
4. Keep article `제1004조의2`, earlier date `2020-01-01`, and later date `2026-08-31`.
5. Choose **Compare versions**.
6. Confirm the status is `added`, the earlier side reports that the article was absent, and the later side shows `상속권 상실 선고`.
7. Open all three links: earlier archive, later archive, and official current source.
8. Choose **Build review brief** and confirm the question, textual finding, review checks, and three citations are visible.

## Manual agent check

Ask the browser agent:

```text
Use the page's WebMCP tools to compare 민법 제1004조의2 on 2020-01-01 and 2026-08-31. Then build a review brief for: What text was introduced, and which surrounding succession provisions and effective-date rules should I verify?
```

Verify that the agent calls `search_laws` or uses the known path, calls `compare_versions`, calls `build_review_brief`, and cites the immutable before/after URLs. The shared page should update after each result-producing tool call.

## Safety checks

- Every tool advertises `readOnlyHint: true` and `untrustedContentHint: true`.
- Unknown `law_path` values and malformed dates fail before misleading output is produced.
- The earlier date must be strictly before the later date.
- Tool results always include the non-legal-advice disclaimer and source attribution.
- The page sends no cookies and stores no personal data.
- The static-deployment guard rejects Pages Functions, Worker entry points, routes, and compute/storage bindings before deployment.
- Deployment must use `pnpm run deploy` or `wrangler pages deploy`; do not use `wrangler deploy` for this project.
