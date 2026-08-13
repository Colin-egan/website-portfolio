"use client";

import { useActionState } from "react";
import { ArrowDown, ArrowUp, ImagePlus, Trash2 } from "lucide-react";
import {
  addTeamPickAction,
  deleteTeamPickAction,
  moveTeamPickAction,
  updateTeamPickAction,
  type TeamPick,
  type PickFormState,
} from "@/lib/portal/pickActions";
import { Button } from "@/components/ui/button";

const initialState: PickFormState = { error: null };

const fieldClass =
  "h-9 rounded-lg border border-border bg-background px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50";

function PickRow({ pick, index, total }: { pick: TeamPick; index: number; total: number }) {
  const [state, formAction, pending] = useActionState(updateTeamPickAction, initialState);

  return (
    <li className="flex gap-3 rounded-lg border border-border p-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={pick.image} alt="" className="size-16 rounded object-cover shrink-0" />

      <div className="flex-1 min-w-0 flex flex-col gap-2">
        <form action={formAction} className="flex flex-col sm:flex-row gap-2">
          <input type="hidden" name="id" value={pick.id} />
          <input
            name="title"
            defaultValue={pick.title}
            required
            placeholder="Comic title"
            className={`${fieldClass} flex-1 min-w-0`}
          />
          <input
            name="link_url"
            type="url"
            defaultValue={pick.link_url ?? ""}
            placeholder="Shop link (optional)"
            className={`${fieldClass} flex-1 min-w-0`}
          />
          <Button type="submit" variant="outline" size="sm" disabled={pending}>
            {pending ? "Saving..." : "Save"}
          </Button>
        </form>

        <div className="flex gap-1">
          <form action={moveTeamPickAction.bind(null, pick.id, "up")}>
            <Button
              type="submit"
              variant="ghost"
              size="icon-sm"
              disabled={index === 0}
              aria-label="Move up"
            >
              <ArrowUp size={14} />
            </Button>
          </form>
          <form action={moveTeamPickAction.bind(null, pick.id, "down")}>
            <Button
              type="submit"
              variant="ghost"
              size="icon-sm"
              disabled={index === total - 1}
              aria-label="Move down"
            >
              <ArrowDown size={14} />
            </Button>
          </form>
          <form action={deleteTeamPickAction.bind(null, pick.id)}>
            <Button type="submit" variant="ghost" size="icon-sm" aria-label="Delete pick">
              <Trash2 size={14} className="text-destructive" />
            </Button>
          </form>
        </div>

        {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      </div>
    </li>
  );
}

export function TeamPicksEditor({
  memberId,
  memberName,
  picks,
}: {
  memberId: string;
  memberName: string;
  picks: TeamPick[];
}) {
  const [state, formAction, pending] = useActionState(addTeamPickAction, initialState);

  return (
    <div>
      <h4 className="text-sm font-medium mb-3">
        {memberName}&apos;s picks
        <span className="text-muted-foreground font-normal"> ({picks.length})</span>
      </h4>

      {picks.length === 0 ? (
        <p className="text-sm text-muted-foreground mb-3">
          No picks yet — this page shows &ldquo;Coming Soon&rdquo; on the site until one is added.
        </p>
      ) : (
        <ul className="flex flex-col gap-2 mb-4">
          {picks.map((pick, i) => (
            <PickRow key={pick.id} pick={pick} index={i} total={picks.length} />
          ))}
        </ul>
      )}

      {/* React 19 resets uncontrolled fields itself once a form action resolves. */}
      <form action={formAction} className="flex flex-col gap-3">
        <input type="hidden" name="memberId" value={memberId} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input name="title" required placeholder="Comic title" className={`${fieldClass} h-10`} />
          <input
            name="link_url"
            type="url"
            placeholder="Shop link (optional)"
            className={`${fieldClass} h-10`}
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="file"
            name="file"
            accept="image/*"
            required
            className="flex-1 text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-purple-600 file:px-3 file:py-1.5 file:text-sm file:text-white file:font-medium hover:file:bg-purple-500 file:transition-colors"
          />
          <Button type="submit" size="sm" disabled={pending}>
            <ImagePlus size={14} />
            {pending ? "Adding..." : "Add pick"}
          </Button>
        </div>
      </form>

      {state.error && <p className="text-sm text-destructive mt-2">{state.error}</p>}
    </div>
  );
}
