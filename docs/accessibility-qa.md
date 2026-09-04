# Guide accessibility and safety QA

Guide's central release path is the immediate task-personalization request followed by a human-controlled rescheduling workflow. Verify the dense starting presentation, the one-call focused result, the one-page refinement, and the return-to-original control. Calibration and the simulator are optional, separate checks rather than gates to the primary experience.

## Automated gate

- Unit/component coverage verifies bounded manifests, temporary task composition, region placement, component-override precedence, complete workflow context, human-reserved selection, aggregate-only calibration telemetry, opt-in persistence, reset, stale confirmation rejection, Undo, WebMCP schemas, and simulator isolation.
- Playwright covers desktop and mobile layouts, reduced motion, 200% text, axe scans, the one-call task transformation, one-page refinement, omitted WebMCP execution options, human slot selection, delegated confirmation, immediate tool removal, Undo, and optional calibration.
- The Parkinson's acquisition assertions use the browser's actual `elementFromPoint(...).closest(...)` results. They never search for a nearby control or special-case an appointment button.
- WebMCP discovery is compared before, during, and after task personalization, simulation, and calibration. Neither private calibration aggregates nor simulator state appears in `get_portal_state` or `get_northstar_context`.
- Screenshot capture records the initial portal, the genuine simulator miss, active calibration, the original-versus-proposed approval preview, the approved composed workflow, and Guide presence before confirmation.

## Keyboard pass

- Tab through the header, primary navigation, **Personalize interface**, and portal actions. Confirm every focus indicator is visible and every control has a concise accessible name.
- Invoke `personalize_for_task` with person-owned time selection. Verify the task explanation, **Stop Guide**, focused navigation disclosure, chooser, and **Return to original presentation** are keyboard-operable.
- Select a time, refine to one-page presentation, and confirm focus and selection remain stable while the same components rearrange.
- Open **Personalize interface** with Enter and Space. Choose a semantic region and adjust only the bounded controls exposed for that region.
- Optionally start pointer calibration manually. Verify focus moves to its heading and that Tab reaches the safe **Practice appointment** target, size controls, spacing controls, Reset, and Stop.
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
- Verify the task-personalization explanation, focused-navigation disclosure, unselected time choices, person-owned decision, one-page refinement, and return-to-original control are announced with clear names.
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

Record the final commit, production URL, automated totals, desktop-app build, keyboard result, VoiceOver result, production discovery result, and hero-flow result here only after each check has actually run.

- Date: September 3, 2026
- Feature commit: `59aea28` (`feat: personalize Northstar around the current task`), preceded by the missing-execution-options hotfix `38fb99d`.
- Production URL: [https://guide-webmcp.vercel.app](https://guide-webmcp.vercel.app)
- Check/build: **Pass** — ESLint, 8 Vitest files with 68 tests, TypeScript, and the production Vite build completed successfully.
- Playwright/axe: **Pass** — 61 desktop/mobile cases passed; the one skipped case is the intentional coarse-pointer duplicate of the desktop-only displaced-pointer acquisition test. Axe found no serious or critical issues in the covered states.
- Keyboard: **Pass** — the local built-in-browser and Playwright passes covered the dense starting navigation, one-call task transformation, focused navigation disclosure, chooser heading focus, three named radio choices, End-key selection, one-page refinement with the human selection intact, dynamic confirmation, Undo, Escape paths, and return to the original presentation. Optional calibration remains covered separately.
- Accessibility semantics: **Pass with stated scope** — the browser accessibility tree exposed the baseline portal landmarks and controls, then the personalized dialog name, current appointment, three unselected times, non-committing warning, task explanation, Stop Guide, review, confirmation, and Undo. The focused heading and Guide focus-safety checks passed. Native VoiceOver audio output was not recorded or scored for this revision.
- Local WebMCP discovery: **Pass** — the supported built-in browser discovered all 13 static tools, including `get_northstar_context`, `personalize_for_task`, and the optional `start_interface_calibration`. The real local bridge executed the primary personalization call without execution options and immediately exposed the focused chooser with no selected time.
- Production WebMCP discovery: **Pass** — the queryless HTTPS URL exposed all 13 static tools through the real built-in-browser bridge. `get_northstar_context` reported the complete reschedule sequence, the blocked confirmation prerequisite, explicit-delegation and fresh-state requirements, bounded adaptation capabilities, and the prohibition on arbitrary DOM or code. A separate fresh Playwright context had empty storage, rendered the legacy manifest, and received HTTP 200 from both `/` and `/appointments`.
- Production hero flow: **Pass for direct bridge execution** — one `personalize_for_task` call transformed the live portal, opened the chooser with no selection, and reserved time choice for the person. A real UI click selected September 14 and produced a `You` override while the appointment stayed unchanged. One-page refinement preserved the choice and `rescheduleRevision`. `confirm_reschedule` appeared only during review, revalidated and committed after explicit test delegation, then disappeared immediately. The activity view contained both Guide and You attribution, Undo restored September 10, and Reset Demo returned Home, legacy presentation, the original appointment, no workflow, and no human overrides.
- Natural-language routing matrix: Pending production client rerun; direct tool execution does not prove client-model tool selection.
