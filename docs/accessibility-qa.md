# Guide Accessibility QA

Verify both the dense legacy interface and the structurally adapted interface at the production URL. Reset between layouts and do not use pointer input during the keyboard pass.

## Automated Checks

- Axe: default, simplified, high contrast, large controls, and 200% text.
- Responsive: 1440 × 900 and 375 × 812.
- No horizontal document overflow at 200% text.
- `guide_to` preserves `document.activeElement`.
- Reschedule choices expose a single tab stop and support Arrow keys, Home, and End.
- The modal traps Tab/Shift+Tab, closes with Escape, announces review changes, and restores focus.

## Keyboard Pass

- Tab through all primary navigation and header controls; every focus indicator remains visible.
- Activate each portal section with Enter or Space and verify its accessible name in both layouts.
- Open rescheduling, verify focus moves to the dialog title, then Tab once into the time choices.
- Use Arrow Right/Down and Arrow Left/Up to move and select; use Home/End for the first/last time.
- Tab to **Confirm new time**, activate it, verify focus moves to the success heading, then choose **Done** and confirm focus returns to the invoking control.
- Run `guide_to` while a visible control is focused and confirm focus does not move.
- Use Reset Demo and confirm speech stops, the dialog closes, and the legacy interface returns.

## VoiceOver Pass (macOS)

- Start VoiceOver and navigate landmarks, headings, Portal sections, Guide status, and the main content region.
- Verify every primary navigation item and manual accessibility control has a concise accessible name and state.
- In both layouts, verify the upcoming appointment exposes provider, date, time, status, and its reschedule control.
- Open the dialog and verify its title, current appointment, available-time radiogroup, checked state, review comparison, and confirmation control.
- Confirm the appointment and verify the success status is announced before dismissing it.
- Invoke `guide_to` and verify the polite Guide announcement does not move the VoiceOver cursor or keyboard focus.
- With read-aloud enabled, confirm webpage speech is understandable and bounded; `spokenByPage` remains only an informational result signal.

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
