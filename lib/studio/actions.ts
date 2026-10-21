"use server";

import { revalidatePath } from "next/cache";
import { destroyStudioSession } from "@/lib/studio/session";

export async function studioSignOutAction() {
  await destroyStudioSession();
  revalidatePath("/studio");
}
