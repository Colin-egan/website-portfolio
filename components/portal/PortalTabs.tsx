"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { LogOut } from "lucide-react";
import { logoutAction } from "@/lib/portal/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PortalDashboard } from "@/components/portal/PortalDashboard";
import { ProjectsPanel } from "@/components/portal/ProjectsPanel";
import { TeamPanel } from "@/components/portal/TeamPanel";
import { FEATURE_LABELS, type Feature } from "@/lib/portal/features";
import type { Project } from "@/lib/portal/projectActions";
import type { TeamMember } from "@/lib/portal/teamActions";
import type { TeamPick } from "@/lib/portal/pickActions";
import type { WeeklyPic } from "@/lib/portal/weeklyActions";
import { NewThisWeekPanel } from "@/components/portal/NewThisWeekPanel";
import { PublishButton } from "@/components/portal/PublishButton";

type FileEntry = { name: string; size: number; updatedAt: string | null };

export type PortalData = {
  files: FileEntry[];
  projects: Project[];
  team: TeamMember[];
  publishEnabled: boolean;
  picks: Record<string, TeamPick[]>;
  weeklyPics: WeeklyPic[];
  weeklyVideoUrl: string | null;
};

export function PortalTabs({ features, data }: { features: Feature[]; data: PortalData }) {
  const [tab, setTab] = useState<Feature>(features[0] ?? "files");
  const active = features.includes(tab) ? tab : (features[0] ?? "files");

  const panels: Record<Feature, () => React.ReactNode> = {
    files: () => <PortalDashboard files={data.files} />,
    projects: () => <ProjectsPanel projects={data.projects} />,
    team: () => <TeamPanel members={data.team} variant="team" />,
    crew: () => <TeamPanel members={data.team} variant="crew" picks={data.picks} />,
    new_this_week: () => (
      <NewThisWeekPanel pics={data.weeklyPics} videoUrl={data.weeklyVideoUrl} />
    ),
  };

  return (
    <section className="max-w-3xl mx-auto px-6 py-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col gap-6"
      >
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-display font-bold">Client Portal</h1>
          <div className="flex items-start gap-2">
            {data.publishEnabled && <PublishButton />}
            <form action={logoutAction}>
              <Button type="submit" variant="outline" size="sm">
                <LogOut size={14} />
                Log out
              </Button>
            </form>
          </div>
        </div>

        <div className="flex gap-1 border-b border-border">
          {features.map((f) => (
            <button
              key={f}
              onClick={() => setTab(f)}
              className={cn(
                "px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px",
                active === f
                  ? "border-purple-500 text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {FEATURE_LABELS[f]}
            </button>
          ))}
        </div>

        {panels[active]()}
      </motion.div>
    </section>
  );
}
