# Guide — Devpost Submission Draft

## Tagline

What if websites did not have one interface for everyone?

## Inspiration

Essential websites often force the same inherited interface on every person: tiny text, dense tables, weak hierarchy, unfamiliar abbreviations, and status colors that assume everyone sees them the same way. Accessibility is commonly treated as a fixed overlay or a set of diagnosis presets. AI offers instructions in a separate chat or completes work invisibly.

Guide explores another model. A website can expose semantic ways to adapt itself around a person’s functional needs, then let an agent remain visibly present to show, explain, guide, collaborate, and act.

## What It Does

The demonstration begins inside **Northstar Health**, a fictional institutional patient portal that feels familiar for the wrong reasons. It is dense and dated, but plausible and usable. A human-controlled illustrative simulator can make one isolated interaction barrier visible while Guide adapts the same page.

In the primary story, the Parkinson’s pointer-precision demonstration produces an honest miss on a compact legacy control. The person explains that precise clicking is difficult and the page is overwhelming. ChatGPT calls Northstar’s `configure_accessibility` WebMCP capability. The same website visibly transforms: content is reprioritized, secondary information is reduced, spacing opens, and controls enlarge. With the simulator still active, the larger control succeeds under the same hit-testing algorithm.

Guide ✦ then appears as the agent’s presence inside Northstar. It can point without clicking, explain without taking over, open a rescheduling workflow, observe a time the person selected manually, and complete the final confirmation only after the person delegates it.

The complete continuum is:

**Adapt → Show → Explain → Guide → Collaborate → Act**

Manual accessibility preferences remain available under Settings. There are no diagnosis modes, because people with the same condition can have different functional needs.

The simulator is not the accessibility solution and is never exposed through WebMCP. It does not accurately reproduce a disability, replace disabled-user research, diagnose a condition, or prove accessibility compliance. Guide and the site-supported WebMCP adaptation are the product.

## How We Used WebMCP

Northstar registers typed semantic tools with the secure-context `document.modelContext.registerTool()` API. ChatGPT supplies language understanding and voice input; the website owns its adaptation system, Guide cursor, semantic targets, and shared application state.

The tools expose meaning—`configure_accessibility`, `guide_to`, `open_reschedule`, and `confirm_reschedule`—instead of arbitrary selectors, screen coordinates, or mouse commands. Targets such as `appointments_navigation` and `reschedule_button` remain stable while their visual DOM positions change dramatically.

Consequential handlers route through the Guide presence controller:

1. Resolve a stable semantic target to its current DOM element.
2. Recalculate its position after layout or viewport changes.
3. Move the distinct Guide pointer and explain the step.
4. Preview consequences before committing.
5. Re-read shared state so human input remains authoritative.
6. Attribute mutations to “Guide” or “You.”

`select_reschedule_slot` is statically discoverable but returns `chooser_closed` before the workflow opens. A valid selection dynamically registers `confirm_reschedule`, which unregisters immediately after a commit. Human interaction invalidates an obsolete in-progress agent sequence. A stale confirmation returns `selection_changed` rather than overwriting the person.

## How We Built It

- React 19, TypeScript, and Vite
- Zustand shared state machine
- Motion for coordinated transformation and Guide presence
- Direct imperative WebMCP API with `webmcp-types`
- Separate session-only simulator store with deterministic CSS/SVG effects and real DOM coordinate hit testing
- CSS Modules and bundled OFL fonts
- Vitest, React Testing Library, Playwright, and axe
- Vercel production deployment

## Challenges

The first challenge was making the before state look honestly institutional without making it inaccessible on purpose. Northstar uses semantic HTML, keyboard-operable controls, responsive overflow, and honest status text even while recreating the visual density and hierarchy of inherited enterprise software.

The second challenge was making adaptation structural. The modern state is not a theme painted over the same dashboard: information hierarchy, navigation, status representation, content density, card structure, typography, and control sizing all change while semantic target IDs remain stable.

The third challenge was protecting human agency during visible asynchronous actions. Guide separates UI, navigation, and reschedule revisions, then re-reads the appointment, selected slot, and reschedule revision immediately before committing. Accessibility reflow can reposition the pointer without invalidating a valid choice, while stale selection instructions are rejected.

The fourth challenge was making a pointer-precision demonstration honest. The motor simulation compares `document.elementFromPoint()` results at the physical and displaced coordinates, permits activation only when both resolve to the same actionable element, and never searches for or redirects to a nearby control. The code contains no appointment-specific failure branch.

## What We Learned

WebMCP can be more than an API surface for autonomous agents. It can become a negotiation layer between a person, an agent, and an interface. The page knows what it can safely change; the agent understands the person’s request; and the person stays inside the shared result.

## What’s Next

The pattern can extend beyond healthcare to government services, insurance, education, banking, and enterprise software. The long-term question is not which single accessible interface should replace every existing interface. It is how websites can safely expose semantic adaptation so interfaces can respond to people.

## Links

- Live demo: [https://guide-webmcp.vercel.app](https://guide-webmcp.vercel.app)
- Public repository: [https://github.com/ikTheProgrammer1/guide-showcase](https://github.com/ikTheProgrammer1/guide-showcase)
- Demo video: upload pending
