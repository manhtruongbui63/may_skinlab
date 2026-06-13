---
description: Break down a formal requirement specification into granular implementation tasks
---

# Decompose Requirement to Tasks Workflow

> [!IMPORTANT]
> **Mandatory Skill Loading**: Before starting any phase or step, you MUST read the complete instructions of the applicable skill(s) listed for that phase (using the `view_file` tool on the skill's `SKILL.md` file).

Implementation process converting overarching formal documentation into sequential executable task clusters residing inside `docs/tasks/`.

## Step 1: Ingest Strategy Knowledge
> [!NOTE]
> **Applicable Skills for this Step:** 
> - `bks-requirement-to-tasks`

1. Read the methodology and chunking specifications explicitly detailing task extraction constraints. Do not proceed until internalizing these rules.

## Step 2: Identify Source Material
1. Prompt and request the target document from the user natively rooted under `docs/requirements/`. 
2. If identifying elements correlate to drafted concepts inside `docs/draft/`, halt process and trigger guidance mapping referencing `/pm-analyze-draft-req.md`.

## Step 3: Application Scope Map
1. Uncover execution gaps parsing all explicitly declared rules, actions, notifications, and logic bindings into distinct boundaries.
2. Conduct programmatic codebase exploration noting affected models, logic dependencies, and legacy logic interfaces.

## Step 4: Categorize Dependencies & Group Logic
1. Map internal logic blocks assigning granular identifiers utilizing classes: `IMPLEMENTATION`, `COORDINATION`, or `DOCUMENTATION`.
2. Scope estimation metrics utilizing generic (S/M/L) limits across tasks. Merge checklist constraints conforming to complexity logic arrays.
3. Draw operational boundary dependencies through generated Mermaid graphic trees illustrating pipeline execution.

## Step 5: Plan Alignment Presentation
1. Submit an overarching proposal mapped to internal sub-categories presenting specific task clusters alongside assigned effort ratings.
2. Clearly identify specific downstream **workflows** mapped alongside executing **skills** that subagent loops should engage during respective action paths.
3. Initiate explicit user-wait blocks tracking any overriding feedback modifications. Provide iterative tweaks bounded within 2 update cycle limits.

## Step 6: Artifact Creation Loop
> [!NOTE]
> **Applicable Skills for this Step:** 
> - `bks-requirement-to-tasks`

1. Physically allocate sub-directories across the internal `/docs/tasks/` hierarchy mirroring target names.
2. Write granular task tracking markdown endpoints complying heavily with formatted checklist restrictions and required metadata elements. Embed specific workflow guides into each executing block.
3. Establish index maps visualizing holistic task arrays and completion blocks.

## Step 7: Integrity Validation
1. Traverse mapping connections assuring no unhandled requirement components bypassed assignment mapping.
2. Validate loop execution mapping through coordination logic assuring nested sub-tasks recognize their parent elements. Check for logical circular redundancy constraints before finalizing.
