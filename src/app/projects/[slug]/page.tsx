import { notFound } from "next/navigation";
import { PROJECTS } from "@/data/projects";
import { SHOW_PROJECTS } from "@/config/siteFlags";
import ProjectDetailClient from "./ProjectDetailClient";

/**
 * The params list stays complete even while the portfolio is private: with
 * `output: export`, a dynamic route that yields no params fails the build
 * outright. The page below is what refuses the request — each path is emitted
 * as the 404 page instead of a case study.
 */
export function generateStaticParams() {
  return PROJECTS.map((p) => ({ slug: p.slug }));
}

type Props = { params: Promise<{ slug: string }> };

export default async function Page({ params }: Props) {
  if (!SHOW_PROJECTS) notFound();
  const { slug } = await params;
  return <ProjectDetailClient slug={slug} />;
}
