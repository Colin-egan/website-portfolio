"use client";

import { useActionState } from "react";
import {
  setWeeklyVideoUrlAction,
  type VideoFormState,
  type WeeklyPic,
} from "@/lib/portal/weeklyActions";
import { Button } from "@/components/ui/button";
import { WeeklyPicsGrid } from "@/components/portal/WeeklyPicsGrid";

const initialState: VideoFormState = { error: null };

export function NewThisWeekPanel({
  pics,
  videoUrl,
}: {
  pics: WeeklyPic[];
  videoUrl: string | null;
}) {
  const [state, formAction, pending] = useActionState(setWeeklyVideoUrlAction, initialState);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-lg font-display font-bold">New This Week</h2>
        <p className="text-sm text-muted-foreground mt-1">
          The video and comic pics shown in the New This Week section of your homepage.
        </p>
      </div>

      <div>
        <h3 className="text-sm font-medium mb-1">Weekly video</h3>
        <p className="text-sm text-muted-foreground mb-3">
          Paste the link to this week&apos;s video. Instagram reels play right on the page;
          anything else shows as a button linking to it.
        </p>
        <form action={formAction} className="flex flex-col sm:flex-row gap-3">
          <input
            name="url"
            type="url"
            defaultValue={videoUrl ?? ""}
            placeholder="https://www.instagram.com/reel/..."
            className="h-10 flex-1 rounded-lg border border-border bg-background px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          />
          <Button type="submit" size="sm" disabled={pending}>
            {pending ? "Saving..." : "Save video"}
          </Button>
        </form>
        {state.error && <p className="text-sm text-destructive mt-2">{state.error}</p>}
        {!state.error && state.saved && (
          <p className="text-sm text-muted-foreground mt-2">Saved.</p>
        )}
        <p className="text-xs text-muted-foreground mt-2">
          Leave it empty to remove the video from the homepage.
        </p>
      </div>

      <WeeklyPicsGrid pics={pics} />
    </div>
  );
}
