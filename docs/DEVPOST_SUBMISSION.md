# Guide — Devpost Submission Draft

## Tagline

A website that calibrates with the person, then composes itself around approved functional preferences.

## Inspiration

Essential websites often present one inherited interface to everyone: compact controls, dense information, unfamiliar terminology, and status colors that assume people perceive and operate them in the same way. Accessibility is then reduced to a fixed overlay or a diagnosis preset. AI may offer instructions in a separate chat or complete work invisibly.

Guide explores a different relationship. A website can expose bounded semantic adaptation through WebMCP. An agent can identify the right calibration family from a functional need, while the webpage and person determine what actually feels comfortable. The resulting interface is composed from approved preferences—not from a diagnosis.

## What It Does

The demonstration begins inside Northstar Health, a fictional institutional patient portal that is dense and dated but still functional.

In the hero story, a human-controlled Parkinson’s pointer-precision simulation produces an honest miss on a compact appointment control. The person says:

> My hand shakes and I keep missing buttons. Help me use this page.

ChatGPT calls one semantic WebMCP tool: start_interface_calibration for pointer precision and the bounded reschedule goal. Northstar immediately opens a safe practice button and the WebMCP call returns.

Every practice attempt after that happens locally. Northstar:

1. reduces pointer input to non-identifying aggregates and never retains raw coordinates;
2. adjusts target size first;
3. adjusts control spacing second;
4. requires several successful attempts;
5. lets the person request larger, smaller, closer, or farther-apart controls;
6. asks for explicit comfort approval.

The practice target cannot navigate, select an appointment, or change account data. Calibration never reads simulator state and never treats it as a diagnosis.

After approval, Northstar stores only a bounded functional profile. It composes compatible semantic regions independently—navigation, appointment summary, appointment actions, statuses, forms, and secondary content—inside one React component tree. There is no fixed legacy/adapted template swap.

Because the calibration goal is rescheduling, Northstar locally opens a large, separated appointment chooser, but stops before selecting a time. The person chooses. Guide can confirm only after explicit delegation and a fresh appointment, slot, and workflow revision check. The result includes Back, review, and Undo.

An optional **Remember these preferences on Northstar** choice writes only the versioned functional profile and bounded region overrides to local storage. It never stores Parkinson’s, simulator state, miss history, or raw measurements.

## How We Used WebMCP

Northstar uses the secure-context imperative document.modelContext.registerTool API. ChatGPT supplies language understanding; Northstar owns safe calibration, component semantics, shared state, rendering, and Guide’s visible presence.

The page exposes meaning rather than arbitrary automation:

- start_interface_calibration selects one implemented functional calibration family and one bounded task goal;
- configure_accessibility applies an explicit request such as “make text 175%”;
- guide_to points and explains without activation;
- open_reschedule opens a non-committing chooser;
- confirm_reschedule appears only for a valid reviewed selection and unregisters immediately after commit.

No tool accepts arbitrary CSS, selectors, HTML, coordinates, generated DOM, or unrestricted scripts.

A vague statement such as “my hand shakes and I keep missing buttons” routes to calibration because the person has not specified a final interface value. A precise request such as “make the text 175%” routes directly to configure_accessibility. A diagnosis word alone should not trigger any mutating tool.

Consequential actions remain visible and human-controlled. Guide captures the appointment ID, slot ID, and reschedule revision, then re-reads all three immediately before commit. A changed human selection returns selection_changed rather than being overwritten.

## Component-Level Personalization

Each semantic component declares its supported bounded properties. The manifest resolver projects explicit accessibility settings and an approved functional profile into those regions, then applies human region overrides last.

Safe properties include minimum target size, minimum spacing, row/column/step-by-step layout, information priority, secondary-content visibility, concise/descriptive/plain-language labels, icon-shape-text statuses, enhanced focus, review protection, and separate destructive actions.

One unobtrusive **Personalize interface** control lets a person edit the same bounded component properties manually. AI is never required for access.

## Integrated Demonstration Boundary

The simulator is a supporting storytelling aid. Guide and the WebMCP-driven calibration-to-composition system are the product.

The Parkinson’s option compares the actual actionable elements under physical and displaced pointer coordinates using document.elementFromPoint(...).closest(...). Activation succeeds only when both coordinates resolve to the same element. There is no nearest-control search, retargeting, replacement click, or appointment-specific failure branch. Keyboard, touch, WebMCP, and programmatic actions bypass the pointer displacement.

Dyslexia and Concentration difficulty remain explicitly labeled illustrative and are not used as the hero. The simulator does not reproduce anyone’s disability, diagnose a condition, replace testing with disabled people, or prove accessibility compliance.

## How We Built It

- React 19, TypeScript, and Vite
- Zustand stores with deliberate portal, calibration, and simulator boundaries
- A bounded semantic adaptation manifest
- Motion with reduced-motion handling
- Direct imperative WebMCP with webmcp-types
- SpeechSynthesis as an optional, bounded page signal
- Vitest, React Testing Library, Playwright, and axe
- Vercel production deployment

## Challenges

The first challenge was rejecting the seductive but shallow idea of a “Parkinson’s mode.” The system had to start from a functional barrier, gather a person’s own interaction evidence safely, and wait for approval.

The second was creating a true component-composition system without exposing arbitrary DOM control. Every semantic region needed declared capabilities, sanitization, deterministic precedence, and the same state path for manual and agent-supported changes.

The third was handling practice locally. Agent round trips would make the loop slow and brittle, so WebMCP opens the bounded experience once and the webpage owns the responsive adjustment cycle.

The fourth was protecting human agency across the real task. Calibration cannot select a time, no appointment can be automatically confirmed, destructive actions are separated, confirmation has a review, stale instructions fail, and the person can undo.

## What We Learned

WebMCP can be more than an action API for autonomous agents. It can be a negotiation boundary: the agent understands language, the site declares what can safely change, local interaction finds an appropriate value, and the person approves the result.

The design question is no longer “which accessible template should replace the original?” It is “which semantic properties can this component safely compose, and who has final authority?” In Guide, the answer to the second question is always the person.

## What’s Next

The typed registry is ready for honest visual readability, color distinction, language, attention, and keyboard/switch calibration experiences. They are intentionally not shipped as shallow P0 demos. The pattern can extend to government services, education, banking, insurance, and other essential sites.

## Links

- Live demo: [https://guide-webmcp.vercel.app](https://guide-webmcp.vercel.app)
- Public repository: [https://github.com/ikTheProgrammer1/guide-showcase](https://github.com/ikTheProgrammer1/guide-showcase)
- Demo video: upload pending
