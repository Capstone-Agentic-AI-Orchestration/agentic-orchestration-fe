import { PMRepositoriesView } from "@/features/pm/repositories/views/pm-repositories-view";

/**
 * Repository provisioning is the PM's side of the delivery split: they decide where a
 * client's code lives and who may push to it, while the developer owns prompting and the
 * build itself.
 */
export default function PMRepositoriesPage() {
  return <PMRepositoriesView />;
}
