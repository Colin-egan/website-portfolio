# Three-way project stage in the client portal

**Date:** 2026-07-27
**Status:** Approved, ready for implementation plan

## Problem

Mission Properties' public site already renders three project buckets:

- `/current-projects` splits `status='current'` rows into **Under Construction** and **In the Pipeline**, filtering on a `phase` column.
- `/completed-projects` renders `status='completed'`.

The portal exposes only a two-way toggle (`Mark as Completed` / `Mark as Current`) that writes `status`. Nothing in the portal ever writes `phase`.

Consequence, confirmed against the database (`vfjrqzdkctkhadcmyfpi`):

| client | status | phase | rows |
|---|---|---|---|
| Mission Properties | current | `null` | 8 |
| Mission Properties | completed | `null` | 24 |
| Mission Properties | completed | `in_pipeline` | 2 |
| Mission Properties | completed | `under_construction` | 2 |

All 8 current projects have `phase = null`. The site's fallback (`row.phase === "in_pipeline" ? "in_pipeline" : "under_construction"`) maps them to Under Construction, so **the "In the Pipeline" section on the live site is empty and the client has no way to put anything in it**. The 4 stray phases on completed rows are migration leftovers — inert today, wrong if those rows were ever moved back to current.

## Goal

Let the client pick one of three stages per project — **In the Pipeline**, **Under Construction**, **Completed** — from the Projects tab, and have that choice drive the corresponding section of their live site.

## Decisions

1. **Label wording:** the middle stage is labelled **"Under Construction"**, matching both the stored database value and the wording already on the public site. (An earlier revision of this spec renamed it to "In Construction"; that was reverted, so the client site needs no label change at all.)
2. **Backfill:** existing `current` rows with `phase IS NULL` are set to `under_construction`, making the site's implicit fallback explicit. Stray `phase` values on `completed` rows are cleared.

## Data model

Keep the existing two columns and derive a single three-way *stage* in the portal UI.

| Portal stage | `status` | `phase` |
|---|---|---|
| In the Pipeline | `current` | `in_pipeline` |
| Under Construction | `current` | `under_construction` |
| Completed | `completed` | `null` |

Current schema (unchanged by this work):

- `status` — `text NOT NULL DEFAULT 'current'`, `CHECK (status IN ('current','completed'))`
- `phase` — `text NULL`, no constraint

### Rejected alternative

Collapsing `status` into a single three-value column. It requires altering the CHECK constraint, migrating 36 rows, and rewriting `getProjectsByStatus` plus both page filters in the client repo. Because the two repos are separate Vercel projects that deploy independently, an out-of-order deploy would break the live site. The existing split already maps cleanly onto three states.

## Component design

### `lib/portal/projectActions.ts`

- Add `export type ProjectPhase = "under_construction" | "in_pipeline"`.
- Add `phase: ProjectPhase | null` to the `Project` type. `listProjects` selects `*`, so no query change.
- Add `export type ProjectStage = "pipeline" | "construction" | "completed"`.
- Add two pure helpers, the only place the mapping lives:
  - `stageOf(project: Pick<Project, "status" | "phase">): ProjectStage`
  - `columnsForStage(stage: ProjectStage): { status: ProjectStatus; phase: ProjectPhase | null }`
- Replace `setProjectStatusAction(id, status)` with `setProjectStageAction(id, formData)`, bound as `.bind(null, project.id)`. It reads `stage` from `formData`, **validates it is one of the three literals**, and rejects otherwise — this is untrusted input. It writes both `status` and `phase` in one update, scoped by `client_id` from the session as every other action is.
- `upsertProjectAction`: **stage is only written on insert.** The update branch omits `status` and `phase` from its payload entirely, leaving `setProjectStageAction` as the single owner of stage for existing rows. This avoids the clobber bug that would otherwise appear once the hidden `status` input is removed from the edit form (an edit would silently reset a completed project to current).

### `components/portal/ProjectsPanel.tsx`

- **`StagePicker`** — a segmented three-way control rendered as radio inputs named `stage`. Used in two modes:
  - *Existing row:* inside its own `<form action={setProjectStageAction.bind(null, project.id)}>`, auto-submitting on change via `e.currentTarget.form?.requestSubmit()`. Preserves today's instant-save feel and replaces the `Mark as ...` button.
  - *New project form:* plain radio inputs inside `ProjectForm`, defaulting to **Under Construction**, read by `upsertProjectAction`'s insert branch.
- **`StatusBadge` → `StageBadge`** — three states instead of two. Construction keeps the existing amber, completed keeps the existing purple, pipeline takes a third colour.
- **`ProjectForm`** — remove `<input type="hidden" name="status" ...>`. Render `StagePicker` only when creating (`!project`); for existing projects the row-level picker owns it.
- Panel description copy: "…move them between Current and Completed" → wording covering the three stages.

### Client site (`../missionproperties`, separate repo)

**No changes required.** The site already reads `phase` and already labels the section "Under Construction", so the portal writing `phase` is enough to make the existing In the Pipeline section reachable.

### Database migration

```sql
UPDATE projects SET phase = 'under_construction'
  WHERE status = 'current' AND phase IS NULL;   -- 8 rows

UPDATE projects SET phase = NULL
  WHERE status = 'completed';                   -- 4 rows
```

Scoped to the whole table deliberately: Mission Properties is currently the only client with project rows, and the invariant should hold for any future client.

## Data flow

```
client picks stage in portal
  -> setProjectStageAction (session-scoped, validates literal)
  -> projects.status + projects.phase
  -> revalidatePath("/portal")
  -> [client clicks Publish]
  -> Vercel deploy hook rebuilds missionproperties
  -> getCurrentProjects() / getCompletedProjects()
  -> /current-projects splits on phase, /completed-projects renders the rest
```

Edits are not live until Publish — unchanged from today.

## Error handling

- `setProjectStageAction` throws on missing session (matching the sibling actions) and returns without writing on an unrecognised `stage` value.
- Every query stays filtered by `client_id` from the verified session cookie, never from form input.
- Without JavaScript the radio auto-submit does not fire; the form still submits by normal means, so the control degrades rather than breaking.

## Testing

The repo has no test harness, so verification is manual:

1. `npm run build` in the portal — typecheck passes, no unused-export or missing-field errors after the `setProjectStatusAction` rename.
2. Log into `/portal`, expand a project, select each of the three stages; confirm the badge updates and the value persists across a reload.
3. Create a new project and confirm it lands in the stage picked on the form.
4. Edit an existing **completed** project's name and save; confirm it stays completed (regression test for the clobber bug).
5. Query the database to confirm `status`/`phase` pairs match the mapping table.
6. Build the client site and confirm a project moved to In the Pipeline renders under that heading.

## Sequencing

1. Database migration — safe on its own; it only makes the site's existing null fallback explicit.
2. Portal changes.
3. Client repo label change, committed and deployed **separately** — it is its own repo and its own Vercel project, so it does not ship with the portal.

The site's `phase ?? 'under_construction'` fallback means no step depends on another landing first. Net visible change to the live site is the heading wording only.

## Docs to update

`CLIENTPORTALADDITION.md` describes `status` as a two-way toggle in two places — the shared-schema table row for `projects`, and step 2 of "The client's workflow, once set up". Both need to describe the three-way stage and the `phase` column.
