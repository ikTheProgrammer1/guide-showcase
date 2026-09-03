# Guide Demo Script — 2:45 Target

Record the queryless production URL in ChatGPT’s built-in browser at 1440 × 900 and 100% browser zoom. Start with **Reset demo** and keep Site Tools activity visible when practical.

## 0:00–0:20 — One Fixed Interface

**Screen:** Hold on dense Northstar: compact navigation, small abbreviated actions, administrative language, competing panels, and color-led status.

**Narration:**

“Websites usually force every person through the same fixed interface. Essential services can be functional and still be difficult to understand or operate.”

## 0:20–0:42 — Describe the Need

**Prompt:**

> I don’t understand this portal. I need to change my appointment. Show me only what matters, use simple language, and help me—but let me choose the time.

**Expected discovery:** `get_northstar_context`, then 1 `personalize_for_task` call with the rescheduling goal, focused information, plain language, collaboration, and person-owned time selection.

**Narration:**

“Northstar tells my chosen agent what goals it supports, what each workflow accomplishes, which steps are possible or blocked, which decisions belong to me, and which actions have consequences.”

## 0:42–1:08 — The Website Reshapes Itself

**Screen:** Show the same page become the modern focused rescheduling experience immediately. Hold on the change explanation, larger separated controls, current appointment, and unselected times.

**Narration:**

“With one bounded WebMCP request, the website—not the agent—recomposes its own semantic components. Rescheduling is prominent, labels are plain, unrelated sections stay discoverable, and controls are easier to operate. Nothing was reloaded, injected, selected, or confirmed.”

## 1:08–1:28 — Refine the Interface

**Prompt:**

> This is better, but show everything on one page instead of separate steps.

**Expected tool:** `personalize_for_task` with `workflowLayout: "one-page"`.

**Screen:** The existing time choices and review components rearrange. Optionally open **Personalize interface** briefly to show the same bounded region controls are available without AI.

**Narration:**

“Personalization is not a universal simple mode. The person can refine individual regions, or return to the original presentation. Their latest explicit choice wins.”

## 1:28–1:48 — Human Choice

**Screen:** Select **Monday, September 14 · 3:00 PM** manually. Show the current-versus-new review and **Back to times**.

**Narration:**

“I asked to choose the time, so the agent-side selection tool is blocked. My manual choice enters the same shared state and is attributed to me.”

## 1:48–2:13 — Delegated Completion

**Prompt:**

> That works. Finish it.

**Expected tools:** `get_portal_state`, then the dynamically available `confirm_reschedule` for the current human selection.

**Screen:** Guide previews the old and new appointment, confirms, and shows success. Site Tools activity shows `confirm_reschedule` disappearing immediately.

**Narration:**

“Only after explicit delegation does Guide re-read the appointment, slot, and workflow revision. A stale instruction fails instead of overwriting me. The result remains reversible.”

## 2:13–2:26 — Undo & Manual Control

**Screen:** Choose **Undo change**. Show the original September 10 time restored. Briefly point out **Stop Guide**, **Return to original presentation**, **Personalize interface**, and **Reset demo**.

**Narration:**

“The person keeps the last word: Back, Stop, manual controls, the original view, Undo, and a full deterministic Reset remain available.”

## 2:26–2:45 — Optional Fine-Tuning & Close

**Screen:** Briefly show **Calibrate pointer precision** and its harmless **Practice appointment** target. Do not complete it in the primary flow.

**Narration:**

“Calibration is optional fine-tuning, never a test or a diagnosis. Raw pointer coordinates stay local and are not stored. Guide’s thesis is broader: the agent does not merely operate a website—it helps the website become the interface this person needs, then uses it with them.”

## Recording Checklist

- Show the queryless production URL starting in the dense legacy portal.
- Verify the client discovers current production tools instead of assuming readiness.
- Use the exact primary prompt and 1 `personalize_for_task` call.
- Show a structural change, not only text zoom or contrast.
- Show the chooser with no selected time.
- Show the person-owned selection guard, manual time choice, fresh-state confirmation, tool removal, and Undo.
- Demonstrate the one-page refinement without losing the selection.
- Keep required information discoverable and confirmation explicit.
- Describe calibration and the simulator only as optional, separate demonstration aids.
- Do not imply a real healthcare integration, disability reproduction, diagnosis, disabled-user testing, or accessibility certification.
- Upload the video publicly and add the link to Devpost manually.
