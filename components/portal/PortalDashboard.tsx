"use client";

import { useActionState } from "react";
import { Download, Trash2, Upload, FileText } from "lucide-react";
import { uploadAction, deleteAction, type UploadState } from "@/lib/portal/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

type FileEntry = { name: string; size: number; updatedAt: string | null };

const initialUploadState: UploadState = { error: null };

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function PortalDashboard({ files }: { files: FileEntry[] }) {
  const [uploadState, uploadFormAction, uploadPending] = useActionState(
    uploadAction,
    initialUploadState
  );

  return (
    <div className="flex flex-col gap-6">
        <Card className="p-2">
          <CardHeader>
            <CardTitle className="text-base">Upload a file</CardTitle>
            <CardDescription>Max size 50MB.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={uploadFormAction} className="flex flex-col sm:flex-row gap-3 mt-2">
              <input
                type="file"
                name="file"
                required
                className="flex-1 text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-purple-600 file:px-3 file:py-1.5 file:text-sm file:text-white file:font-medium hover:file:bg-purple-500 file:transition-colors"
              />
              <Button type="submit" disabled={uploadPending}>
                <Upload size={14} />
                {uploadPending ? "Uploading..." : "Upload"}
              </Button>
            </form>
            {uploadState.error && (
              <p className="text-sm text-destructive mt-2">{uploadState.error}</p>
            )}
          </CardContent>
        </Card>

        <Card className="p-2">
          <CardHeader>
            <CardTitle className="text-base">Files ({files.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {files.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">
                No files uploaded yet.
              </p>
            ) : (
              <ul className="flex flex-col divide-y divide-border">
                {files.map((file) => (
                  <FileRow key={file.name} file={file} />
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
    </div>
  );
}

function FileRow({ file }: { file: FileEntry }) {
  const displayName = file.name.replace(/^\d+-/, "");

  return (
    <li className="flex items-center justify-between gap-3 py-3">
      <div className="flex items-center gap-3 min-w-0">
        <FileText size={16} className="text-purple-500 shrink-0" />
        <div className="min-w-0">
          <p className="text-sm truncate">{displayName}</p>
          <p className="text-xs text-muted-foreground">{formatSize(file.size)}</p>
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <a
          href={`/portal/download?file=${encodeURIComponent(file.name)}`}
          className="inline-flex size-8 items-center justify-center rounded-lg hover:bg-muted transition-colors"
          aria-label={`Download ${displayName}`}
        >
          <Download size={15} />
        </a>
        <form action={deleteAction.bind(null, file.name)}>
          <button
            type="submit"
            className="inline-flex size-8 items-center justify-center rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
            aria-label={`Delete ${displayName}`}
          >
            <Trash2 size={15} />
          </button>
        </form>
      </div>
    </li>
  );
}
