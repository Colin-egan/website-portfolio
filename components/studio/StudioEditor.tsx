"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { ArrowDown, ArrowUp, Eye, EyeOff, ExternalLink, GripVertical, RotateCcw, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  COLOR_KEYS,
  COLOR_LABELS,
  RADIUS_MAX,
  SPACINGS,
  describeChanges,
  type ColorKey,
  type Design,
} from "@/lib/studio/design";
import { publishDesignAction } from "@/lib/studio/actions";
import type { StudioSite } from "@/lib/studio/sites";

const HEX = /^#[0-9a-fA-F]{6}$/;
const sectionLabel = (id: string) => id.charAt(0).toUpperCase() + id.slice(1).replace(/-/g, " ");

type Preview = { state: "connecting" } | { state: "live" } | { state: "rejected"; error: string };
type Notice = { kind: "success"; commitUrl: string } | { kind: "error"; error: string; conflict?: boolean };

export function StudioEditor({
  site,
  initialDesign,
  initialSha,
  fonts,
}: {
  site: StudioSite;
  initialDesign: Design;
  initialSha: string;
  fonts: string[];
}) {
  const [design, setDesign] = useState(initialDesign);
  const [saved, setSaved] = useState(initialDesign);
  const [sha, setSha] = useState(initialSha);
  const [preview, setPreview] = useState<Preview>({ state: "connecting" });
  const [notice, setNotice] = useState<Notice | null>(null);
  const [pending, startTransition] = useTransition();
  const frameRef = useRef<HTMLIFrameElement>(null);
  const designRef = useRef(design);
  const siteOrigin = new URL(site.url).origin;

  const changes = describeChanges(saved, design);
  const dirty = changes.length > 0;

  // Only the framed site, from its own origin, is listened to.
  useEffect(() => {
    function send(next: Design) {
      frameRef.current?.contentWindow?.postMessage({ type: "studio:design", design: next }, siteOrigin);
    }

    function onMessage(event: MessageEvent) {
      if (event.origin !== siteOrigin || event.source !== frameRef.current?.contentWindow) return;
      const data = event.data as { type?: string; sections?: unknown; error?: unknown } | null;

      if (data?.type === "studio:ready") {
        // Sections the site has in code but design.json doesn't list yet show at the end,
        // exactly as the site renders them.
        const known = Array.isArray(data.sections)
          ? data.sections.filter((id): id is string => typeof id === "string")
          : [];
        const missing = known.filter((id) => !designRef.current.sections.some((s) => s.id === id));
        if (missing.length > 0) {
          const next = {
            ...designRef.current,
            sections: [...designRef.current.sections, ...missing.map((id) => ({ id, visible: true }))],
          };
          designRef.current = next;
          setDesign(next);
        }
        setPreview({ state: "live" });
        send(designRef.current);
      } else if (data?.type === "studio:error") {
        setPreview({ state: "rejected", error: typeof data.error === "string" ? data.error : "Invalid design." });
      }
    }

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [siteOrigin]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function update(next: Design) {
    designRef.current = next;
    setDesign(next);
    setNotice(null);
    if (preview.state !== "connecting") {
      setPreview({ state: "live" });
      frameRef.current?.contentWindow?.postMessage({ type: "studio:design", design: next }, siteOrigin);
    }
  }

  const setTheme = (patch: Partial<Design["theme"]>) =>
    update({ ...design, theme: { ...design.theme, ...patch } });

  const setColor = (key: ColorKey, value: string) =>
    setTheme({ colors: { ...design.theme.colors, [key]: value.toUpperCase() } });

  function moveSection(from: number, to: number) {
    if (to < 0 || to >= design.sections.length || from === to) return;
    const sections = [...design.sections];
    const [moved] = sections.splice(from, 1);
    sections.splice(to, 0, moved);
    update({ ...design, sections });
  }

  function toggleSection(index: number) {
    const sections = design.sections.map((s, i) => (i === index ? { ...s, visible: !s.visible } : s));
    update({ ...design, sections });
  }

  function publish() {
    startTransition(async () => {
      const result = await publishDesignAction(site.slug, sha, design);
      if (result.ok) {
        setSaved(design);
        setSha(result.sha);
        setNotice({ kind: "success", commitUrl: result.commitUrl });
      } else {
        setNotice({ kind: "error", error: result.error, conflict: result.conflict });
      }
    });
  }

  const canPublish = dirty && preview.state === "live" && !pending;

  return (
    <div className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
      <aside className="flex flex-col gap-6 lg:max-h-[calc(100vh-9rem)] lg:overflow-y-auto lg:pr-2">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-display font-bold">{site.name}</h1>
          <a
            href={`https://github.com/${site.repo}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground w-fit"
          >
            {site.repo}
            <ExternalLink size={12} />
          </a>
        </div>

        <Panel title="Colors">
          {COLOR_KEYS.map((key) => (
            <ColorField
              key={key}
              label={COLOR_LABELS[key]}
              value={design.theme.colors[key]}
              onChange={(v) => setColor(key, v)}
            />
          ))}
        </Panel>

        <Panel title="Fonts">
          {(["heading", "body"] as const).map((role) => (
            <label key={role} className="flex items-center justify-between gap-3 text-sm">
              <span className="text-muted-foreground">{role === "heading" ? "Headings" : "Body"}</span>
              <select
                value={design.theme.fonts[role]}
                onChange={(e) => setTheme({ fonts: { ...design.theme.fonts, [role]: e.target.value } })}
                className="h-8 w-44 rounded-lg border border-border bg-background px-2 text-sm"
              >
                {fonts.map((font) => (
                  <option key={font} value={font}>
                    {font}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </Panel>

        <Panel title="Shape & spacing">
          <label className="flex flex-col gap-2 text-sm">
            <span className="flex justify-between text-muted-foreground">
              Corner radius <span className="tabular-nums text-foreground">{design.theme.radius}px</span>
            </span>
            <input
              type="range"
              min={0}
              max={RADIUS_MAX}
              value={design.theme.radius}
              onChange={(e) => setTheme({ radius: Number(e.target.value) })}
              className="accent-purple-500"
            />
          </label>
          <div className="flex flex-col gap-2 text-sm">
            <span className="text-muted-foreground">Section spacing</span>
            <div className="grid grid-cols-3 gap-1 rounded-lg border border-border p-1">
              {SPACINGS.map((spacing) => (
                <button
                  key={spacing}
                  type="button"
                  onClick={() => setTheme({ spacing })}
                  aria-pressed={design.theme.spacing === spacing}
                  className={cn(
                    "rounded-md py-1 capitalize transition-colors",
                    design.theme.spacing === spacing
                      ? "bg-purple-600 text-white"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {spacing}
                </button>
              ))}
            </div>
          </div>
        </Panel>

        <Panel title="Sections" hint="Drag to reorder. The eye shows or hides a section.">
          <SectionList
            sections={design.sections}
            onMove={moveSection}
            onToggle={toggleSection}
          />
        </Panel>

        <div className="flex flex-col gap-3 border-t border-border pt-4 lg:sticky lg:bottom-0 lg:bg-background lg:pb-2">
          {dirty ? (
            <ul className="text-xs text-muted-foreground list-disc pl-4 flex flex-col gap-0.5">
              {changes.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted-foreground">No unpublished changes.</p>
          )}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={!dirty || pending}
              onClick={() => update(saved)}
            >
              <RotateCcw size={14} />
              Reset
            </Button>
            <Button type="button" className="flex-1" disabled={!canPublish} onClick={publish}>
              <Upload size={14} />
              {pending ? "Publishing…" : "Publish to GitHub"}
            </Button>
          </div>
          {preview.state === "connecting" && (
            <p className="text-xs text-muted-foreground">
              Waiting for the preview to connect. Publishing unlocks once the site confirms it can
              show your changes.
            </p>
          )}
          {preview.state === "rejected" && (
            <p className="text-xs text-destructive">The site rejected this design: {preview.error}</p>
          )}
          {notice?.kind === "success" &&
            (notice.commitUrl ? (
              <p className="text-xs text-muted-foreground">
                Committed to main.{" "}
                <a href={notice.commitUrl} target="_blank" rel="noreferrer" className="underline">
                  View commit
                </a>{" "}
                The live site updates once Vercel finishes deploying, usually within a minute or two.
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Saved to design.json on disk (local test mode, nothing sent to GitHub).
              </p>
            ))}
          {notice?.kind === "error" && (
            <div className="flex flex-col gap-2">
              <p className="text-xs text-destructive">{notice.error}</p>
              {notice.conflict && (
                <Button type="button" variant="outline" size="sm" onClick={() => window.location.reload()}>
                  Reload latest
                </Button>
              )}
            </div>
          )}
        </div>
      </aside>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Preview of{" "}
            <a href={site.url} target="_blank" rel="noreferrer" className="underline">
              {site.url.replace(/^https?:\/\//, "")}
            </a>{" "}
            · only you see unpublished changes
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span
              className={cn(
                "size-2 rounded-full",
                preview.state === "live" ? "bg-emerald-500" : preview.state === "rejected" ? "bg-destructive" : "bg-amber-400"
              )}
            />
            {preview.state === "live" ? "Live preview" : preview.state === "rejected" ? "Rejected" : "Connecting"}
          </span>
        </div>
        <iframe
          ref={frameRef}
          src={site.url}
          title={`Preview of ${site.name}`}
          className="h-[70vh] w-full rounded-xl border border-border bg-white lg:h-[calc(100vh-11rem)]"
        />
      </div>
    </div>
  );
}

function Panel({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="text-sm font-semibold">{title}</h2>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  // Follow outside changes (Reset) while letting a half-typed hex stay on screen.
  const [lastValue, setLastValue] = useState(value);
  if (value !== lastValue) {
    setLastValue(value);
    setDraft(value);
  }

  return (
    <label className="flex items-center justify-between gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="flex items-center gap-2">
        <input
          type="color"
          value={value.toLowerCase()}
          onChange={(e) => onChange(e.target.value)}
          className="size-8 cursor-pointer rounded-md border border-border bg-transparent p-0.5"
          aria-label={`${label} color picker`}
        />
        <input
          type="text"
          value={draft}
          onChange={(e) => {
            const next = e.target.value.trim();
            setDraft(next);
            if (HEX.test(next)) onChange(next);
          }}
          onBlur={() => setDraft(value)}
          spellCheck={false}
          className="h-8 w-24 rounded-lg border border-border bg-background px-2 font-mono text-xs uppercase"
          aria-label={`${label} hex value`}
        />
      </span>
    </label>
  );
}

function SectionList({
  sections,
  onMove,
  onToggle,
}: {
  sections: Design["sections"];
  onMove: (from: number, to: number) => void;
  onToggle: (index: number) => void;
}) {
  const [dragging, setDragging] = useState<number | null>(null);
  const [over, setOver] = useState<number | null>(null);

  return (
    <ul className="flex flex-col gap-1">
      {sections.map((section, index) => (
        <li
          key={section.id}
          draggable
          onDragStart={(e) => {
            setDragging(index);
            e.dataTransfer.effectAllowed = "move";
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setOver(index);
          }}
          onDrop={(e) => {
            e.preventDefault();
            if (dragging !== null) onMove(dragging, index);
            setDragging(null);
            setOver(null);
          }}
          onDragEnd={() => {
            setDragging(null);
            setOver(null);
          }}
          className={cn(
            "flex items-center gap-2 rounded-lg border border-border bg-background px-2 py-1.5 text-sm",
            dragging === index && "opacity-50",
            over === index && dragging !== null && dragging !== index && "border-purple-500",
            !section.visible && "text-muted-foreground"
          )}
        >
          <GripVertical size={14} className="cursor-grab text-muted-foreground shrink-0" />
          <span className={cn("flex-1 truncate", !section.visible && "line-through")}>
            {sectionLabel(section.id)}
          </span>
          <IconButton label={`Move ${section.id} up`} disabled={index === 0} onClick={() => onMove(index, index - 1)}>
            <ArrowUp size={14} />
          </IconButton>
          <IconButton
            label={`Move ${section.id} down`}
            disabled={index === sections.length - 1}
            onClick={() => onMove(index, index + 1)}
          >
            <ArrowDown size={14} />
          </IconButton>
          <IconButton label={section.visible ? `Hide ${section.id}` : `Show ${section.id}`} onClick={() => onToggle(index)}>
            {section.visible ? <Eye size={14} /> : <EyeOff size={14} />}
          </IconButton>
        </li>
      ))}
    </ul>
  );
}

function IconButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="inline-flex size-7 items-center justify-center rounded-md hover:bg-muted disabled:opacity-30 disabled:pointer-events-none"
    >
      {children}
    </button>
  );
}
