/**
 * Local test mode for the studio: `STUDIO_DEV_BYPASS=1 npm run dev`.
 *
 * Skips the portal and GitHub sign-ins, and with STUDIO_DEV_DESIGN_FILE set, reads
 * and writes a design.json on disk instead of committing to GitHub. Only `next dev`
 * runs with NODE_ENV=development, so a production build ignores the flag entirely.
 */
export function studioDevMode(): boolean {
  return process.env.NODE_ENV === "development" && process.env.STUDIO_DEV_BYPASS === "1";
}
