# Guide — Devpost Submission Draft

## Tagline

The web interface that adapts and guides you.

## Inspiration

Most websites assume people can read dense layouts, distinguish small controls, understand unfamiliar navigation, and recognize which actions have consequences. AI currently offers two imperfect answers: instructions that the person must translate back onto the page, or autonomous execution that hides what happened.

Guide explores a third interaction model: the person and agent share the webpage. The agent can adapt it, point to something, explain it, prepare a workflow, or complete a delegated action—while the page visibly communicates every step.

## What It Does

Guide is a completely fictional patient portal for Robert. It demonstrates administrative navigation only.

- Adapts text size, contrast, content density, control size, spacing, and emphasis.
- Uses a distinct animated Guide presence to point at semantic interface targets.
- Opens and explains appointments, billing, and insurance information.
- Lets the agent prepare a reschedule while Robert chooses the time manually.
- Lets Robert delegate final confirmation after seeing the current and proposed appointment.
- Keeps human input authoritative and reports overrides back to the agent.
- Records a transparent “Guide” versus “You” activity history.

## How We Used WebMCP

The portal registers semantic JavaScript tools with `document.modelContext.registerTool()`. Tools expose application meaning—such as `configure_accessibility`, `guide_to`, `get_reschedule_options`, and `confirm_reschedule`—instead of generic clicks, selectors, or screen coordinates.

Every consequential tool routes through an Agent Presence Layer:

1. Resolve a semantic target to a live DOM element.
2. Scroll it into view.
3. Move and display the Guide pointer.
4. Highlight and explain the target.
5. Preview or execute the application action.
6. Update the same Zustand store used by the human UI.
7. Attribute the result in shared activity history.

The rescheduling tools are dynamic. Selection becomes available only while the chooser is open, and confirmation becomes available only after a valid selection. Abort signals manage tool lifecycle and execution cancellation.

## How We Built It

- React 19, TypeScript, and Vite
- Zustand shared state machine
- Motion for visible Guide sequences
- Direct imperative WebMCP API with `webmcp-types`
- CSS Modules with responsive 200% text reflow
- Vitest, React Testing Library, Playwright, and axe
- Vercel deployment

## Challenges

The hardest problem was making agent action and human control coexist without races. Every manual mutation increments an interaction version. Agent actions capture that version, animate visibly, then validate it again before committing. A stale confirmation returns `selection_changed` rather than overwriting the person.

The second challenge was making a moving semantic pointer reliable across responsive layouts, enlarged text, scrolling, and modal state. Guide stores semantic IDs—not coordinates—and recalculates the active DOM target as layout changes.

## What We Learned

WebMCP is most interesting when it is not treated as an invisible API wrapper. Semantic capabilities can become a visual interaction language: attention, explanation, preparation, delegation, and override all happen in the same surface.

## What’s Next

This pattern could extend to government services, insurance, banking, education, travel, e-commerce, and enterprise software—anywhere a complex interface would benefit from an agent that can work with a person instead of only for them.

## Links

- Live demo: deployment pending
- Public repository: publication pending
- Demo video: upload pending
