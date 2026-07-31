"use client";

import { useActionState } from "react";
import { UploadCloud } from "lucide-react";
import { publishAction, type PublishState } from "@/lib/portal/projectActions";
import { Button } from "@/components/ui/button";

const initialPublishState: PublishState = { error: null, success: false };

/**
 * Publishing rebuilds the client's whole site, so it belongs to the client rather
 * than to any one tab. It used to live inside ProjectsPanel, which left clients
 * without a Projects tab unable to publish at all.
 */
export function PublishButton() {
  const [state, formAction, pending] = useActionState(publishAction, initialPublishState);

  return (
    <div className="flex flex-col items-end gap-1">
      <form action={formAction}>
        <Button type="submit" variant="outline" size="sm" disabled={pending}>
          <UploadCloud size={14} />
          {pending ? "Publishing..." : "Publish"}
        </Button>
      </form>
      {(state.success || state.error) && (
        <p className={`text-sm ${state.success ? "text-purple-600" : "text-destructive"}`}>
          {state.success
            ? "Publish triggered — your changes will be live in a few minutes."
            : state.error}
        </p>
      )}
    </div>
  );
}
