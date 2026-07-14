import type { Metadata } from "next";
import { Footer } from "@/components/layout/Footer";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getSession } from "@/lib/portal/session";
import { listProjects, canPublish } from "@/lib/portal/projectActions";
import { PortalLogin } from "@/components/portal/PortalLogin";
import { PortalTabs } from "@/components/portal/PortalTabs";

export const metadata: Metadata = {
  title: "Client Portal",
  description: "Upload and manage files for your website project.",
};

const BUCKET = "client-files";

export default async function PortalPage() {
  const session = await getSession();

  let files: { name: string; size: number; updatedAt: string | null }[] = [];
  let projects: Awaited<ReturnType<typeof listProjects>> = [];
  let publishEnabled = false;

  if (session) {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase.storage
      .from(BUCKET)
      .list(session.clientId, { sortBy: { column: "created_at", order: "desc" } });

    files = (data ?? []).map((f) => ({
      name: f.name,
      size: f.metadata?.size ?? 0,
      updatedAt: f.updated_at ?? null,
    }));

    projects = await listProjects();
    publishEnabled = await canPublish();
  }

  return (
    <>
      <div className="pt-28" />
      {session ? (
        <PortalTabs files={files} projects={projects} publishEnabled={publishEnabled} />
      ) : (
        <PortalLogin />
      )}
      <Footer />
    </>
  );
}
