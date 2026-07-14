"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { LogOut } from "lucide-react";
import { logoutAction } from "@/lib/portal/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PortalDashboard } from "@/components/portal/PortalDashboard";
import { ProjectsPanel } from "@/components/portal/ProjectsPanel";
import type { Project } from "@/lib/portal/projectActions";

type FileEntry = { name: string; size: number; updatedAt: string | null };

const tabs = ["Files", "Projects"] as const;
type Tab = (typeof tabs)[number];

export function PortalTabs({
  files,
  projects,
}: {
  files: FileEntry[];
  projects: Project[];
}) {
  const [tab, setTab] = useState<Tab>("Files");

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
          <form action={logoutAction}>
            <Button type="submit" variant="outline" size="sm">
              <LogOut size={14} />
              Log out
            </Button>
          </form>
        </div>

        <div className="flex gap-1 border-b border-border">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px",
                tab === t
                  ? "border-purple-500 text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === "Files" ? (
          <PortalDashboard files={files} />
        ) : (
          <ProjectsPanel projects={projects} />
        )}
      </motion.div>
    </section>
  );
}
