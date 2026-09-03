# Guide accessibility and safety QA

Guide's central release path is the closed-loop pointer-precision calibration followed by the human-controlled rescheduling workflow. Verify both the initial dense presentation and the composed result. Reset between passes and keep the Parkinson's simulator active for the acquisition portion of the hero flow.

## Automated gate

- Unit/component coverage verifies bounded manifests, region composition, component-override precedence, aggregate-only calibration telemetry, ordered size-then-spacing adjustment, approval, opt-in persistence, reset, stale confirmation rejection, Undo, WebMCP schemas, and simulator isolation.
- Playwright covers desktop and mobile layouts, reduced motion, 200% text, axe scans, keyboard operation, the safe practice target, a genuine seeded miss, local progression, explicit approval, the opened chooser, human slot selection, delegated confirmation, immediate tool removal, and Undo.
- The Parkinson's acquisition assertions use the browser's actual `elementFromPoint(...).closest(...)` results. They never search for a nearby control or special-case an appointment button.
- WebMCP discovery is compared before, during, and after simulation and calibration. Neither private calibration aggregates nor simulator state appears in `get_portal_state`.
- Screenshot capture records the initial portal, the genuine simulator miss, active calibration, the approved composed workflow, and Guide presence before confirmation.

## Keyboard pass

- Tab through the header, primary navigation, **Personalize interface**, and portal actions. Confirm every focus indicator is visible and every control has a concise accessible name.
- Open **Personalize interface** with Enter and Space. Choose a semantic region and adjust only the bounded controls exposed for that region.
- Start pointer calibration manually. Verify focus moves to its heading and that Tab reaches the safe **Practice appointment** target, size controls, spacing controls, Reset, and Stop.
- Activate the practice target with the keyboard. Confirm it counts as a safe success and never triggers a portal action.
- Complete several attempts, reach the comfort review, and verify approval is unavailable until the success thresholds are met.
- Toggle **Remember these preferences on Northstar** using the keyboard and confirm persistence occurs only after explicit approval.
- Approve with Enter. Verify the rescheduling chooser opens locally with no selected time and focus moves to the dialog heading.
- Tab once into the radiogroup. Use Arrow keys and Home/End, then verify the human choice is preserved in the review.
- Use **Back** to revise the choice. Confirm only one radio receives a tab stop.
- After an explicitly delegated Guide confirmation, verify focus moves to the success heading. Activate **Undo** and confirm the original appointment is restored.
- Press Escape in the personalizer or calibration and verify focus returns to **Personalize interface**.
- Run `guide_to` while another control is focused and confirm neither keyboard nor screen-reader focus moves.
- With Parkinson's active, confirm keyboard activation bypasses pointer displacement as intended.

## VoiceOver pass on macOS

- Navigate the banner, header, primary navigation, Guide status, main landmark, and **Personalize interface** control in the initial and composed layouts.
- Verify each semantic-region option exposes its name and selected state. Confirm target-size and spacing controls announce their current values without exposing CSS or DOM terminology.
- In calibration, verify the dialog name, concise instructions, progress, safe practice target, adjustment controls, optional Remember checkbox, comfort question, Reset, and Stop are announced.
- Confirm progress and phase changes use polite announcements and do not move the VoiceOver cursor unexpectedly.
- After approval, verify the appointment dialog announces its title, current appointment, three-option radiogroup, selected time, review comparison, Back, and explicit confirmation control.
- Confirm Guide pointing is announced politely while keyboard and VoiceOver focus remain on the person's current control.
- Verify success and Undo are announced and remain operable.
- Navigate the simulator disclosure hierarchy, selected simulation state, active explanation, disclaimer, and Stop control. Confirm the simulator remains a separately framed demonstration aid.

## Responsive and motion checks

- At 375 x 812 and 200% text, verify the simulator panel, personalizer, calibration, chooser, review, success, and Undo remain usable without document-level horizontal overflow.
- On coarse pointer/touch, verify the simulator never displaces input.
- Under reduced motion, verify continuous tremor and cycling effects become restrained static effects while focus and announcements remain unchanged.
- Confirm simulator controls, the skip link, Guide pointer, and Guide bubble remain crisp and outside all simulation filters.

## Privacy and product boundary

- Pointer events are reduced immediately to non-identifying counts and displacement magnitude buckets; raw coordinates are never stored.
- Approval stores only functional target-size, spacing, labeling, and safety preferences. It never stores a diagnosis, simulator state, miss history, or raw measurements.
- Persistence is session-only unless the person explicitly selects **Remember these preferences on Northstar**. That opt-in stores the approved bounded profile locally; Reset Demo removes it.
- Calibration never reads simulator state and diagnosis terms never select a template.
- The simulator is a demonstration aid for isolated barriers. It does not reproduce anyone's disability, replace testing with disabled people, or establish accessibility compliance.
- Guide and WebMCP remain the product. The browser is offered bounded semantic intents only; no arbitrary CSS, selectors, HTML, coordinates, or DOM manipulation are exposed.

## Release record

Record the final commit, production URL, automated totals, desktop-app build, keyboard result, VoiceOver result, production discovery result, and hero-flow result here only after each check has actually run. The prior release record is historical and does not establish that this calibration-centered revision passed.

- Date: September 3, 2026
- Check/build: **Pass** — ESLint, 8 Vitest files with 48 tests, TypeScript, and the production Vite build completed successfully.
- Playwright/axe: **Pass** — 47 desktop/mobile cases passed; the one skipped case is the intentional coarse-pointer duplicate of the desktop-only displaced-pointer acquisition test. Axe found no serious or critical issues in the covered states.
- Keyboard: **Pass** — the local built-in-browser pass covered initial navigation names, the bounded personalizer, the calibration focus loop, safe practice, comfort review, local chooser opening, a single radiogroup tab stop, End-key selection, Back, confirmation, focused success, and Undo. This pass found and fixed a focus-loop defect caused by the intentionally untabbable neighboring practice control.
- VoiceOver: **Pass with stated scope** — macOS VoiceOver was enabled during the local pass. The browser accessibility tree exposed the initial portal, semantic regions, calibration instructions/progress/adjustments, Remember checkbox, chooser radiogroup, current/new review, confirmation, focused success, and Undo. The pass did not record or score VoiceOver audio output.
- Production WebMCP discovery: **Pass** — the supported built-in browser discovered all 11 static tools from the queryless HTTPS URL, including `start_interface_calibration`. The schemas exposed only bounded enums and semantic targets. Both `/` and `/appointments` returned HTTP 200, and the browser rendered the Appointments view directly at the latter route.
- Production hero flow: **Pass for direct tool execution** — a spec-shaped `document.modelContext` capture executed the deployed tools against the real production UI. The run produced a genuine hit-test miss, opened calibration once, reached a 44 px target and 16 px spacing through local attempts, opened the chooser with no selected slot, preserved the human's September 14 choice, registered and executed `confirm_reschedule`, removed it immediately after commit, and restored September 10 through Undo. Native production discovery was verified separately in the built-in browser.
- Natural-language routing matrix: Pending production rerun; the earlier P0 20/20 result does not prove the revised calibration routing.
