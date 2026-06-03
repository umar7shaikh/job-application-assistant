import "server-only";
import { renderToBuffer } from "@react-pdf/renderer";
import { getDocumentProxy } from "unpdf";
import type { MasterProfile } from "@builder/shared";
import { resumeElement } from "./resume-doc";

// How far we'll shrink before giving up. ~0.6 keeps ~6pt body text — small but
// still legible; below that a resume stops looking organized, so we don't.
const MIN_SCALE = 0.6;
const MAX_ITERS = 6;

async function render(profile: MasterProfile, scale: number): Promise<Buffer> {
  return renderToBuffer(resumeElement(profile, scale));
}

async function pageCount(buf: Buffer): Promise<number> {
  const pdf = await getDocumentProxy(new Uint8Array(buf));
  return pdf.numPages;
}

/**
 * Render a resume PDF, optionally scaled to fit within `pageTarget` pages.
 *
 * pageTarget 0 = auto: render at full size and let it flow naturally.
 * pageTarget N>=1 = fit WITHIN N pages: if it already fits we leave it alone
 * (never blow text up to fill space); otherwise we binary-search the largest
 * uniform scale that keeps it to N pages, so it shrinks cleanly instead of
 * overflowing. If even the minimum scale can't reach N, we return the smallest
 * (best effort) — the preview then shows the honest result.
 */
export async function renderResumePdf(
  profile: MasterProfile,
  pageTarget: number
): Promise<Buffer> {
  if (!pageTarget || pageTarget < 1) {
    return render(profile, 1);
  }

  const full = await render(profile, 1);
  if ((await pageCount(full)) <= pageTarget) return full;

  let lo = MIN_SCALE;
  let hi = 1;
  let best: Buffer | null = null;

  for (let i = 0; i < MAX_ITERS; i++) {
    const mid = (lo + hi) / 2;
    const buf = await render(profile, mid);
    if ((await pageCount(buf)) <= pageTarget) {
      best = buf; // fits — try to grow back toward readable
      lo = mid;
    } else {
      hi = mid; // too big — shrink more
    }
  }

  return best ?? render(profile, MIN_SCALE);
}
