import { redirect } from "next/navigation";

/**
 * Internal console root.
 *
 * This deployment is the private DevFlow console (dev / pm / admin). It has no
 * public landing page — visiting the root sends you straight to sign-in. The
 * public marketing + client experience lives in the separate Alphaexplora
 * client app.
 */
export default function ConsoleRootPage() {
  redirect("/sign-in");
}
