# ShaktiQ Autonomous Engineering Changelog

Karpathy loop execution log: every unit, attempt, measurement, check result, and decision.

## Baseline
- **Date**: 2026-11-12
- **Branch**: `improve/site-audit`
- **Backup Tag**: `backup-before-audit` (pushed to origin)
- **Unit 11**: Baseline regression tests suite created (`scripts/run_regression_tests.js`) — 36/36 tests passed (100%). Data checksums locked in `scripts/data_checksums.json`.

---

## Unit 1: Images (U1)
- **Status**: PASSED
- **Changes**:
  - Converted `hero-museum.png`, `logo.png`, `yt-logo.png`, `logo-white.png`, `bodhi-tree.png` to modern `.webp` with `<picture>` fallbacks.
  - Reduced `hero-museum` from 532 KB to 78 KB (85% reduction, well below 200 KB threshold).
  - Reduced `logo.png` from 113 KB to 33 KB (70% reduction).
  - Added explicit `width` and `height` to all `<img>` elements to eliminate Cumulative Layout Shift (CLS).
  - Added `<link rel="preload" as="image" href="/hero-museum.webp" type="image/webp" fetchpriority="high">` to `<head>`.
  - Added `loading="lazy"` and `decoding="async"` to all below-the-fold images.
- **Verification**: 36/36 regression tests passed. Data checksums identical. All images < 200 KB.
- **Commit**: `206ad5a` (pushed to `origin/improve/site-audit`)

---

## Unit 4: Accessibility (U4)
- **Status**: PASSED
- **Changes**:
  - Fixed `aria-required-children`: added `role="tab"` and `aria-selected` to all child buttons inside `role="tablist"` (Exam Switcher tabs: `tab-btn-bpsc`, `tab-btn-bssc`, `tab-btn-aedo`; Revision tabs: `rev-tab-btn-bihar`, `history`, `aedo`, `polity`, `science`; Legal modal tabs: `privacy`, `terms`, `contact`).
  - Fixed heading sequence: upgraded footer `<h4>` headings and practice workspace question `<h4>` headings to semantic `<h3>`.
  - Added accessible `aria-label="Exam Time Remaining"` to real-time timer element.
- **Verification**: 36/36 regression tests passed (100%). Data checksums byte-identical.
- **Decision**: Keep and commit.
