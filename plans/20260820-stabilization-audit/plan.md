# Stabilization audit — 2026-08-20

## Scope

Verified stabilization of F:\franky-s-arcade-studio after the read-only audit: toolchain gate, SEO URL foundation, TanStack SSR/data loading, Three.js runtime optimization, tests/release verification.

## Evidence

- TypeScript check: `node node_modules/typescript/bin/tsc --noEmit` passed with no output.
- Production build baseline previously passed. After dependency cleanup, Vite reaches the bundle stage but the MCP command exits non-zero after warnings; no new artifact was emitted, so the post-cleanup build is not yet a PASS gate.
- Build artifact inspection: `.output/public/assets/index-oiZ3yuC0.js` is 906.88 KB and `Cap3DViewer-D3ZqT9B0.js` is 472.90 KB. The 3D viewer is already separated from the main entry. Current build confirms `arcade-audio.ts` is statically imported by Header/home/shop/track/PixelRunner and also dynamically imported by cart/checkout; the dynamic imports therefore do not split it.
- Unit tests: 4 files / 21 tests passed via Vitest 4.1.11.
- Full ESLint invocation exceeded the MCP output buffer; therefore lint is not yet a clean verified gate. Targeted component lint also exits non-zero without usable output, so lint remains unresolved.
- `agy`: `spawn agy ENOENT`, so delegated audit unavailable.
- Working tree: `.gitignore`, `src/components/frankys/Cap3DViewer.tsx`, `src/routes/index.tsx`, `src/routes/shop.$slug.tsx`, `package.json`, `package-lock.json`, deleted unused `src/components/ui/` scaffold, and plan directory are changed.
- SEO: robots/sitemap have environment URL fallback; canonical was changed to relative URLs; Product JSON-LD currently lacks `url`.
- Performance: main JS remains 906.88 KB in the last emitted artifact; Cap3DViewer remains a separate 472.90 KB chunk. Five product PNGs total about 886 KB. The unused UI scaffold was confirmed to have no imports outside itself and has been removed, reducing install/dependency surface rather than the already-emitted browser bundle.

## Execution plan

1. Establish reliable lint/test/build verification.
2. Centralize public site URL for canonical, robots, sitemap, OG and JSON-LD.
3. Improve TanStack route-level SSR/preloading and avoid duplicate product/catalog fetches.
4. Keep 3D progressive enhancement and reduce unnecessary render work.
5. Add E2E coverage for product/cart/checkout/order access and SEO endpoints.
6. Re-run verification; inspect git status/diff; remove generated artifacts that should not be tracked.

## Release gates

- lint pass
- tests pass
- production build pass
- no accidental generated/untracked artifacts
- canonical/robots/sitemap/JSON-LD use production site URL
- product/cart/checkout flows remain functional
