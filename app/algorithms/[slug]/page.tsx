import { notFound } from "next/navigation";
import { VisualizerView } from "@/components/visualizer/VisualizerView";
import { algorithms, algorithmsBySlug } from "@/lib/algorithms";

// Only implemented algorithms have pages (prerendered); anything else
// (typos, roadmap items) hits notFound() below and gets a clean 404.
export function generateStaticParams() {
  return algorithms.map((a) => ({ slug: a.slug }));
}

export default async function VisualizerPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!algorithmsBySlug[slug]) notFound();
  return <VisualizerView slug={slug} />;
}
