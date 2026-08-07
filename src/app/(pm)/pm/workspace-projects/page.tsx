import { redirect } from "next/navigation";

/**
 * There used to be two project lists — /pm/projects behind a KPI dashboard called "Home", and
 * this one. They are one list now, at the obvious URL.
 */
export default function PMWorkspaceProjectsPage() {
  redirect("/pm/projects");
}
