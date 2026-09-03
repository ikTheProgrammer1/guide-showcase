# Guide Demo Script — 2:50 Target

Record the production URL in ChatGPT’s in-app browser at 1440 × 900 and 100% browser zoom. Start with **Reset Demo**. Keep the source editor ready for one brief code shot.

## 0:00–0:15 — One Interface for Everyone

**Screen:** Hold on the dense Northstar Health portal. Let the crowded tables, compact navigation, abbreviations, small controls, and red/green status dots register.

**Narration:**

“Most websites still present one fixed interface to everyone. And many essential services look like this.”

## 0:15–0:40 — Demonstrate the Barrier

**Screen:** Open **Simulate a barrier → Mobility → Parkinson’s**. Aim at the center of the compact **MODIFY APPT** control during the seeded demonstration phase. The displaced simulated cursor lands outside the button, the action does not fire, and **Missed target** appears.

**Narration:**

“This built-in simulator demonstrates one pointer-precision barrier. It does not reproduce anyone’s disability. The miss is real DOM hit testing—not a scripted failure for this button.”

## 0:40–1:12 — Adapt and Point

**Prompt:**

> My hands shake, precise clicking is difficult, and this page is overwhelming. Reorganize it with large separated controls and show me where to reschedule, but do not open it yet.

**Expected tools:** `get_portal_state` if needed, one composed `configure_accessibility` call with simplified density, large controls, increased spacing, and interactive emphasis, then `guide_to(reschedule_button)`. No appointment action yet.

**Screen:** Keep the simulation active. The same Northstar application reorganizes into the calm modern interface. Guide ✦ points to the new large appointment control without activating it.

**Narration:**

“Northstar exposes not only actions through WebMCP, but semantic ways its own interface can adapt. This is a structural reflow—not a zoomed screenshot.”

## 1:12–1:28 — Successful Acquisition

**Screen:** Aim at the center of the larger adapted **Change appointment** control with the same simulation phase. Both physical and displaced coordinates resolve to that control, so it opens Appointments successfully. Choose **Reschedule appointment**.

**Narration:**

“Nothing in the simulator changed. The same generic algorithm succeeds because Northstar created a materially larger target with more separation.”

## 1:28–1:58 — Guide & Collaborate

**Screen:** Open the chooser if it is not already open. It shows the current appointment and three alternatives. Manually choose **Monday, September 14 · 3:00 PM**; `confirm_reschedule` appears only after the valid selection.

**Narration:**

“Guide prepared the path, but I make the decision. My click updates the exact same state the agent sees.”

## 1:58–2:22 — Delegated Act

**Prompt:**

> That works. Finish it.

**Expected tools:** `get_portal_state`, then `confirm_reschedule` with the human-selected slot.

**Screen:** Guide moves to Confirm, shows the before-and-after time, pauses, and commits. `confirm_reschedule` unregisters immediately. Hold on success, then stop the simulation.

**Narration:**

“When I delegate the last step, Guide re-reads my choice and refuses stale instructions. The action stays visible and attributable.”

## 2:22–2:38 — WebMCP-Native

**Screen:** Briefly show `document.modelContext.registerTool()`, the `configure_accessibility` schema, the semantic target registry, and the separate simulation store.

**Narration:**

“This is not screen-coordinate automation. ChatGPT is the language layer, and Northstar owns semantic capabilities and visible presence. The simulator is human-only and never appears in WebMCP state.”

## 2:38–2:50 — Close

**Screen:** Adapted Northstar and the Guide success state, with the simulator off.

**Narration:**

“What if websites didn’t have one interface for everyone? Guide lets agents reshape the web around people—and stay beside them when they need help. Agents shouldn’t just use the web for us. They should be able to use it with us.”

## Recording Checklist

- Keep the finished video under 3 minutes.
- Show the production URL and tools actually discovered by the client.
- Keep the full legacy-to-adapted transition in one uninterrupted shot.
- Use functional-needs language, not diagnosis presets or medical claims.
- Explicitly call the simulator illustrative, keep Dyslexia and Concentration difficulty out of the hero, and do not imply disability reproduction or compliance proof.
- Show that the first miss and second success come from actual coordinate hit testing, with no target-specific failure or nearest-control retargeting.
- Show one human slot selection and one delegated confirmation.
- Do not imply a real healthcare integration or appointment change.
- Upload the final video publicly and add its link to Devpost manually.
