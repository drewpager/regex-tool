# Regex Concatenation Tool — Documentation

## 1. Overview

The Regex Concatenation Tool is an internal Siege Media web utility that converts a list of URLs into a single pipe-delimited regex pattern string. A user pastes URLs (one per line), selects how much of each URL to strip, and picks whether the pattern should match strictly or with a wildcard. The tool instantly outputs a ready-to-paste regex, automatically copies it to the clipboard, and requires no backend, login, or internet connection beyond loading the page. It is primarily used to build regex patterns for redirect rules, analytics filters (e.g., Google Analytics 4 filters), or site crawl exclusions.

---

## 2. Data Inputs

| Name | Source | Type/Format | Required? | Notes |
|---|---|---|---|---|
| URL list | User pastes into the textarea | Plain text, one URL per line | Yes | Blank lines are ignored. No header row expected. Leading/trailing whitespace on each line is trimmed. |
| URL Clean-Up Option | Radio button selection in the UI | Enum (one of 5 values) | Yes (defaults to "Don't change anything") | Controls how much of each URL is stripped before building the pattern. |
| Regex Matching Option | Radio button selection in the UI | Enum (`strict` or `wildcard`) | Yes (defaults to `strict`) | Controls the suffix appended to each processed URL segment. |

### URL Clean-Up Option Values

| Option | What Is Stripped | Example Input → Output |
|---|---|---|
| Don't change anything | Nothing | `https://www.example.com/page` → `https://www.example.com/page` |
| Remove Scheme | `https://` or `http://` | `https://www.example.com/page` → `www.example.com/page` |
| Remove Scheme & Subdomain | Scheme + `www.` | `https://www.example.com/page` → `example.com/page` |
| Remove Scheme, Subdomain, Domain | Everything up to and including the domain | `https://www.example.com/page` → `/page` |
| Remove Scheme, Sub, Dom, Trailing Slash | Everything up to and including the first `/` | `https://www.example.com/page` → `page` |

### Regex Matching Option Values

| Option | Suffix Appended | Use Case |
|---|---|---|
| Strict | `$` | Match the exact URL path, nothing after it |
| Wildcard | `.*` | Match the path and anything following it (subpages, query strings) |

---

## 3. Outputs

**What it is:** A single pipe-delimited regex string combining all processed URLs.

**Where it goes:**
- Displayed in a read-only textarea on the page
- Automatically written to the user's clipboard via the browser Clipboard API

**Format:** `<pattern1>|<pattern2>|<pattern3>` — e.g., `/category/product$|/other/page$`

**Trigger/Frequency:** Output is regenerated live on every keystroke in the URL input field and on every change to either option. There is also a manual "Process" button, but it is redundant with the live `useEffect`.

**Side effects:** None — the tool makes zero network requests and writes nothing to any server or storage.

---

## 4. Assumptions

- ⚠️ **Default cleanup option** is `keepFullUrl` ("Don't change anything") — hardcoded as the initial `useState` value in `App.js:6`.
- ⚠️ **Default matching option** is `strict` — hardcoded as the initial `useState` value in `App.js:7`.
- ⚠️ **Brand colors** are hardcoded in `App.css`: black `#000000`, red `#e51e2b`, hover red `#c01a24`.
- **Each URL is on its own line** — the input is split on `\n`. URLs with embedded newlines will be silently split into multiple entries.
- **URLs without a scheme** are coerced to `https://` before parsing (line 57: `url.startsWith('http') ? url : \`https://${url}\``). If a non-URL string is entered, the URL constructor will throw and the raw string will be used as-is (fallback at line 70).
- **Clipboard access is available** — `navigator.clipboard.writeText()` requires either `localhost` or an HTTPS origin. The tool will fail silently (show an error in the copy-status area) if served over plain HTTP.
- **No query parameters or hash fragments** are stripped by any cleanup option except the two path-only options (`removeSchemeSubdomainDomain` and `removeSchemeSubdomainDomainSlash`), which preserve them via `urlObj.search + urlObj.hash`.
- **The tool runs entirely in the browser** — no authentication, no session, no persistent state.

---

## 5. Limitations

- **Scale ceiling:** No hard row limit, but very large URL lists (thousands of URLs) will produce extremely long regex strings that may exceed character limits in the destination system (e.g., Google Analytics 4 filters have a 255-character limit per filter; Apache/Nginx configs have line length limits).
- **No deduplication:** Duplicate URLs in the input produce duplicate patterns in the output.
- **No validation:** The tool does not warn if a URL is malformed. Invalid URLs fall back to the raw string.
- **`www.` removal is naive:** The "Remove Scheme & Subdomain" option removes only `www.` — subdomains like `blog.` or `m.` are not stripped.
- **Clipboard permission:** Auto-copy requires HTTPS or `localhost`. No graceful fallback is provided — the user must copy manually from the output textarea if the API call fails.
- **No URL encoding/decoding:** Special characters in URLs are not escaped to regex-safe equivalents. A URL containing `.` (literal dot) will produce a pattern where `.` matches any character. If the destination regex engine interprets `.` as a wildcard, this could cause over-matching.
- **The test suite is stale** (`App.test.js` still contains the default Create React App test and will fail if run).
- **PWA manifest is uncustomized** (`public/manifest.json` still contains placeholder CRA values).

---

## 6. Design Decisions & Constraints

- **Single-component architecture:** The entire app is one ~190-line React component (`src/App.js`). There are no sub-components, no custom hooks, and no external state libraries. Rationale: the tool is simple enough that this is appropriate and minimizes maintenance overhead.
- **Create React App as the base:** The project was bootstrapped with CRA (`react-scripts 5`). Rationale: likely chosen for speed of setup. This means the build toolchain is opinionated and not easily customized without ejecting.
- **Live processing via `useEffect` + manual button:** Output regenerates automatically on every input change, but a "Process" button also exists. The button is effectively a duplicate trigger. Rationale: unknown — this may be an artifact of an earlier version where auto-processing was not yet implemented.
- **No backend:** The tool is fully static. Rationale: there is nothing to persist, no authentication required, and static hosting is simpler and cheaper.
- **URL cleaning via the native `URL` constructor:** Instead of manual string splitting, the browser's `URL` API is used to extract `pathname`, `search`, and `hash`. This is more robust than regex-based parsing for most well-formed URLs.
- **No regex escaping of special characters:** URLs can contain characters that are meaningful in regex (`.`, `?`, `+`, etc.). The tool does not escape them. This appears to be an intentional tradeoff — the common use case (path-based URL patterns) rarely includes characters that would cause regex mismatches in practice. For exact-match use cases in strict regex engines, users would need to escape manually.

---

## 7. How to Run / Trigger

### Using the Hosted Build (Static Files)

The `/build/` folder contains a pre-built production bundle. Serve it with any static file host (Nginx, Apache, Vercel, Netlify, GitHub Pages, etc.) or locally:

```bash
npx serve build
```

Then open `http://localhost:3000` (or whichever port is reported).

**Important:** Serve over HTTPS or `localhost` — clipboard auto-copy requires a secure context.

### Running Locally in Development

```bash
cd /path/to/regex-tool
npm install
npm start
```

This opens `http://localhost:3000` automatically.

### Using the Tool

1. Open the tool in a browser.
2. Select a **URL Clean-Up Option** (default: "Don't change anything").
3. Select a **Regex Matching Option** (default: Strict, appends `$`).
4. Paste your list of URLs into the textarea — one URL per line.
5. The output regex appears instantly in the output box and is copied to the clipboard.
6. Paste the result wherever needed (redirect config, analytics filter, etc.).

**Verify it worked:** The message "Output automatically copied to clipboard!" appears below the output box. If clipboard access failed, "Failed to copy output to clipboard: ..." will appear instead — copy manually from the output textarea.

**Permissions required:** No login or permissions needed. Any user with access to the hosted URL can use the tool.

---

## 8. Maintenance Notes

### When to Update the Code

| If this changes... | Update here |
|---|---|
| Siege Media brand colors | `src/App.css` — search for `#e51e2b` and `#000000` |
| Default cleanup or matching behavior | `src/App.js` lines 6–7 — change the `useState` initial values |
| Adding a new cleanup option | `src/App.js` — add an entry to the `cleanupOptions` array and a corresponding `else if` branch in `processUrls()` |
| Adding a new matching suffix | `src/App.js` — add an entry to `matchingOptions` and a corresponding `else if` branch in `processUrls()` |

### Deploying Changes

```bash
npm run build
```

Then deploy the contents of `/build/` to your static host.

### Known Fragile Spots

- The test in `src/App.test.js` is broken (still contains the default CRA test). Running `npm test` will fail. Fix by updating the test to assert against actual app content before relying on CI.
- The `public/manifest.json` still has CRA placeholder values — update `short_name` and `name` if this is ever published as a PWA.

### Suggested Future Improvements

- Add regex escaping for special characters (`.`, `?`, `+`) in URL segments so output is safe to use in strict regex engines.
- Add a deduplication step to remove identical URLs before building the pattern.
- Add a character-count warning if the output exceeds common limits (e.g., 255 chars for GA4 filters).
- Replace Create React App with Vite (aligns with team's preferred stack and is significantly faster to build).
