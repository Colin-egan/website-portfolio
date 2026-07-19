"use client";

import { useActionState, useState } from "react";
import { Plus, Trash2, ImagePlus, ChevronDown, ChevronUp, Building2, UploadCloud, Star } from "lucide-react";
import {
  upsertProjectAction,
  deleteProjectAction,
  setProjectStatusAction,
  uploadProjectImageAction,
  removeProjectImageAction,
  setHeroImageAction,
  publishAction,
  type Project,
  type ProjectFormState,
  type UploadProjectImageState,
  type PublishState,
} from "@/lib/portal/projectActions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const initialFormState: ProjectFormState = { error: null };
const initialUploadState: UploadProjectImageState = { error: null };
const initialPublishState: PublishState = { error: null, success: false };

const MAX_IMAGE_BYTES = 20 * 1024 * 1024;

function getImageValidationError(file: File): string | null {
  if (file.size > MAX_IMAGE_BYTES) {
    return "Image is too large (max 20MB).";
  }
  return null;
}

export function ProjectsPanel({
  projects,
  publishEnabled,
}: {
  projects: Project[];
  publishEnabled: boolean;
}) {
  const [addOpen, setAddOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [publishState, publishFormAction, publishPending] = useActionState(
    publishAction,
    initialPublishState
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-display font-bold">Projects</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Add properties, edit details, and move them between Current and Completed.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {publishEnabled && (
            <form action={publishFormAction}>
              <Button type="submit" variant="outline" size="sm" disabled={publishPending}>
                <UploadCloud size={14} />
                {publishPending ? "Publishing..." : "Publish"}
              </Button>
            </form>
          )}
          <Button size="sm" onClick={() => setAddOpen((v) => !v)}>
            <Plus size={14} />
            Add project
          </Button>
        </div>
      </div>

      {publishEnabled && (publishState.success || publishState.error) && (
        <p className={`text-sm ${publishState.success ? "text-purple-600" : "text-destructive"}`}>
          {publishState.success
            ? "Publish triggered — your changes will be live in a few minutes."
            : publishState.error}
        </p>
      )}

      {addOpen && (
        <Card className="p-2">
          <CardHeader>
            <CardTitle className="text-base">New project</CardTitle>
          </CardHeader>
          <CardContent>
            <ProjectForm onDone={() => setAddOpen(false)} />
          </CardContent>
        </Card>
      )}

      {projects.length === 0 ? (
        <Card className="p-2">
          <CardContent>
            <p className="text-sm text-muted-foreground py-4">No projects yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {projects.map((project) => (
            <ProjectRow
              key={project.id}
              project={project}
              expanded={expandedId === project.id}
              onToggle={() =>
                setExpandedId((id) => (id === project.id ? null : project.id))
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ProjectRow({
  project,
  expanded,
  onToggle,
}: {
  project: Project;
  expanded: boolean;
  onToggle: () => void;
}) {
  const [uploadState, uploadFormAction, uploadPending] = useActionState(
    uploadProjectImageAction,
    initialUploadState
  );
  const [clientError, setClientError] = useState<string | null>(null);

  return (
    <Card className="p-2">
      <CardHeader>
        <div className="flex items-center gap-3">
          {project.hero_image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={project.hero_image}
              alt={project.name}
              className="size-12 rounded-lg object-cover shrink-0"
            />
          ) : (
            <div className="size-12 rounded-lg bg-muted flex items-center justify-center shrink-0">
              <Building2 size={18} className="text-muted-foreground" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base truncate">{project.name}</CardTitle>
            <CardDescription className="truncate">
              {project.location || "No location set"}
            </CardDescription>
          </div>
          <StatusBadge status={project.status} />
          <Button variant="ghost" size="icon-sm" onClick={onToggle} aria-label="Toggle details">
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </Button>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="flex flex-col gap-6 mt-2">
          <div className="flex flex-wrap items-center gap-2">
            <form
              action={setProjectStatusAction.bind(
                null,
                project.id,
                project.status === "current" ? "completed" : "current"
              )}
            >
              <Button type="submit" variant="outline" size="sm">
                Mark as {project.status === "current" ? "Completed" : "Current"}
              </Button>
            </form>
            <form action={deleteProjectAction.bind(null, project.id)}>
              <Button type="submit" variant="destructive" size="sm">
                <Trash2 size={14} />
                Delete project
              </Button>
            </form>
          </div>

          <ProjectForm project={project} />

          <div>
            <h4 className="text-sm font-medium mb-3">Images</h4>
            <p className="text-xs text-muted-foreground mb-3">
              The key image is used as the project&apos;s thumbnail and cover photo.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
              {project.images.map((url) => {
                const isHero = url === project.hero_image;
                return (
                  <div
                    key={url}
                    className={`relative group rounded-lg ${
                      isHero ? "ring-2 ring-purple-600 ring-offset-2 ring-offset-background" : ""
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt=""
                      className="w-full aspect-square object-cover rounded-lg"
                    />
                    {isHero && (
                      <span className="absolute top-1 left-1 flex items-center gap-1 rounded-full bg-purple-600 px-2 py-0.5 text-[10px] font-medium text-white">
                        <Star size={10} fill="currentColor" />
                        Key image
                      </span>
                    )}
                    <div className="absolute top-1 right-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!isHero && (
                        <form action={setHeroImageAction.bind(null, project.id, url)}>
                          <button
                            type="submit"
                            className="size-6 rounded-full bg-background/90 flex items-center justify-center text-purple-600"
                            aria-label="Set as key image"
                            title="Set as key image"
                          >
                            <Star size={12} />
                          </button>
                        </form>
                      )}
                      <form action={removeProjectImageAction.bind(null, project.id, url)}>
                        <button
                          type="submit"
                          className="size-6 rounded-full bg-background/90 flex items-center justify-center text-destructive"
                          aria-label="Remove image"
                        >
                          <Trash2 size={12} />
                        </button>
                      </form>
                    </div>
                  </div>
                );
              })}
            </div>
            <form
              action={uploadFormAction}
              onSubmit={(e) => {
                const input = e.currentTarget.elements.namedItem("file") as HTMLInputElement;
                const file = input?.files?.[0];
                const error = file ? getImageValidationError(file) : null;
                if (error) {
                  e.preventDefault();
                  setClientError(error);
                } else {
                  setClientError(null);
                }
              }}
              className="flex flex-col sm:flex-row gap-3"
            >
              <input type="hidden" name="projectId" value={project.id} />
              <input
                type="file"
                name="file"
                accept="image/*"
                required
                className="flex-1 text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-purple-600 file:px-3 file:py-1.5 file:text-sm file:text-white file:font-medium hover:file:bg-purple-500 file:transition-colors"
              />
              <Button type="submit" size="sm" disabled={uploadPending}>
                <ImagePlus size={14} />
                {uploadPending ? "Uploading..." : "Add image"}
              </Button>
            </form>
            {(clientError || uploadState.error) && (
              <p className="text-sm text-destructive mt-2">{clientError ?? uploadState.error}</p>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

function StatusBadge({ status }: { status: Project["status"] }) {
  return (
    <span
      className={`text-xs px-2 py-1 rounded-full font-medium shrink-0 ${
        status === "completed"
          ? "bg-purple-600/10 text-purple-600"
          : "bg-amber-500/10 text-amber-600"
      }`}
    >
      {status === "completed" ? "Completed" : "Current"}
    </span>
  );
}

function ProjectForm({ project, onDone }: { project?: Project; onDone?: () => void }) {
  const action = async (prevState: ProjectFormState, formData: FormData) => {
    const result = await upsertProjectAction(prevState, formData);
    if (!result.error) onDone?.();
    return result;
  };
  const [state, formAction, pending] = useActionState(action, initialFormState);

  const field = "h-10 rounded-lg border border-border bg-background px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50";
  const label = "text-sm text-muted-foreground";

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {project && <input type="hidden" name="id" value={project.id} />}
      <input type="hidden" name="status" value={project?.status ?? "current"} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className={label}>Name</label>
          <input name="name" defaultValue={project?.name} required className={field} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={label}>Location</label>
          <input name="location" defaultValue={project?.location ?? ""} className={field} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={label}>Address</label>
          <input name="address" defaultValue={project?.address ?? ""} className={field} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={label}>Units</label>
          <input name="units" defaultValue={project?.units ?? ""} className={field} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={label}>Unit types</label>
          <input name="unit_types" defaultValue={project?.unit_types ?? ""} className={field} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={label}>Square footage</label>
          <input name="square_footage" defaultValue={project?.square_footage ?? ""} className={field} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={label}>Year completed</label>
          <input name="year_completed" defaultValue={project?.year_completed ?? ""} className={field} />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className={label}>Description</label>
        <textarea
          name="description"
          defaultValue={project?.description ?? ""}
          rows={3}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className={label}>Amenities (one per line)</label>
          <textarea
            name="amenities"
            defaultValue={project?.amenities?.join("\n") ?? ""}
            rows={3}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={label}>Features (one per line)</label>
          <textarea
            name="features"
            defaultValue={project?.features?.join("\n") ?? ""}
            rows={3}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Saving..." : project ? "Save changes" : "Create project"}
      </Button>
    </form>
  );
}
