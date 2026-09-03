# Guide Accessibility QA

Verify both the dense legacy interface and the structurally adapted interface at the production URL. Reset between layouts and do not use pointer input during the keyboard pass.

## Automated Checks

- Axe: default, simplified, high contrast, large controls, and 200% text.
- Responsive: 1440 × 900 and 375 × 812.
- No horizontal document overflow at 200% text.
- `guide_to` preserves `document.activeElement`.
- Reschedule choices expose a single tab stop and support Arrow keys, Home, and End.
- The modal traps Tab/Shift+Tab, closes with Escape, announces review changes, and restores focus.
- The simulator hierarchy expands only after deliberate click, Enter, Space, or touch input; category focus alone does not expand it.
- Simulator activation leaves the ten static tools and `get_portal_state` unchanged.
- The seeded Parkinson’s case derives miss/success from real `elementFromPoint(...).closest(...)` results.

## Keyboard Pass

- Tab through all primary navigation and header controls; every focus indicator remains visible.
- Activate each portal section with Enter or Space and verify its accessible name in both layouts.
- Open rescheduling, verify focus moves to the dialog title, then Tab once into the time choices.
- Use Arrow Right/Down and Arrow Left/Up to move and select; use Home/End for the first/last time.
- Tab to **Confirm new time**, activate it, verify focus moves to the success heading, then choose **Done** and confirm focus returns to the invoking control.
- Run `guide_to` while a visible control is focused and confirm focus does not move.
- Use Reset Demo and confirm speech stops, the dialog closes, and the legacy interface returns.
- Open the simulator by hover, click, Enter, and Space; deliberately expand each category; close with Escape and verify focus returns to **Simulate a barrier**.
- At 200% text and 375 px, verify the panel, active explanation, disclaimer, and **Stop simulation** remain operable without horizontal page overflow.
- With Parkinson’s active, verify keyboard and touch activate controls normally and Guide pointing never changes focus.

## VoiceOver Pass (macOS)

- Start VoiceOver and navigate landmarks, headings, Portal sections, Guide status, and the main content region.
- Verify every primary navigation item and manual accessibility control has a concise accessible name and state.
- In both layouts, verify the upcoming appointment exposes provider, date, time, status, and its reschedule control.
- Open the dialog and verify its title, current appointment, available-time radiogroup, checked state, review comparison, and confirmation control.
- Confirm the appointment and verify the success status is announced before dismissing it.
- Invoke `guide_to` and verify the polite Guide announcement does not move the VoiceOver cursor or keyboard focus.
- With read-aloud enabled, confirm webpage speech is understandable and bounded; `spokenByPage` remains only an informational result signal.
- Navigate the simulator trigger, category disclosure buttons, native simulation buttons, active label, explanation, disclaimer, and Stop control. Confirm start/stop announcements are polite and do not interrupt the current cursor position.
- Verify Dyslexia and Concentration difficulty are announced as illustrative simulations; do not use either as evidence of a real disability experience.

## Simulator Boundary

The simulator is a demonstration aid for isolated barriers. Guide/WebMCP is the product. These effects do not reproduce a person’s disability, replace testing with disabled people, or establish accessibility compliance. The simulator is excluded from WebMCP and remains separate from portal preferences, revisions, activity, and human overrides.

## Release Record

- Date: September 3, 2026
- Production build/commit: `f7ba299`
- Browser/app version: ChatGPT/Codex desktop built-in browser `26.901.20858`; macOS `15.7.4`; production WebMCP capability
- Legacy keyboard: **Pass** — all portal navigation names were exposed; Enter opened Appointments; the dialog used title → one radio tab stop → confirmation → success heading → Done; focus returned to **Reschedule appointment**.
- Adapted keyboard: **Pass** — the same flow passed with 150% text, stronger contrast, simplified density, larger controls, increased spacing, interactive emphasis, and color-independent status.
- Legacy VoiceOver: **Pass** — live VoiceOver and the browser accessibility tree exposed the portal landmarks, Guide status, appointment summary, dialog title, current time, three-option radiogroup, review, confirmation, and success status.
- Adapted VoiceOver: **Pass** — the adapted appointment and all eight manual preference names/states were exposed; the complete dialog flow and success status remained available.
- Guide focus: **Pass** — with VoiceOver running, `guide_to` exposed its polite page announcement while keyboard focus stayed on the same reschedule control. The overlay remained non-interactive and non-focusable.
- Speech: **Pass** — production SpeechSynthesis reached `onend` for the read-aloud cases; automated coverage separately verifies unsupported, error, abort, previous-speech cancellation, and the 25-second timeout paths. `spokenByPage` was treated only as an informational signal.
- Issues found/fixed: the production pass found and fixed the missing Home reschedule semantic target (`165bbd2`) and moved the close control later in dialog focus order so one Tab from the title reaches the radio group (`f7ba299`). No remaining blocking issue was observed. VoiceOver was stopped after the pass.

The VoiceOver pass used live VoiceOver navigation plus observable accessibility-tree and focus state. It did not record or score the synthesized audio waveform.

## Integrated Simulator Addendum

- Date: September 3, 2026
- Automated gate: **Pass** — 31 unit/component tests and 41 desktop/mobile Playwright cases passed; one coarse-pointer duplicate of the fine-pointer-only Parkinson’s acquisition case was intentionally skipped. Axe reported no serious or critical simulator-control violations.
- Simulator keyboard: **Pass** — focus alone left categories collapsed; Enter and Space expanded/collapsed them deliberately; Escape closed the panel and restored focus to **Simulate a barrier**.
- Responsive/touch: **Pass** — the panel and Stop control remained operable at 375 × 812 and 200% text without document-level horizontal overflow. Touch activation bypassed pointer displacement as designed.
- Parkinson’s acquisition: **Pass** — at the seeded phase, the compact legacy control’s physical and displaced coordinates resolved to different elements and produced a visible miss. After the existing WebMCP accessibility tool created large separated controls, both coordinates resolved to the same adapted control and activation succeeded. The full manual-selection and delegated-confirmation flow then passed with the simulation still active.
- Guide and WebMCP isolation: **Pass** — Guide remained crisp and focus-safe; simulator activation did not alter the ten static tools, dynamic confirmation lifecycle, portal state, accessibility preferences, revisions, activity, or human overrides.
- VoiceOver/native accessibility: **Pass** — with macOS VoiceOver enabled, the native browser accessibility tree exposed the collapsed/expanded trigger, four category disclosures, selected simulation state, **Illustrative simulation: Parkinson’s**, functional explanation, exact disclaimer, polite start announcement, and **Stop simulation**. The adapted dialog exposed its title, current and new times, radiogroup, confirmation, and focused success heading.
- Boundary: these results verify implementation behavior only. They do not reproduce disability experience, replace disabled-user testing, or establish accessibility compliance.
