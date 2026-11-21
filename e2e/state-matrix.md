# Algorithm Visualizer state matrix

Every cell names the test that covers it (`file › test`), or why it cannot happen.
The app has no API, so "loading"/"error" exist only where noted.

## Regions × states

| Region | Empty | Loading | Error | Populated | Edge |
|---|---|---|---|---|---|
| Landing (`/`) | n/a — no landing page | n/a | n/a | states › lands in the first lesson; flows › / redirects | states › page starts at the top (scroll regression) |
| Course sidebar | n/a — course is static data | n/a — server-rendered | n/a | states › every chapter listed, links in order; current lesson marked | states › soon lessons are inert; visual › sidebar |
| Course progress | states › 0 / 4 on first visit | n/a | states › corrupt storage; storage that throws | states › completing a lesson survives reload | — |
| Visualizer stage | n/a — input always ≥ 2 | n/a — client-side, no fetch | flows › unknown slug is a 404 | states › initial / compare / swap / done frames (×4 algos) | states › edge: 2 items, 16 items, duplicates, negatives, huge numbers, proportional heights, labels never clipped |
| Telemetry counters | states › initial (all 0) | n/a | n/a | states › compare / swap / done | — |
| Pseudocode | n/a | n/a | n/a | states › compare frame lights the algo's own line | — |
| Execution log | n/a | n/a | n/a | states › initial / done | — |
| Step-trace table | n/a | n/a | n/a | interactions › trace row jumps | interactions › current row auto-scrolls into view |
| Custom input | interactions › invalid input keeps the previous array | n/a | interactions › invalid input | interactions › custom: Enter / blur commit | states › hostile text never executes |
| Page layout | — | — | — | visual › page shots | theme-a11y › phone layout @responsive |

## Controls × states

| Control | Rest | Hover | Pressed / effect | Focus-visible | Disabled | Busy |
|---|---|---|---|---|---|---|
| Step Back | visual | theme-a11y › hover differs | interactions › step buttons | theme-a11y › tab walk | interactions › disabled at the ends | n/a |
| Step Forward | visual | theme-a11y › hover differs | interactions › step buttons | theme-a11y › tab walk | interactions › disabled at the ends | n/a |
| Play / Pause / Replay | visual | — | interactions › play, pause, replay | theme-a11y › tab walk | n/a — never disabled | n/a (Pause is the "running" state) |
| Speed select | visual | — | interactions › 4× speed | theme-a11y › tab walk | n/a | n/a |
| Scrubber | visual | — | interactions › scrubber jumps | theme-a11y › scrubber focus indicator | n/a | n/a |
| Shuffle | visual | — | interactions › shuffle | theme-a11y › tab walk | n/a | n/a |
| Size toggles (6/8/10/12) | visual | — | interactions › size toggles (aria-pressed) | theme-a11y › tab walk | n/a | n/a |
| Custom edit | visual | — | interactions › custom | theme-a11y › tab walk | n/a | n/a |
| Trace rows | visual | — | interactions › trace row jumps | theme-a11y › tab walk | n/a | n/a |
| Sidebar lesson link | visual › sidebar | — | navigation › sidebar opens each lesson | theme-a11y › tab walk | states › soon lessons are inert | n/a |
| Chapter fold toggle | visual › sidebar | — | states › only the current chapter starts open | theme-a11y › tab walk | n/a | n/a |
| Course button (phones) | visual @mobile | — | navigation › course tree folds away on phones | theme-a11y › tab walk | n/a | n/a |
| Next-lesson key | visual | — | navigation › next-lesson key lights up when finished | theme-a11y › tab walk | navigation › last lesson has no next key | n/a |
| Logo link | visual | — | navigation › logo returns to the first lesson | theme-a11y › tab walk | n/a | n/a |
| Keyboard (space, ←/→, s) | — | — | interactions › keyboard shortcuts | — | interactions › ignored while typing | — |
