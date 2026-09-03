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

- Date:
- Production build/commit:
- Browser/app version:
- Legacy keyboard: Pending
- Adapted keyboard: Pending
- Legacy VoiceOver: Pending
- Adapted VoiceOver: Pending
- Issues found/fixed:

