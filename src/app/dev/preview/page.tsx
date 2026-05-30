import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PreviewClient } from "./PreviewClient";

export const metadata: Metadata = {
  title: "Dashboard preview (dev)",
  robots: { index: false, follow: false },
};

/**
 * Dev-only visual harness for the redesigned dashboard. Renders the real shell
 * and pages against fabricated fixtures so the UI can be iterated locally with
 * zero auth and zero real data. Returns 404 in production.
 */
export default function DevPreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <PreviewClient />;
}
