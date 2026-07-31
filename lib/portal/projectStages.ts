/**
 * The three stages a client picks from in the Projects tab, and how they map
 * onto the two columns the client's site actually queries.
 *
 * This lives outside projectActions.ts because that file is `"use server"`,
 * which may only export async functions — constants and sync helpers have to
 * be defined somewhere the client bundle can import them directly.
 */

export type ProjectStatus = "current" | "completed";
export type ProjectPhase = "under_construction" | "in_pipeline";
export type ProjectStage = "pipeline" | "construction" | "completed";

export const STAGES = ["pipeline", "construction", "completed"] as const;

export const STAGE_LABELS: Record<ProjectStage, string> = {
  pipeline: "In the Pipeline",
  construction: "Under Construction",
  completed: "Completed",
};

/** The stage a stored row represents. */
export function stageOf(project: {
  status: ProjectStatus;
  phase: ProjectPhase | null;
}): ProjectStage {
  if (project.status === "completed") return "completed";
  return project.phase === "in_pipeline" ? "pipeline" : "construction";
}

/** The columns to write for a chosen stage. */
export function columnsForStage(stage: ProjectStage): {
  status: ProjectStatus;
  phase: ProjectPhase | null;
} {
  switch (stage) {
    case "completed":
      return { status: "completed", phase: null };
    case "pipeline":
      return { status: "current", phase: "in_pipeline" };
    default:
      return { status: "current", phase: "under_construction" };
  }
}

/** Narrow untrusted form input to a stage, or null if it isn't one. */
export function parseStage(value: FormDataEntryValue | null): ProjectStage | null {
  const stage = String(value || "");
  return (STAGES as readonly string[]).includes(stage) ? (stage as ProjectStage) : null;
}
