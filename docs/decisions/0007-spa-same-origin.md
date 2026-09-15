# 0007 — React SPA served from the API's origin (no separate frontend host)

**Requirement / problem:** the task screen is behind login, needs no SEO, and must work with the existing cookie session. One developer, one deploy.
**Options:** A) SPA on a separate host/CDN (Vercel, Render static) calling the API cross-origin  B) Next.js SSR  C) SPA built by Vite, static files served by Express on the same origin
**Chosen:** C
**Because:** same origin means no CORS configuration, no `SameSite=None` cookie weakening, no preflight requests, and one thing to deploy; the page is behind login so SSR/SEO (B) buys nothing; in dev Vite proxies `/auth` and `/tasks` so the browser sees one origin there too.
**Accepted downsides:** frontend and API deploy together (a CSS change rebuilds the API image); static files come from Node instead of a CDN — fine at this scale; the mobile app (P4) will call the API cross-origin anyway and will need its own auth transport decision.
**Evidence:** Playwright drove the real UI end to end (manager creates → staff claims → completes); the container serves `/` as HTML and `/tasks/1` with `Accept: application/json` as the API (401), not index.html.
**Revisit when:** the frontend needs its own release cadence or a CDN for global users, or when a public marketing page needs SEO → move the SPA to a static host and add CORS with an explicit origin allow-list.
