# Guide Demo Script — 2:55 Target

Record the queryless production URL in ChatGPT’s built-in browser at 1440 × 900 and 100% browser zoom. Start with **Reset demo**. Keep Site Tools activity visible when practical.

## 0:00–0:16 — One Interface for Everyone

**Screen:** Hold on the dense Northstar portal: compact navigation, small appointment controls, abbreviations, competing panels, and color-led statuses.

**Narration:**

“Most websites still give everyone one fixed interface. Essential services often look like this.”

## 0:16–0:38 — An Honest Demonstration

**Screen:** Open **Simulate a barrier → Mobility → Parkinson’s**. Aim at compact **MODIFY APPT** during the seeded phase. The displaced cursor lands outside the button and **Missed target** appears.

**Narration:**

“This simulator illustrates one pointer-precision barrier; it does not reproduce anyone’s disability. The miss comes from the elements under the real and displaced coordinates. It is not hard-coded for this button.”

## 0:38–0:58 — One Semantic WebMCP Call

**Prompt:**

> My hand shakes and I keep missing buttons. Help me use this page.

**Expected tool call:** start_interface_calibration with domain pointer_precision and goal reschedule_appointment.

**Screen:** Show the tool activity, then the safe calibration. The tool returns immediately.

**Narration:**

“The phrase identifies a calibration family, not a diagnosis or a preset. ChatGPT calls one bounded WebMCP tool. The repeated practice loop stays local, so every adjustment is immediate.”

## 0:58–1:28 — Calibrate Locally

**Screen:** Try the safe practice appointment button. Show an honest simulator-driven miss, then repeat successful attempts as the target grows. In the spacing step, demonstrate one miss or choose **Farther apart**, then complete the successful attempts.

**Narration:**

“This button cannot navigate or change an appointment. Northstar keeps only non-identifying aggregates—never raw coordinates—and changes one variable at a time: size first, then spacing.”

## 1:28–1:48 — Human Approval, Component Composition

**Screen:** On **Does this feel comfortable?**, briefly show Larger/Smaller and Closer/Farther controls. Optionally select **Remember these preferences on Northstar**, then approve.

**Narration:**

“Nothing applies until I approve it. Northstar stores functional preferences, not Parkinson’s, simulator state, or miss history. Each semantic region composes only the properties it safely supports.”

**Screen:** The real rescheduling chooser opens locally. Hold on its large separated options and the unchanged current appointment.

## 1:48–2:08 — Human Choice

**Screen:** Select **Monday, September 14 · 3:00 PM** manually. Show the separate current-versus-new review. Point out **Back to times**.

**Narration:**

“Calibration continues into the real task, but stops before the decision. I choose the time. The appointment still cannot change without explicit confirmation.”

## 2:08–2:31 — Delegated Completion

**Prompt:**

> That works. Finish it.

**Expected tools:** get_portal_state, then confirm_reschedule for the currently selected slot.

**Screen:** Guide moves to Confirm, previews the before-and-after time, commits, and shows success. Site Tools activity shows confirm_reschedule disappearing immediately.

**Narration:**

“Only after I delegate does Guide re-read the appointment, selected slot, and workflow revision. A stale instruction is rejected instead of overwriting my choice.”

## 2:31–2:42 — Undo

**Screen:** Choose **Undo change**. Show the original September 10 appointment restored, then Done.

**Narration:**

“The person keeps the last word. Consequential changes have review, Back, and Undo.”

## 2:42–2:55 — Close

**Screen:** Briefly show the bounded manifest, the start_interface_calibration schema, and the separate simulation store. Return to personalized Northstar and stop the simulation.

**Narration:**

“Guide is not arbitrary DOM automation and it is not a disability template. It is a site-supported negotiation between a person, an agent, and one semantic interface.”

## Recording Checklist

- Keep the final video under three minutes.
- Show the production URL and tools actually discovered by the supported client.
- Use the exact vague functional-needs prompt and verify it selects start_interface_calibration, not configure_accessibility.
- Separately demonstrate that “make the text 175%” still selects configure_accessibility.
- Show only one WebMCP calibration call; all practice attempts happen locally.
- Keep the Parkinson’s simulator active through practice and the real appointment selection.
- Show a genuine miss from DOM hit testing and no nearest-control retargeting.
- Show explicit comfort approval, no preselected time, one manual time choice, delegated confirmation, and Undo.
- State that remembered preferences are optional, local, bounded, and diagnosis-free.
- Keep Dyslexia and Concentration difficulty out of the hero.
- Do not imply a real healthcare integration, disability reproduction, diagnosis, disabled-user testing, or accessibility certification.
- Upload the video publicly and add the link to Devpost manually.
