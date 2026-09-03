# Guide Demo Script — 2:40 Target

Record the production URL in ChatGPT’s in-app browser at 1440 × 900 and 100% browser zoom. Start with **Reset Demo**. Keep the source editor ready for one brief code shot.

## 0:00–0:12 — One Interface for Everyone

**Screen:** Hold on the dense Northstar Health portal. Let the crowded tables, compact navigation, abbreviations, small controls, and red/green status dots register.

**Narration:**

“Most websites still present one fixed interface to everyone. And many essential services look like this.”

## 0:12–0:38 — Adapt

**Prompt:**

> I have trouble distinguishing red and green, the text is difficult to read, and this page feels overwhelming. Can you make it easier for me?

**Expected tools:** `get_portal_state`, then one `configure_accessibility` call with 175% text, high contrast, simplified density, large controls, increased spacing, color-independent status, and emphasized interactions.

**Screen:** The same Northstar application reorganizes into the calm modern interface. Guide ✦ appears after the transformation.

**Narration:**

“Northstar exposes not only actions through WebMCP, but semantic ways its own interface can adapt. This is a structural reflow—not a zoomed screenshot.”

## 0:38–1:00 — Show

**Prompt:**

> I need to change my appointment, but I don’t know how. Show me—don’t change anything yet.

**Expected tool:** `guide_to` targeting `appointments_navigation` or `reschedule_button`.

**Screen:** Guide flies to the control, highlights it, and says, “Your appointment can be changed here.” Nothing activates.

**Narration:**

“Guide can direct attention without taking control. Its target is semantic, so it survives the layout transformation.”

## 1:00–1:18 — Explain

**Prompt:**

> What does that do?

**Expected tool:** `guide_to` with a short explanation.

**Narration:**

“The agent explains in the shared page instead of making me translate chat instructions back onto the interface.”

## 1:18–1:52 — Guide & Collaborate

**Prompt:**

> Help me reschedule it, but let me choose the time.

**Expected tools:** `get_reschedule_options`, then `open_reschedule`.

**Screen:** The chooser shows the current appointment and three alternatives. `select_reschedule_slot` becomes available. Manually choose **Monday, September 14 · 3:00 PM**.

**Narration:**

“Guide prepares the workflow, but I make the decision. My click updates the exact same state the agent sees.”

## 1:52–2:14 — Act

**Prompt:**

> That works. Finish it.

**Expected tools:** `get_portal_state`, then `confirm_reschedule` with the human-selected slot.

**Screen:** Guide moves to Confirm, shows the before-and-after time, pauses, and commits. Hold on the success state.

**Narration:**

“When I delegate the last step, Guide re-reads my choice and refuses stale instructions. The action stays visible and attributable.”

## 2:14–2:29 — WebMCP-Native

**Screen:** Briefly show `document.modelContext.registerTool()`, the `configure_accessibility` schema, and the semantic target registry.

**Narration:**

“This is not screen-coordinate automation. ChatGPT is the client and language layer. Northstar owns semantic capabilities, adaptation, and visible presence.”

## 2:29–2:40 — Close

**Screen:** Adapted Northstar and the Guide success state.

**Narration:**

“What if websites didn’t have one interface for everyone? Guide lets agents reshape the web around people—and stay beside them when they need help. Agents shouldn’t just use the web for us. They should be able to use it with us.”

## Recording Checklist

- Keep the finished video under 3 minutes.
- Show the production URL and tools actually discovered by the client.
- Keep the full legacy-to-adapted transition in one uninterrupted shot.
- Use functional-needs language, not diagnosis presets or medical claims.
- Show one human slot selection and one delegated confirmation.
- Do not imply a real healthcare integration or appointment change.
- Upload the final video publicly and add its link to Devpost manually.
