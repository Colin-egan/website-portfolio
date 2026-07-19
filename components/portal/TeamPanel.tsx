"use client";

import { useActionState, useState } from "react";
import { Plus, Trash2, ImagePlus, ChevronDown, ChevronUp, User } from "lucide-react";
import {
  upsertTeamMemberAction,
  deleteTeamMemberAction,
  uploadTeamPhotoAction,
  removeTeamPhotoAction,
  type TeamMember,
  type TeamFormState,
  type UploadTeamPhotoState,
} from "@/lib/portal/teamActions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const initialFormState: TeamFormState = { error: null };
const initialUploadState: UploadTeamPhotoState = { error: null };

const MAX_IMAGE_BYTES = 20 * 1024 * 1024;

function getImageValidationError(file: File): string | null {
  if (file.size > MAX_IMAGE_BYTES) {
    return "Image is too large (max 20MB).";
  }
  return null;
}

export function TeamPanel({ members }: { members: TeamMember[] }) {
  const [addOpen, setAddOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-display font-bold">Team</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Add team members, edit bios, and upload headshots.
          </p>
        </div>
        <Button size="sm" onClick={() => setAddOpen((v) => !v)}>
          <Plus size={14} />
          Add team member
        </Button>
      </div>

      {addOpen && (
        <Card className="p-2">
          <CardHeader>
            <CardTitle className="text-base">New team member</CardTitle>
          </CardHeader>
          <CardContent>
            <TeamMemberForm onDone={() => setAddOpen(false)} />
          </CardContent>
        </Card>
      )}

      {members.length === 0 ? (
        <Card className="p-2">
          <CardContent>
            <p className="text-sm text-muted-foreground py-4">No team members yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {members.map((member) => (
            <TeamMemberRow
              key={member.id}
              member={member}
              expanded={expandedId === member.id}
              onToggle={() => setExpandedId((id) => (id === member.id ? null : member.id))}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TeamMemberRow({
  member,
  expanded,
  onToggle,
}: {
  member: TeamMember;
  expanded: boolean;
  onToggle: () => void;
}) {
  const [uploadState, uploadFormAction, uploadPending] = useActionState(
    uploadTeamPhotoAction,
    initialUploadState
  );
  const [clientError, setClientError] = useState<string | null>(null);

  return (
    <Card className="p-2">
      <CardHeader>
        <div className="flex items-center gap-3">
          {member.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={member.photo}
              alt={member.name}
              className="size-12 rounded-lg object-cover shrink-0"
            />
          ) : (
            <div className="size-12 rounded-lg bg-muted flex items-center justify-center shrink-0">
              <User size={18} className="text-muted-foreground" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base truncate">{member.name}</CardTitle>
            <CardDescription className="truncate">{member.title || "No title set"}</CardDescription>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={onToggle} aria-label="Toggle details">
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </Button>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="flex flex-col gap-6 mt-2">
          <div className="flex flex-wrap items-center gap-2">
            <form action={deleteTeamMemberAction.bind(null, member.id)}>
              <Button type="submit" variant="destructive" size="sm">
                <Trash2 size={14} />
                Delete team member
              </Button>
            </form>
          </div>

          <TeamMemberForm member={member} />

          <div>
            <h4 className="text-sm font-medium mb-3">Photo</h4>
            {member.photo && (
              <div className="relative group w-24 mb-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={member.photo}
                  alt=""
                  className="w-24 aspect-square object-cover rounded-lg"
                />
                <form action={removeTeamPhotoAction.bind(null, member.id)}>
                  <button
                    type="submit"
                    className="absolute top-1 right-1 size-6 rounded-full bg-background/90 flex items-center justify-center text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Remove photo"
                  >
                    <Trash2 size={12} />
                  </button>
                </form>
              </div>
            )}
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
              <input type="hidden" name="memberId" value={member.id} />
              <input
                type="file"
                name="file"
                accept="image/*"
                required
                className="flex-1 text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-purple-600 file:px-3 file:py-1.5 file:text-sm file:text-white file:font-medium hover:file:bg-purple-500 file:transition-colors"
              />
              <Button type="submit" size="sm" disabled={uploadPending}>
                <ImagePlus size={14} />
                {uploadPending ? "Uploading..." : member.photo ? "Replace photo" : "Add photo"}
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

function TeamMemberForm({ member, onDone }: { member?: TeamMember; onDone?: () => void }) {
  const action = async (prevState: TeamFormState, formData: FormData) => {
    const result = await upsertTeamMemberAction(prevState, formData);
    if (!result.error) onDone?.();
    return result;
  };
  const [state, formAction, pending] = useActionState(action, initialFormState);

  const field =
    "h-10 rounded-lg border border-border bg-background px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50";
  const textarea =
    "rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50";
  const label = "text-sm text-muted-foreground";

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {member && <input type="hidden" name="id" value={member.id} />}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className={label}>Name</label>
          <input name="name" defaultValue={member?.name} required className={field} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={label}>Title</label>
          <input name="title" defaultValue={member?.title ?? ""} className={field} />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className={label}>Bio (separate paragraphs with a blank line)</label>
        <textarea
          name="bio"
          defaultValue={member?.bio?.join("\n\n") ?? ""}
          rows={5}
          className={textarea}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className={label}>Education (one per line)</label>
          <textarea
            name="education"
            defaultValue={member?.education?.join("\n") ?? ""}
            rows={3}
            className={textarea}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={label}>Personal note</label>
          <textarea
            name="personal"
            defaultValue={member?.personal ?? ""}
            rows={3}
            className={textarea}
          />
        </div>
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Saving..." : member ? "Save changes" : "Add team member"}
      </Button>
    </form>
  );
}
