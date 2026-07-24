import { redirect } from "next/navigation";

export default function DevRepositoriesPage() {
  redirect("/dev/groups?view=repositories");
}
