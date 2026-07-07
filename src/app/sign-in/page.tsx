import { redirect } from "next/navigation";

export default function SignInRedirectPage() {
  redirect("/client/sign-in");
}
