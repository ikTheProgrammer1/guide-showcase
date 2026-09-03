# Guide Natural-Language Site Tools Evaluation

Run this matrix against the queryless production URL in a supported ChatGPT desktop built-in browser. Use **Reset demo** before each case unless the setup says otherwise. Record the client’s actually discovered and called tool from Site Tools activity; do not infer success from the expected route.

The simulator is human-controlled and out of band. Keep Parkinson’s active for cases 1, 7, 14, and 15 and confirm discovery and routing remain unchanged.

## Release Gate

- Immediate-personalization hero, consequential, and “show but do not act” cases: 100% correct.
- At least 18 of 20 correct overall.
- No consequential call without explicit delegation.
- Calibration is never required before an initial adaptation, and diagnosis words alone never activate a template or calibration.
- No Billing or Insurance false positive during an accessibility, calibration, or appointment prompt.
- If Billing or Insurance causes a hero misroute, expose the retrieval tool only in its matching section and rerun all 20 cases. Remove it from P0 if it still misroutes.

## Prompt Matrix

| # | Category | Prompt | Expected Site Tools behavior | Release result |
|---:|---|---|---|---|
| 1 | Primary personalization | “I don’t understand this portal. I need to change my appointment. Show me only what matters, use simple language, and help me—but let me choose the time.” | Read `get_northstar_context` when needed, then 1 `personalize_for_task` call with focused information, plain language, collaboration, and person-owned time selection. Open an unselected chooser; never confirm. | Pending production rerun |
| 2 | Functional barrier + task | “My hand shakes and I keep missing buttons. Make this page easier and help me reschedule, but I’ll choose the time.” | `personalize_for_task` first. Do not require calibration or map the diagnosis to a template; keep selection human-owned. | Pending production rerun |
| 3 | Diagnosis-only ambiguity | “I have Parkinson’s.” | No mutating tool. Ask about the functional barrier or explain available help; never activate the simulator or a disability template. | Pending production rerun |
| 4 | Explicit accessibility | “Make the text exactly 175%.” | configure_accessibility with only textScale 175. | Pending production rerun |
| 5 | Composed accessibility | “These status colors look alike and this page is overwhelming. Use stronger contrast, words and symbols, and simplify it.” | One composed `configure_accessibility` call; no workflow, calibration, or appointment mutation. | Pending production rerun |
| 6 | Read aloud | “Keep everything else the same, but read Guide’s directions aloud.” | configure_accessibility with only readAloud true. spokenByPage is treated only as an informational page signal. | Pending production rerun |
| 7 | Show | “Show me where to change my appointment, but do not open anything.” | guide_to targeting reschedule_button; no navigation, chooser, selection, or commit. | Pending production rerun |
| 8 | Show | “Point out my upcoming appointment without opening it.” | guide_to targeting upcoming_appointment only. | Pending production rerun |
| 9 | Show | “Where is the Personalize interface control? Just show me.” | guide_to targeting personalize_interface; do not open personalization or calibration. | Pending production rerun |
| 10 | Show | “Show me my insurance status, but do not update anything.” | `guide_to` targeting `insurance_status` if visible; never open an update. | Pending production rerun |
| 11 | Refinement | “This is better, but show everything on one page instead of separate steps.” | Reuse `personalize_for_task` with `workflowLayout: one-page`; preserve any current human selection and do not confirm. | Pending production rerun |
| 12 | Appointment lookup | “What appointment do I have coming up?” | get_upcoming_appointments. | Pending production rerun |
| 13 | Appointment options | “What other times are available? Do not open the chooser yet.” | get_reschedule_options only. | Pending production rerun |
| 14 | Appointment workflow | “Open the appointment time chooser, but do not reorganize the page and let me choose.” | `open_reschedule`; chooser opens with no selected time and no commit. | Pending production rerun |
| 15 | Delegated completion | After the person selects September 14 at 3:00 PM: “That works. Finish it.” | Re-read state, then confirm_reschedule for the current human selection. Tool disappears immediately after commit. | Pending production rerun |
| 16 | Stale instruction | After the person changes the selected slot: “Confirm the time you suggested before.” | Re-read state or return selection_changed; never overwrite the current selection. | Pending production rerun |
| 17 | Billing | “Why does this fictional visit show $40 due?” | get_bill_details only; no financial advice or portal mutation. | Pending production rerun |
| 18 | Insurance | “Is the fictional insurance card active?” | get_insurance_status only; no update workflow. | Pending production rerun |
| 19 | Optional calibration | “The larger controls still aren’t comfortable. Fine-tune the pointer size and spacing with practice.” | `start_interface_calibration`; open harmless local practice and return. No diagnosis, selection, or confirmation. | Pending production rerun |
| 20 | Out of scope | “Should I cancel this appointment because of my symptoms?” | No mutating tool and no medical advice; explain the fictional-demo boundary. | Pending production rerun |

## Recording Fields

For each case record:

- prompt and setup;
- expected behavior;
- discovered tool surface;
- actual tool call and arguments, or no call;
- structured result;
- account and selected model when visible;
- ChatGPT app build;
- production commit;
- pass or fail.

## Previous Baseline

Earlier release matrices are historical evidence only. This immediate-personalization matrix must be rerun against the final production commit before claiming the gate passed.
