import { redirect } from "next/navigation";

/**
 * Repositories is no longer a console-wide destination. Provisioning a repo and granting a
 * developer push access are statements about one project, so they live in that project's
 * Repository section. Old links land on the project list, which is the way in.
 */
export default function PMRepositoriesPage() {
  redirect("/pm/projects");
}
