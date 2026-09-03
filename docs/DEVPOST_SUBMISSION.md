# Guide — Devpost Submission Draft

## Tagline

Describe what you need. The website reshapes itself. Complete the task with your agent.

## Inspiration

Essential websites often give every person one inherited interface: dense navigation, compact controls, unfamiliar terminology, and too much equally prominent information. Accessibility is often reduced to a global overlay or a diagnosis-based preset. AI agents may explain that fixed interface in another window or operate it invisibly.

Guide explores a different relationship. Through WebMCP, a website can expose its real goals, workflows, current state, adaptation options, prerequisites, decisions, and consequences. A person can tell their preferred client agent what they need to accomplish, what is difficult, how they want information presented, and how much help they want. The website then composes its own trusted components around that person and task.

The agent does not merely operate the website. It helps the website become the interface this particular person needs, then uses that interface with them.

## What It Does

The demonstration begins inside Northstar Health, a fictional patient portal that plausibly resembles an inherited 2008–2015 administrative system. It is dense and dated, but functional.

The person says:

> I don’t understand this portal. I need to change my appointment. Show me only what matters, use simple language, and help me—but let me choose the time.

The client can read Northstar’s machine-readable workflow context, then make 1 complete `personalize_for_task` call. The same page begins changing synchronously:

1. rescheduling becomes the prominent goal;
2. unrelated navigation moves under progressive disclosure but remains available;
3. the current appointment becomes prominent;
4. administrative labels become plain language;
5. controls become larger, separated, and visually distinct;
6. destructive actions remain separate;
7. secondary information collapses but remains discoverable;
8. the non-committing chooser opens with no selected time;
9. Northstar explains what changed.

The person chooses a time manually. Because the current task reserves that decision for them, agent-side time selection returns `human_decision_required`. After the person says “That works. Finish it,” Guide re-reads the shared state, previews the old and new appointment, and confirms only through the dynamically available consequential tool. Back and Undo remain available.

Personalization is not one “simple mode.” A follow-up such as “Show everything on one page” rearranges the same choice and review components without losing the person’s selection. The manual **Personalize interface** editor exposes the same bounded region model without requiring AI.

## How We Used WebMCP

Northstar uses the secure-context imperative `document.modelContext.registerTool()` API. The client supplies language understanding; the website owns semantics, state, rendering, adaptation, privacy, and safety.

Two read surfaces prevent visual guessing:

- `get_northstar_context` describes supported goals, complete workflow steps, present and future availability, blocked reasons, human decisions, consequential actions, adaptation options, assistance levels, and safety rules;
- `get_portal_state` reports the current shared state, revisions, task experience, pending action, and recent human overrides.

The primary action surface is `personalize_for_task`. It accepts only bounded goals and presentation enums, including assistance level, information density, language style, workflow layout, navigation presentation, time-selection ownership, global accessibility values, and sanitized semantic-region adjustments. It never accepts CSS, selectors, HTML, coordinates, scripts, generated DOM, or arbitrary code.

Other tools preserve clear agency levels:

- `guide_to` shows and explains without activation;
- `open_reschedule` opens an unchanged chooser when structural adaptation was not requested;
- `configure_accessibility` handles explicit values such as “make text 175%”;
- `start_interface_calibration` opens optional pointer fine-tuning;
- `select_reschedule_slot` prepares a review only when selection is not human-reserved;
- `confirm_reschedule` registers only for a valid reviewed selection and unregisters immediately after commit.

All action handlers tolerate Site Tools clients that omit execution options while preserving abort handling when a signal exists.

## Moldable but Safe

Northstar uses 1 semantic React component tree. It resolves:

`Northstar defaults → approved functional preferences → temporary task experience → component-specific human overrides`

Each semantic region declares which properties it supports. Bounded changes include region position, ordering, grouping, prominence, row/column/step-by-step layout, target size, spacing, labels, explanation depth, progressive disclosure, status representation, focus visibility, and destructive-action separation.

Presentation may change dramatically, but available workflows, user data, permissions, required warnings, business rules, confirmation requirements, and consequential-action boundaries remain intact. Human choices always outrank earlier agent choices, and stale confirmations fail instead of overwriting a newer selection.

## Assistance Continuum

Northstar describes 5 levels:

- **Show** — identify a place without activation.
- **Explain** — describe what it does and what would happen.
- **Guide** — focus the interface and present the next safe step.
- **Collaborate** — prepare the workflow, share turns, and pause for human decisions.
- **Act** — perform explicitly authorized actions after review and fresh validation.

A request to make the interface easier never authorizes a consequential action.

## Optional Fine-Tuning & Privacy

Calibration remains available when the first adaptation is insufficient, a person repeatedly misses controls, they do not know what size or spacing works, or they explicitly ask to fine-tune. It is never required before help.

The implemented pointer calibration uses a harmless **Practice appointment** target. Northstar reduces pointer input immediately to non-identifying aggregates, adjusts size and then spacing, and waits for explicit comfort approval. It never stores diagnoses, raw coordinates, individual misses, simulator state, or calibration history.

Preferences remain temporary by default. **Remember these preferences on Northstar** stores only an approved functional profile and bounded component overrides. Temporary task experience is never persisted. **Reset demo** clears stored preferences and restores the original portal.

## Simulator Boundary

The human-controlled simulator is a separate demonstration aid, not the product or an input to AI reasoning. Its illustrative effects are excluded from WebMCP context, portal state, profiles, calibration, and workflow history. It does not reproduce disability, diagnose a condition, replace testing with disabled people, or prove accessibility compliance.

## How We Built It

- React 19, TypeScript, Vite, Zustand, Motion, and CSS Modules
- a bounded semantic capability and adaptation manifest
- direct imperative WebMCP with `webmcp-types`
- domain-specific revision safety and serialized Guide presence
- optional bounded SpeechSynthesis
- Vitest, React Testing Library, Playwright, and axe
- Vercel production deployment

## Challenges

The first challenge was making the transformation structural without producing a second template. Dense Northstar and personalized Northstar must be the same live components under different bounded manifests.

The second was exposing enough workflow meaning for an agent without exposing arbitrary page control. The agent needs future steps and blocked prerequisites, but Northstar must retain authorship over every allowed change.

The third was making collaboration enforceable rather than rhetorical. Human-reserved selection, dynamic confirmation registration, fresh revision checks, visible review, attribution, Back, and Undo all needed to agree on one state.

The fourth was keeping personalization private and revisable. Task context is temporary, persistence is opt-in, manual overrides apply last, calibration is local, and the simulator remains isolated.

## What We Learned

WebMCP can be more than an action API for operating fixed pages. It can be a negotiation boundary between a person’s intent, an agent’s reasoning, and a website’s safe semantic building blocks.

The important question is not “Which universal accessible template should replace this site?” It is “What may this website safely reshape for this person and task, and who keeps authority?” In Guide, the website preserves its rules and the person keeps the last word.

## What’s Next

The same pattern can extend to government services, education, banking, insurance, and other complex sites. Additional calibration families should be added only when they can be demonstrated honestly; immediate personalization should continue to work without them.

## Links

- Live demo: [https://guide-webmcp.vercel.app](https://guide-webmcp.vercel.app)
- Public repository: [https://github.com/ikTheProgrammer1/guide-showcase](https://github.com/ikTheProgrammer1/guide-showcase)
- Demo video: upload pending
