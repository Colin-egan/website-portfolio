"use client";

import { useRef, useState, useTransition } from "react";
import { ExternalLink, FileText, Presentation, Trash2, Upload } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  createPresentationUploadAction,
  deletePresentationFileAction,
  refreshPresentationAction,
  savePresentationSettingsAction,
  type PresentationEditor,
} from "@/lib/portal/presentationActions";
import { ACCEPTED_EXTENSIONS, DEFAULT_PROMPT, displayName } from "@/lib/portal/presentationShared";

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Only the developer account has the `presentation` flag, so only it renders this. */
export function PresentationPanel({ editor }: { editor: PresentationEditor | null }) {
  const [prompt, setPrompt] = useState(editor?.systemPrompt || DEFAULT_PROMPT);
  const [chatEnabled, setChatEnabled] = useState(editor?.chatEnabled ?? true);
  const [status, setStatus] = useState<{ error: boolean; text: string } | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, startSave] = useTransition();
  const fileInput = useRef<HTMLInputElement>(null);

  if (!editor) {
    return <p className="text-sm text-muted-foreground">The presentation tab isn&apos;t set up yet.</p>;
  }

  const files = editor.files;
  const totalSize = files.reduce((sum, f) => sum + f.size, 0);
  const dirty = prompt !== (editor.systemPrompt || DEFAULT_PROMPT) || chatEnabled !== editor.chatEnabled;

  function save() {
    startSave(async () => {
      const result = await savePresentationSettingsAction({ systemPrompt: prompt, chatEnabled });
      setStatus(result.error ? { error: true, text: result.error } : { error: false, text: "Saved. The chatbot uses it on the next question." });
    });
  }

  async function upload(e: React.FormEvent) {
    e.preventDefault();
    const chosen = Array.from(fileInput.current?.files ?? []);
    if (chosen.length === 0) return;
    setUploading(true);
    setUploadError(null);

    for (const file of chosen) {
      const start = await createPresentationUploadAction(file.name, file.size);
      if (start.error !== null) {
        setUploadError(`${file.name}: ${start.error}`);
        break;
      }
      // Same shape supabase-js sends to a signed upload URL.
      const body = new FormData();
      body.append("cacheControl", "3600");
      body.append("", file);
      const res = await fetch(start.signedUrl, { method: "PUT", body, headers: { "x-upsert": "false" } });
      if (!res.ok) {
        setUploadError(`${file.name}: upload failed. Please try again.`);
        break;
      }
    }

    if (fileInput.current) fileInput.current.value = "";
    await refreshPresentationAction();
    setUploading(false);
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="p-2">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Presentation size={18} className="text-purple-500" />
            <CardTitle className="text-base">Presentation chatbot</CardTitle>
          </div>
          <CardDescription>
            What the chatbot at /presentation is told before every question. Changes apply
            right away, with no publish.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <label className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={chatEnabled}
              onChange={(e) => setChatEnabled(e.target.checked)}
              className="size-4 accent-purple-600"
            />
            Chat is open to the public
          </label>
          <div className="flex flex-col gap-2">
            <label htmlFor="presentation-prompt" className="text-sm font-medium">
              Instructions
            </label>
            <textarea
              id="presentation-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={8}
              maxLength={20000}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-purple-500"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={save} disabled={saving || !dirty}>
              {saving ? "Saving..." : "Save"}
            </Button>
            <a
              href="/presentation"
              target="_blank"
              rel="noreferrer"
              className={buttonVariants({ variant: "outline" })}
            >
              <ExternalLink size={14} />
              Open chatbot
            </a>
            {status && (
              <p className={`text-sm ${status.error ? "text-destructive" : "text-muted-foreground"}`}>
                {status.text}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="p-2">
        <CardHeader>
          <CardTitle className="text-base">Files ({files.length})</CardTitle>
          <CardDescription>
            The chatbot reads every file here when it answers. PDF, PowerPoint (.pptx), Word
            (.docx), images and text files, {formatSize(totalSize)} of 18 MB used. For
            Keynote or Google Slides, export as PDF or .pptx first.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <form onSubmit={upload} className="flex flex-col sm:flex-row gap-3">
            <input
              ref={fileInput}
              type="file"
              multiple
              required
              accept={ACCEPTED_EXTENSIONS.map((e) => `.${e}`).join(",")}
              className="flex-1 text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-purple-600 file:px-3 file:py-1.5 file:text-sm file:text-white file:font-medium hover:file:bg-purple-500 file:transition-colors"
            />
            <Button type="submit" disabled={uploading}>
              <Upload size={14} />
              {uploading ? "Uploading..." : "Upload"}
            </Button>
          </form>
          {uploadError && <p className="text-sm text-destructive">{uploadError}</p>}

          {files.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">No files yet.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {files.map((file) => (
                <FileRow key={file.name} name={file.name} size={file.size} />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function FileRow({ name, size }: { name: string; size: number }) {
  const [pending, startDelete] = useTransition();
  const label = displayName(name);

  return (
    <li className="flex items-center justify-between gap-3 py-3">
      <div className="flex items-center gap-3 min-w-0">
        <FileText size={16} className="text-purple-500 shrink-0" />
        <div className="min-w-0">
          <p className="text-sm truncate">{label}</p>
          <p className="text-xs text-muted-foreground">{formatSize(size)}</p>
        </div>
      </div>
      <button
        type="button"
        disabled={pending}
        onClick={() => startDelete(async () => void (await deletePresentationFileAction(name)))}
        className="inline-flex size-8 items-center justify-center rounded-lg text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-40"
        aria-label={`Delete ${label}`}
      >
        <Trash2 size={15} />
      </button>
    </li>
  );
}
