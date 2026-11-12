# ShaktiQ Production Rules

One-line rules learned from measured improvements and regression checks.

- [R1] Question and answer datasets must never be modified; verify byte-identical SHA-256 checksums before and after any change.
- [R2] BPSC exam marking engine must strictly enforce: +1 correct, -1/3 wrong, 0 for Option E (Safe Skip), -1/3 blank row penalty.
- [R3] Visual identity (dark green #10402D, logo, hero) and core exam content must stay intact across all improvements.
- [R4] Mobile performance on low-end Android devices with 4G latency takes precedence over decorative scripts.
- [R5] In GitHub Pages environments, custom response headers cannot be set; use HTML meta tags, service worker cache headers, or client-side declarations.
- [R6] Hero image must be served as WebP, under 200 KB, with explicit width/height and fetchpriority="high" preload in head.
- [R7] All interactive buttons inside role="tablist" must have role="tab" and aria-selected attributes; headings must strictly follow sequential order without skipping levels.
- [R8] Unauthenticated network requests to protected backends must never execute on initial boot; defer until user login or test start.
- [R9] Form input fields on mobile must have font-size >= 16px to prevent intrusive iOS/Android viewport zoom.
- [R10] Sitemaps must contain clean canonical URLs only; fragment identifiers (#) must never be placed in XML sitemaps.
- [R11] Language switcher must update document.documentElement.lang dynamically to maintain accessibility for screen readers and search engines.
