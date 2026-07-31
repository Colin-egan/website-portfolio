"use client";

import { useActionState } from "react";
import { ArrowDown, ArrowUp, ImagePlus, Trash2 } from "lucide-react";
import {
  addWeeklyPicAction,
  deleteWeeklyPicAction,
  moveWeeklyPicAction,
  updateWeeklyPicAction,
  type WeeklyPic,
  type WeeklyFormState,
} from "@/lib/portal/weeklyActions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const initialState: WeeklyFormState = { error: null };

const fieldClass =
  "h-9 rounded-lg border border-border bg-background px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50";

function PicRow({ pic, index, total }: { pic: WeeklyPic; index: number; total: number }) {
  const [state, formAction, pending] = useActionState(updateWeeklyPicAction, initialState);

  return (
    <li className="flex gap-3 rounded-lg border border-border p-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={pic.image} alt="" className="size-16 rounded object-cover shrink-0" />

      <div className="flex-1 min-w-0 flex flex-col gap-2">
        <form action={formAction} className="flex flex-col gap-2">
          <input type="hidden" name="id" value={pic.id} />
          <input
            name="title"
            defaultValue={pic.title}
            required
            placeholder="Comic title"
            className={fieldClass}
          />
          <input
            name="caption"
            defaultValue={pic.caption ?? ""}
            placeholder="Caption (optional)"
            className={fieldClass}
          />
          <input
            name="link_url"
            type="url"
            defaultValue={pic.link_url ?? ""}
            placeholder="Shop link (optional)"
            className={fieldClass}
          />
          <Button type="submit" variant="outline" size="sm" disabled={pending} className="self-start">
            {pending ? "Saving..." : "Save"}
          </Button>
        </form>

        <div className="flex gap-1">
          <form action={moveWeeklyPicAction.bind(null, pic.id, "up")}>
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
          <form action={moveWeeklyPicAction.bind(null, pic.id, "down")}>
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
          <form action={deleteWeeklyPicAction.bind(null, pic.id)}>
            <Button type="submit" variant="ghost" size="icon-sm" aria-label="Delete pic">
              <Trash2 size={14} className="text-destructive" />
            </Button>
          </form>
        </div>

        {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      </div>
    </li>
  );
}

export function WeeklyPicsGrid({ pics }: { pics: WeeklyPic[] }) {
  const [state, formAction, pending] = useActionState(addWeeklyPicAction, initialState);

  return (
    <div>
      <h3 className="text-sm font-medium mb-1">Pics of the week</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Photos of the new comics that came in. These show on the homepage under the video.
      </p>

      {pics.length === 0 ? (
        <Card className="p-2 mb-4">
          <CardContent>
            <p className="text-sm text-muted-foreground py-4">
              No pics yet. The homepage section still shows the video and the shop links.
            </p>
          </CardContent>
        </Card>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          {pics.map((pic, i) => (
            <PicRow key={pic.id} pic={pic} index={i} total={pics.length} />
          ))}
        </ul>
      )}

      {/* React 19 resets uncontrolled fields itself once a form action resolves. */}
      <form action={formAction} className="flex flex-col gap-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input name="title" required placeholder="Comic title" className={`${fieldClass} h-10`} />
          <input name="caption" placeholder="Caption (optional)" className={`${fieldClass} h-10`} />
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
            {pending ? "Adding..." : "Add pic"}
          </Button>
        </div>
      </form>

      {state.error && <p className="text-sm text-destructive mt-2">{state.error}</p>}
    </div>
  );
}
