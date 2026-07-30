import type { Metadata } from "next";
import { Footer } from "@/components/layout/Footer";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getSession } from "@/lib/portal/session";
import { getClientFeatures } from "@/lib/portal/client";
import { listProjects, canPublish } from "@/lib/portal/projectActions";
import { listTeamMembers } from "@/lib/portal/teamActions";
import { PortalLogin } from "@/components/portal/PortalLogin";
import { PortalTabs, type PortalData } from "@/components/portal/PortalTabs";

export const metadata: Metadata = {
  title: "Client Portal",
  description: "Upload and manage files for your website project.",
};

const BUCKET = "client-files";

export default async function PortalPage() {
  const session = await getSession();

  if (!session) {
    return (
      <>
        <div className="pt-28" />
        <PortalLogin />
        <Footer />
      </>
    );
  }

  const features = await getClientFeatures();
  const supabase = getSupabaseAdmin();

  // Only load what this client's flags call for — Memory Lane never queries
  // projects, and Mission Properties never queries the weekly tables.
  const [files, projects, team, publishEnabled] = await Promise.all([
    features.includes("files")
      ? supabase.storage
          .from(BUCKET)
          .list(session.clientId, { sortBy: { column: "created_at", order: "desc" } })
          .then(({ data }) =>
            (data ?? []).map((f) => ({
              name: f.name,
              size: f.metadata?.size ?? 0,
              updatedAt: f.updated_at ?? null,
            }))
          )
      : Promise.resolve([]),
    features.includes("projects") ? listProjects() : Promise.resolve([]),
    features.includes("team") || features.includes("crew")
      ? listTeamMembers()
      : Promise.resolve([]),
    features.includes("projects") ? canPublish() : Promise.resolve(false),
  ]);

  const data: PortalData = { files, projects, team, publishEnabled };

  return (
    <>
      <div className="pt-28" />
      <PortalTabs features={features} data={data} />
      <Footer />
    </>
  );
}
