# Guide Demo Script — 2:35 Target

Record the deployed production URL in ChatGPT’s in-app browser at 1440×900. Start with **Reset demo**, 100% browser zoom, and the activity panel visible. Keep the source editor ready for the brief code shot.

## 0:00–0:18 — The Gap

**Screen:** The normal portal home page.

**Narration:**

“AI agents can use websites for us. But that often leaves people with two choices: follow instructions in chat, or hand everything over. Guide explores the space between them—a person and an agent sharing the same interface.”

## 0:18–0:45 — Adapt

**Prompt:**

> The text is difficult for me to read and this page feels crowded. Make it easier for me to use.

**Expected tools:** `get_portal_state`, then `configure_accessibility` with 150% or 175% text, high contrast, simplified density, large controls, and increased spacing.

**Narration:**

“With WebMCP, the page tells the agent how the interface itself can adapt. The change happens here, in the shared page, and Robert can override every setting.”

## 0:45–1:08 — Show, Don’t Take Over

**Prompt:**

> I need to move my appointment, but I don’t know where. Show me—don’t change anything yet.

**Expected tools:** `guide_to` targeting `appointments_navigation`, followed by `open_section` only if requested.

**Narration:**

“Guide has a visible presence. It can point without clicking, explain without taking control, and work with semantic targets instead of screen coordinates.”

## 1:08–1:38 — Collaborate

**Prompt:**

> Show me the available times, but let me choose.

**Expected tool:** `get_reschedule_options`.

**Screen:** Show `select_reschedule_slot` appearing in the client. Click **Monday, September 14 · 3:00 PM** manually.

**Narration:**

“Guide opens the non-committing chooser. I make the decision myself. That manual click updates the same state the agent sees, and the confirmation capability appears only when it is relevant.”

## 1:38–2:00 — Delegate

**Prompt:**

> You can finish it.

**Expected tools:** `get_portal_state`, then `confirm_reschedule` with the human-selected slot.

**Narration:**

“Now I delegate the final step. Guide shows the current and new times, visibly targets Confirm, validates that my selection has not changed, and completes the fictional workflow.”

## 2:00–2:18 — WebMCP-Native Code

**Screen:** Show `document.modelContext.registerTool`, the `guide_to` schema, and the semantic target registry.

**Narration:**

“This isn’t coordinate automation. The site exposes what its capabilities mean. A presence layer turns those semantic calls into visible attention, action previews, and shared history.”

## 2:18–2:35 — Close

**Screen:** Success view, then the activity log showing Guide and You.

**Narration:**

“WebMCP gives agents capabilities. Guide makes those capabilities visible to the person. Agents shouldn’t just use the web for us. They should be able to use it with us.”

## Recording Checklist

- Keep the final video below 3 minutes.
- Include narration audio and no copyrighted music.
- Show the actual production URL and actual discovered WebMCP tools.
- Do not imply a real healthcare integration or real appointment change.
- Upload the final video publicly to YouTube and add its link to Devpost manually.
