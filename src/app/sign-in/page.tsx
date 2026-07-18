import { redirect } from "next/navigation";

export default function SignInRedirectPage() {
  // Internal console entry. DevFlow staff sign in here; role-routing forwards
  // each user (DEV / PM / ADMIN) to their correct home after authentication.
  redirect("/dev/sign-in");
}
