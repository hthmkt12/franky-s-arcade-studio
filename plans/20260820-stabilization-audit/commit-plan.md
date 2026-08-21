# Commit plan

Scope: commit the verified stabilization/performance/SEO/image changes currently present in the working tree, while excluding generated/temp artifacts and avoiding unrelated changes.

1. Inspect staged + unstaged diffs and classify files.
2. Verify image references and generated WebP assets.
3. Exclude temporary bundle-analyzer output and CLI-only artifacts.
4. Stage the intended project changes.
5. Run git diff --cached --check and inspect staged stat.
6. Commit with a concise stabilization/performance message.
7. Read back git status and commit summary.

Verification already completed before commit request: tsc PASS, ESLint PASS, tests 21/21 PASS, production Vite/Nitro build PASS; WebP conversion reduced five hat images from ~885.6 KB PNG to ~95.5 KB WebP.
