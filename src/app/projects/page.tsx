import { notFound } from "next/navigation";
import { SHOW_PROJECTS } from "@/config/siteFlags";
import ProjectsClient from "./ProjectsClient";

/**
 * The portfolio is a build-time surface. In a production build the flag is
 * false, this route resolves to the 404 page, and no listing HTML is emitted
 * at all — so hiding it from the navigation is not the only thing stopping a
 * visitor from reaching it by URL.
 */
export default function ProjectsPage() {
  if (!SHOW_PROJECTS) notFound();
  return <ProjectsClient />;
}
