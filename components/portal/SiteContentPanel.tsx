"use client";

import { useEffect, useId, useMemo, useRef, useState, useTransition } from "react";
import { ArrowDown, ArrowUp, ImagePlus, Plus, RotateCcw, Save, Trash2 } from "lucide-react";
import {
  saveSiteSectionAction,
  uploadSiteImageAction,
  type SiteContentEditor,
} from "@/lib/portal/siteContentActions";
import {
  canonicalSection,
  emptyValue,
  type FieldSpec,
  type SectionSpec,
} from "@/lib/portal/siteContent/spec";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const fieldClass =
  "h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50";
const textareaClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm leading-relaxed outline-none focus-visible:ring-3 focus-visible:ring-ring/50";
const labelClass = "text-sm text-muted-foreground";

const MAX_IMAGE_BYTES = 20 * 1024 * 1024;

type Values = Record<string, unknown>;
type Path = (string | number)[];
type SetAt = (path: Path, value: unknown) => void;
type OnUpload = (delta: 1 | -1) => void;

const LEAVE_WARNING = "You have unsaved changes to your website. Leave without saving them?";

function asObject(v: unknown): Values {
  return typeof v === "object" && v !== null && !Array.isArray(v) ? (v as Values) : {};
}

/** Immutable set at a path. Missing containers are created as objects. */
function setIn(target: unknown, path: Path, value: unknown): unknown {
  if (path.length === 0) return value;
  const [head, ...rest] = path;
  if (typeof head === "number") {
    const arr = Array.isArray(target) ? [...target] : [];
    arr[head] = setIn(arr[head], rest, value);
    return arr;
  }
  const obj = asObject(target);
  return { ...obj, [head]: setIn(obj[head], rest, value) };
}

function initialSection(section: SectionSpec, saved: unknown): Values {
  const source = asObject(saved);
  return Object.fromEntries(
    section.fields.map((f) => [f.key, source[f.key] ?? emptyValue(f)])
  );
}

export function SiteContentPanel({
  editor,
  publishEnabled,
}: {
  editor: SiteContentEditor | null;
  publishEnabled: boolean;
}) {
  if (!editor) {
    return (
      <Card className="p-2">
        <CardContent>
          <p className="text-sm text-muted-foreground py-4">
            Site editing isn&apos;t set up for your account yet. Contact Egan Lab to get started.
          </p>
        </CardContent>
      </Card>
    );
  }

  return <SiteContentEditorView editor={editor} publishEnabled={publishEnabled} />;
}

function SiteContentEditorView({
  editor,
  publishEnabled,
}: {
  editor: SiteContentEditor;
  publishEnabled: boolean;
}) {
  const { spec } = editor;
  const rootRef = useRef<HTMLDivElement>(null);
  const sectionByKey = useMemo(
    () => Object.fromEntries(spec.sections.map((s) => [s.key, s])),
    [spec]
  );
  /** What a save would store, as a string — the basis for "has this page changed?". */
  const canon = (key: string, value: unknown) =>
    JSON.stringify(canonicalSection(sectionByKey[key], value));

  // Edits to every section are kept while switching between them, so moving to
  // another page to check something never throws work away.
  const [values, setValues] = useState<Record<string, Values>>(() =>
    Object.fromEntries(spec.sections.map((s) => [s.key, initialSection(s, editor.content[s.key])]))
  );
  const [saved, setSaved] = useState<Record<string, Values>>(() => values);
  const [uploads, setUploads] = useState<Record<string, number>>({});
  const [activeKey, setActiveKey] = useState(spec.sections[0]?.key ?? "");
  const [status, setStatus] = useState<{ key: string; error: string | null } | null>(null);
  const [pending, startTransition] = useTransition();

  const isDirty = (key: string) => canon(key, values[key]) !== canon(key, saved[key]);
  const isUploading = (key: string) => (uploads[key] ?? 0) > 0;
  const unsaved = spec.sections.some((s) => isDirty(s.key) || isUploading(s.key));

  // Guard every way out of the editor while anything is unsaved: closing or
  // reloading the tab, and in-app navigation — links and forms elsewhere on the page
  // (the site nav, Log out), which never fire beforeunload. Capture phase, so the
  // confirm runs before Next's Link or a form action does.
  useEffect(() => {
    if (!unsaved) return;
    const inEditor = (el: Element) => rootRef.current?.contains(el) ?? false;
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
        return;
      }
      const link = (e.target as Element | null)?.closest?.("a[href]");
      if (!link || inEditor(link) || link.getAttribute("target") === "_blank") return;
      if (!window.confirm(LEAVE_WARNING)) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    const onSubmit = (e: Event) => {
      const form = e.target as Element | null;
      if (!form || inEditor(form)) return;
      if (!window.confirm(LEAVE_WARNING)) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onClick, true);
    document.addEventListener("submit", onSubmit, true);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("submit", onSubmit, true);
    };
  }, [unsaved]);

  const section = spec.sections.find((s) => s.key === activeKey) ?? spec.sections[0];
  if (!section) return null;

  // Functional and path-based, so an edit that lands late — a photo finishing its
  // upload — applies to the latest values instead of a snapshot from when it began.
  const sectionKey = section.key;
  const setAt: SetAt = (path, value) => {
    setValues((prev) => ({
      ...prev,
      [sectionKey]: setIn(prev[sectionKey], path, value) as Values,
    }));
    setStatus((prev) => (prev?.key === sectionKey ? null : prev));
  };
  const onUpload: OnUpload = (delta) =>
    setUploads((prev) => ({ ...prev, [sectionKey]: Math.max(0, (prev[sectionKey] ?? 0) + delta) }));

  const save = () => {
    const key = section.key;
    const value = values[key];
    const sent = canon(key, value);
    startTransition(async () => {
      try {
        const res = await saveSiteSectionAction(key, value);
        if (!res.error && res.value) {
          const stored = asObject(res.value);
          setSaved((prev) => ({ ...prev, [key]: stored }));
          // Show exactly what was stored (trimmed, numbers tidied) — unless the owner
          // kept editing while it saved; then their newer edits stay, marked unsaved.
          setValues((prev) => (canon(key, prev[key]) === sent ? { ...prev, [key]: stored } : prev));
        }
        setStatus({ key, error: res.error });
      } catch {
        // A dropped connection shouldn't throw away the form to the error page.
        setStatus({ key, error: "Couldn't reach the server. Check your connection and try again." });
      }
    });
  };

  const discard = () => {
    setValues((prev) => ({ ...prev, [section.key]: saved[section.key] }));
    setStatus(null);
  };

  const dirty = isDirty(section.key);
  const uploading = isUploading(section.key);
  const sectionStatus = status?.key === section.key ? status : null;
  // "Saved" only when it is still true: an edit or a photo that lands after the save
  // started is unsaved, whatever the last save said.
  const message = sectionStatus?.error
    ? sectionStatus.error
    : uploading
      ? "Uploading photo..."
      : dirty
        ? "Unsaved changes"
        : sectionStatus
          ? spec.liveOnSave
            ? "Saved. It'll be on your site within a couple of minutes."
            : "Saved. Press Publish when you're ready to put it live."
          : "";
  const saveBar = {
    label: section.title,
    dirty,
    saving: pending,
    // A save mid-upload would store the old photo, and a discard would be undone when
    // the upload lands — so both wait for it.
    pending: pending || uploading,
    message,
    isError: Boolean(sectionStatus?.error),
    onSave: save,
    onDiscard: discard,
  };

  return (
    <div ref={rootRef} className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-display font-bold">Site Content</h2>
        {spec.liveOnSave ? (
          <p className="text-sm text-muted-foreground mt-1">
            Edit the words, prices and photos on your website. Each page goes live on your
            site within a couple of minutes of saving — refresh your site to see it.
          </p>
        ) : (
          <p className="text-sm text-muted-foreground mt-1">
            Edit the words, prices and photos on your website. Save each page as you go, then
            press <strong className="font-medium text-foreground">Publish</strong> to put your
            changes live — it takes a few minutes.
          </p>
        )}
        {!spec.liveOnSave && !publishEnabled && (
          <p className="text-sm text-muted-foreground mt-2">
            Publishing isn&apos;t connected yet. Your saved changes are kept and will go live
            once Egan Lab finishes setting it up.
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Page to edit">
        {spec.sections.map((s) => (
          <button
            key={s.key}
            type="button"
            role="tab"
            aria-selected={s.key === section.key}
            onClick={() => setActiveKey(s.key)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm transition-colors",
              s.key === section.key
                ? "border-purple-500 bg-purple-500/10 text-foreground"
                : "border-border text-muted-foreground hover:text-foreground"
            )}
          >
            {s.title}
            {(isDirty(s.key) || isUploading(s.key)) && (
              <span className="ml-1.5 inline-block size-1.5 rounded-full bg-purple-500 align-middle">
                <span className="sr-only"> (unsaved changes)</span>
              </span>
            )}
          </button>
        ))}
      </div>

      <Card className="p-2">
        <CardHeader>
          <CardTitle className="text-base">{section.title}</CardTitle>
          {section.description && <CardDescription>{section.description}</CardDescription>}
          {/* The same save as the sticky bar below, so a quick edit near the top of a
              long page doesn't mean scrolling to the end to save it. */}
          <SaveBar {...saveBar} className="mt-3" />
        </CardHeader>
        {/* Keyed by section so each page's fields get their own state — an upload
            spinner or error on one page's photo never shows on another's. */}
        <CardContent key={section.key} className="flex flex-col gap-5 mt-2">
          {section.fields.map((field) => (
            <FieldEditor
              key={field.key}
              field={field}
              value={values[section.key][field.key]}
              path={[field.key]}
              setAt={setAt}
              onUpload={onUpload}
              previewOrigin={spec.previewOrigin}
            />
          ))}
        </CardContent>
      </Card>

      {/* Sticky so the save button is never a long scroll away on the bigger pages.
          This one carries the live status region; the top bar repeats it silently. */}
      <SaveBar
        {...saveBar}
        announce
        className="sticky bottom-4 z-10 rounded-xl border border-border bg-background/95 p-3 shadow-sm backdrop-blur"
      />
    </div>
  );
}

function SaveBar({
  label,
  dirty,
  saving,
  pending,
  message,
  isError,
  onSave,
  onDiscard,
  announce = false,
  className,
}: {
  label: string;
  dirty: boolean;
  saving: boolean;
  /** Saving, or something the save has to wait for (a photo upload). */
  pending: boolean;
  message: string;
  isError: boolean;
  onSave: () => void;
  onDiscard: () => void;
  /** Only one bar may be a live region, or screen readers announce every status twice. */
  announce?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-3", className)}>
      <Button onClick={onSave} disabled={pending || !dirty}>
        <Save size={14} />
        {saving ? "Saving..." : `Save ${label}`}
      </Button>
      {dirty && !pending && (
        <Button variant="ghost" onClick={onDiscard}>
          <RotateCcw size={14} />
          Discard changes
        </Button>
      )}
      <p
        className={cn("text-sm", isError ? "text-destructive" : "text-muted-foreground")}
        role={announce ? "status" : undefined}
        aria-hidden={announce ? undefined : true}
      >
        {message}
      </p>
    </div>
  );
}

type EditorProps = {
  value: unknown;
  path: Path;
  setAt: SetAt;
  onUpload: OnUpload;
  previewOrigin: string;
};

function FieldEditor({
  field,
  value,
  path,
  setAt,
  onUpload,
  previewOrigin,
}: EditorProps & { field: FieldSpec }) {
  const id = useId();
  const onChange = (v: unknown) => setAt(path, v);

  switch (field.kind) {
    case "text":
      return (
        <Labelled id={id} field={field}>
          {field.multiline ? (
            <textarea
              id={id}
              rows={3}
              value={typeof value === "string" ? value : ""}
              onChange={(e) => onChange(e.target.value)}
              className={textareaClass}
            />
          ) : (
            <input
              id={id}
              value={typeof value === "string" ? value : ""}
              onChange={(e) => onChange(e.target.value)}
              className={fieldClass}
            />
          )}
        </Labelled>
      );

    case "number":
      return (
        <Labelled id={id} field={field}>
          <input
            id={id}
            inputMode="decimal"
            value={value === null || value === undefined ? "" : String(value)}
            onChange={(e) => onChange(e.target.value)}
            className={cn(fieldClass, "max-w-40")}
          />
        </Labelled>
      );

    case "list":
    case "paragraphs": {
      // Split and joined on the exact separator so the textarea round-trips while
      // typing; blank entries are trimmed out on save.
      const sep = field.kind === "list" ? "\n" : "\n\n";
      const items = Array.isArray(value) ? (value as string[]) : [];
      const text = items.join(sep);
      return (
        <Labelled id={id} field={field}>
          <textarea
            id={id}
            rows={Math.min(Math.max(text.split("\n").length + 1, 3), 16)}
            value={text}
            onChange={(e) => onChange(e.target.value.split(sep))}
            className={textareaClass}
          />
        </Labelled>
      );
    }

    case "image":
      return (
        <ImageField
          field={field}
          value={value}
          path={path}
          setAt={setAt}
          onUpload={onUpload}
          previewOrigin={previewOrigin}
        />
      );

    case "group": {
      const obj = asObject(value);
      return (
        <fieldset className="flex flex-col gap-4 border-l-2 border-border pl-4">
          <legend className="text-sm font-medium mb-1">{field.label}</legend>
          {field.hint && <p className="text-xs text-muted-foreground -mt-2">{field.hint}</p>}
          {field.fields.map((f) => (
            <FieldEditor
              key={f.key}
              field={f}
              value={obj[f.key] ?? emptyValue(f)}
              path={[...path, f.key]}
              setAt={setAt}
              onUpload={onUpload}
              previewOrigin={previewOrigin}
            />
          ))}
        </fieldset>
      );
    }

    case "repeat":
      return (
        <RepeatField
          field={field}
          value={value}
          path={path}
          setAt={setAt}
          onUpload={onUpload}
          previewOrigin={previewOrigin}
        />
      );
  }
}

function Labelled({
  id,
  field,
  children,
}: {
  id: string;
  field: FieldSpec;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className={labelClass}>
        {field.label}
      </label>
      {children}
      {field.hint && <p className="text-xs text-muted-foreground">{field.hint}</p>}
    </div>
  );
}

function RepeatField({
  field,
  value,
  path,
  setAt,
  onUpload,
  previewOrigin,
}: EditorProps & { field: Extract<FieldSpec, { kind: "repeat" }> }) {
  const items = Array.isArray(value) ? value : [];
  const canAdd = field.max === undefined || items.length < field.max;
  const canRemove = items.length > (field.min ?? 0);

  const set = (next: unknown[]) => setAt(path, next);
  const move = (from: number, to: number) => {
    const next = [...items];
    [next[from], next[to]] = [next[to], next[from]];
    set(next);
  };
  const blank = () =>
    Object.fromEntries(field.fields.map((f) => [f.key, emptyValue(f)]));

  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="text-sm font-medium">{field.label}</p>
        {field.hint && <p className="text-xs text-muted-foreground mt-0.5">{field.hint}</p>}
      </div>

      {items.map((item, i) => {
        const obj = asObject(item);
        return (
          <div key={i} className="flex flex-col gap-3 rounded-lg border border-border p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                {field.itemLabel} {i + 1}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  disabled={i === 0}
                  onClick={() => move(i, i - 1)}
                  aria-label={`Move ${field.itemLabel.toLowerCase()} ${i + 1} up`}
                >
                  <ArrowUp size={14} />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  disabled={i === items.length - 1}
                  onClick={() => move(i, i + 1)}
                  aria-label={`Move ${field.itemLabel.toLowerCase()} ${i + 1} down`}
                >
                  <ArrowDown size={14} />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  disabled={!canRemove}
                  onClick={() => set(items.filter((_, j) => j !== i))}
                  aria-label={`Remove ${field.itemLabel.toLowerCase()} ${i + 1}`}
                  className="text-destructive"
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {field.fields.map((f) => (
                <div
                  key={f.key}
                  className={f.kind === "list" || f.kind === "paragraphs" ? "sm:col-span-2" : ""}
                >
                  <FieldEditor
                    field={f}
                    value={obj[f.key] ?? emptyValue(f)}
                    path={[...path, i, f.key]}
                    setAt={setAt}
                    onUpload={onUpload}
                    previewOrigin={previewOrigin}
                  />
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {canAdd && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="self-start"
          onClick={() => set([...items, blank()])}
        >
          <Plus size={14} />
          Add {field.itemLabel.toLowerCase()}
        </Button>
      )}
    </div>
  );
}

function ImageField({
  field,
  value,
  path,
  setAt,
  onUpload,
  previewOrigin,
}: EditorProps & { field: Extract<FieldSpec, { kind: "image" }> }) {
  const altId = useId();
  const fileId = useId();
  const image = asObject(value);
  const src = typeof image.src === "string" ? image.src : "";
  const alt = typeof image.alt === "string" ? image.alt : "";
  const [uploading, startUpload] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const preview = src.startsWith("/") ? `${previewOrigin}${src}` : src;

  const upload = (file: File) => {
    if (file.size > MAX_IMAGE_BYTES) {
      setError("Image is too large (max 20MB).");
      return;
    }
    setError(null);
    // Counted in the parent, not here: this field unmounts if the owner switches
    // pages mid-upload, and that page's Save must still wait for it.
    onUpload(1);
    startUpload(async () => {
      try {
        const formData = new FormData();
        formData.append("file", file);
        const res = await uploadSiteImageAction(formData).catch(() => ({
          error: "Couldn't reach the server. Check your connection and try again.",
          url: undefined,
        }));
        if (res.error || !res.url) {
          setError(res.error ?? "Upload failed. Please try again.");
          return;
        }
        setAt([...path, "src"], res.url);
      } finally {
        onUpload(-1);
      }
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <span className={labelClass}>{field.label}</span>
      {preview && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={preview}
          alt=""
          className="w-full max-w-xs aspect-[4/3] rounded-lg object-cover bg-muted"
        />
      )}
      <div className="flex items-center gap-3">
        <label
          htmlFor={fileId}
          className={cn(
            "inline-flex h-7 cursor-pointer items-center gap-1 rounded-lg border border-border px-2.5 text-[0.8rem] font-medium hover:bg-muted",
            uploading && "pointer-events-none opacity-50"
          )}
        >
          <ImagePlus size={14} />
          {uploading ? "Uploading..." : "Replace photo"}
        </label>
        <input
          id={fileId}
          type="file"
          accept="image/*,.heic,.heif"
          className="sr-only"
          disabled={uploading}
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) upload(file);
          }}
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {!field.decorative && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor={altId} className="text-xs text-muted-foreground">
            Photo description (for screen readers and search engines)
          </label>
          <input
            id={altId}
            value={alt}
            onChange={(e) => setAt([...path, "alt"], e.target.value)}
            className={fieldClass}
          />
        </div>
      )}
      {field.hint && <p className="text-xs text-muted-foreground">{field.hint}</p>}
    </div>
  );
}
