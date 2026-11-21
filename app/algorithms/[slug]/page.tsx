import { VisualizerView } from "@/components/visualizer/VisualizerView";

export default async function VisualizerPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <VisualizerView slug={slug} />;
}
