---
description: Analyze a draft requirement to produce a formal technical specification using the bks-requirement-analysis skill.
---

# Draft Requirement Analysis Workflow

> [!IMPORTANT]
> **Mandatory Skill Loading**: Before starting any phase or step, you MUST read the complete instructions of the applicable skill(s) listed for that phase (using the `view_file` tool on the skill's `SKILL.md` file).

Use this workflow to guide the AI in transforming vague or raw draft requirements into structured, technical specifications that are ready for implementation. This workflow enforces the methodology defined in the `bks-requirement-analysis` skill while focusing entirely on execution steps.

## 0. Load the Core Skill
> [!IMPORTANT]
> **AI INSTRUCTION:**
> 1. Before proceeding with any of the steps below, you MUST use the `view_file` tool to read the methodology defined in `/.agents/skills/bks-requirement-analysis/SKILL.md`.
> 2. **Language Consistency**: You MUST respond to the user using the same language they used to communicate with you throughout the entire workflow execution.

## 1. Execution & Analysis
1. Locate and read the target source requirement file, typically inside `docs/draft/`.
2. Apply **Phases I to IV** from the `bks-requirement-analysis` skill to deeply analyze the draft. This includes:
   - Auditing current modules and legacy logic.
   - Detecting logical gaps, silences, and contradictions.
   - Mapping out the architectural design, schema changes, enums, and state logic.

## 2. Implementation Plan Presentation
> [!IMPORTANT]
> **MANDATORY CHECKPOINT**: Before generating the final document, you MUST present an `implementation_plan.md` artifact so the user can review your proposed technical mappings.

1. Generate the implementation plan summarizing your findings. It must include proposed schemas, explicitly formulated gap reports, and step-by-step logic flows as stated in **Phase V** of the skill.
2. **STOP AND WAIT**. Do NOT proceed until the user explicitly approves or requests changes to the plan.
3. Incorporate feedback and refine the plan iteratively (max 2 rounds, as defined by the skill).

## 3. Document Generation
Once the user validates the implementation plan, generate the formal requirement document.
1. Create a new markdown file inside `docs/requirements/`.
2. You MUST strictly follow the **Mandatory File Structure** and formatting rules defined in **Section 4** of the `bks-requirement-analysis` skill.
   - Ensure the exhaustive Data Model with the Mandatory Column Table Format is used.
   - Ensure explicit State Changes are written for every processing flow.

## 4. Post-Generation Validation
This step cannot be skipped. Run validation BEFORE presenting the final document to the user.
1. Run the **Implementation-Ready Checklist** (Section 7 of the skill) against your generated document.
2. Validate column-by-column completeness, enum transitions, explicit state changes, error cases, and cross-requirement consistency.
3. If any item fails the checklist, fix the document internally. Once it is fully compliant, present it to the user.
