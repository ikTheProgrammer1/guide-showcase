# Guide

**The web interface that adapts and guides you.**

Guide is an OpenAI WebMCP Challenge project exploring a middle ground between chat instructions and invisible automation. A person and an AI agent share the same fictional patient portal. The agent can adapt the page, point to meaningful controls, prepare a workflow, or complete a delegated step—and every action remains visible and reversible by the person.

> Agents shouldn’t just use the web for us. They should be able to use it with us.

![Guide patient portal home](./docs/screenshots/guide-home.png)

![Guide visibly adapting the shared interface](./docs/screenshots/guide-adapted.png)

## Live Demo

- Production: **deployment pending**
- Source: **repository publication pending**

The portal contains only fictional administrative data. It does not connect to healthcare providers, upload files, or provide medical or financial advice.

## Why WebMCP

Typical browser agents must infer meaning from screenshots, selectors, or coordinates. Guide instead exposes semantic application capabilities through the current imperative WebMCP API:

```ts
await document.modelContext.registerTool({
  name: 'guide_to',
  description: 'Point to a semantic interface target without activating it.',
  inputSchema: {
    type: 'object',
    properties: {
      target: { type: 'string', enum: ['appointments_navigation', 'reschedule_button'] },
    },
    required: ['target'],
    additionalProperties: false,
  },
  execute: async ({ target }, { signal }) => {
    return runGuideAction({ target, signal });
  },
});
```

The page translates a semantic target into a live DOM reference, scroll position, target outline, distinct Guide pointer, explanation, application action, and attributed activity event. There are no screen-coordinate automation tools.

## Interaction Model

| Person asks | Guide does |
|---|---|
| “I can’t read this.” | Adapts text size, contrast, density, spacing, and controls. |
| “Where do I change my appointment?” | Points to the relevant semantic control without activating it. |
| “What does that button do?” | Highlights and explains it in the shared page. |
| “Show me the options, but let me choose.” | Opens the non-committing chooser; the person selects a time. |
| “You can finish.” | Re-reads shared state, previews the consequence, and confirms visibly. |

Human interaction is authoritative. If Guide selects September 12 and the person changes it to September 14, a stale agent confirmation fails with `selection_changed` instead of overwriting the person.

## WebMCP Tools

| Tool | Lifecycle | Effect |
|---|---|---|
| `get_portal_state` | Always | Reads the visible page, accessibility settings, pending action, and recent human overrides. |
| `configure_accessibility` | Always | Visibly applies one or more functional accessibility settings. |
| `guide_to` | Always | Points, highlights, and explains without activation. |
| `open_section` | Always | Opens one of the seven semantic portal sections. |
| `get_upcoming_appointments` | Always | Reads the fictional upcoming appointment. |
| `get_reschedule_options` | Always | Opens and returns the non-committing appointment chooser. |
| `get_bill_details` | Always | Returns the fictional provider, insurance, and patient portions. |
| `get_insurance_status` | Always | Returns the fictional active insurance card. |
| `open_insurance_update` | Always | Opens a simulated update flow with no real upload. |
| `select_reschedule_slot` | Chooser open | Prepares a selected slot without committing. |
| `confirm_reschedule` | Slot selected | Validates and visibly commits the selected slot. |

The dynamic tools register and unregister with `AbortController`. Tool execution cancellation is passed into the visible presence sequence.

## Architecture

```text
ChatGPT / browser agent
        │ semantic WebMCP tool
        ▼
WebMCP registration layer
        │ validated application intent
        ▼
Guide presence controller ──► target registry ──► visible pointer + highlight
        │
        ▼
Shared Zustand portal store ◄── human controls
        │
        ├── portal UI
        ├── pending/review state
        └── Guide / You activity history
```

Important implementation areas:

- `src/webmcp/` — typed tool schemas, handlers, and dynamic lifecycle
- `src/presence/` — semantic target registry, serialized motion, cancellation, and speech
- `src/state/` — the single shared human/agent state machine
- `src/components/` — portal, accessibility, Guide presence, and activity UI

## Local Development

Requirements: Node.js 22+ and npm 11+.

```bash
npm install
npm run dev
```

Open `http://127.0.0.1:5173`. Ordinary browsers show an honest preview notice and retain the full manual portal. They do not claim that WebMCP registration succeeded.

## Test and Build

```bash
npm test
npm run lint
npm run build
npm run test:e2e
```

The suite covers:

- shared store transitions and deterministic Reset Demo
- human override attribution
- stale confirmation rejection
- WebMCP schemas and annotations
- dynamic tool registration
- desktop and 375 px browser workflows
- 200% text without horizontal document overflow
- axe scans with no serious or critical violations

Playwright needs its test browser once per machine:

```bash
npx playwright install chromium
```

## Testing with WebMCP

Use ChatGPT’s in-app browser, or a WebMCP-enabled Chrome version described by the challenge rules.

1. Open the production URL in the supported client.
2. Confirm the client discovers the nine always-on tools.
3. Ask: “The text is too small and this page feels crowded. Make it easier for me to use.”
4. Ask: “I need to change my appointment, but I don’t know where. Show me.”
5. Ask: “Show me the available times but let me choose.”
6. Select September 14 at 3:00 PM manually.
7. Ask: “How is the page configured now?” to verify the shared state.
8. Ask: “You can finish the appointment change.”
9. Use **Reset demo** before recording another take.

Do not use examples based on the obsolete `navigator.modelContext.provideContext()` proposal. Guide uses `document.modelContext.registerTool()` exclusively.

## Accessibility and Trust

- Text scales from 100% to 200% with responsive reflow.
- High contrast, simplified content, large controls, increased spacing, and interaction emphasis are independently adjustable.
- Optional SpeechSynthesis reads Guide messages; it is off by default and cancelled on reset.
- Motion respects `prefers-reduced-motion`.
- The Guide indicator never imitates the system pointer and combines shape, label, target outline, and text.
- Rescheduling always shows current and proposed times before an explicit human or agent confirmation.

This project demonstrates accessibility transformations informed by WCAG principles, but it does not claim WCAG certification.

## Privacy Boundary

Guide is a frontend-only demonstration. State lasts for the browser session and resets on reload. It has no backend, analytics, authentication, medical integrations, payment processing, or persistent storage.

## License

[MIT](./LICENSE) © 2026 Nicolas Matta
