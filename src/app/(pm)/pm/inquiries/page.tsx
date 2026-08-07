import { redirect } from "next/navigation";

/** Inquiries is a section of Clients now. Old links, bookmarks and emails still land right. */
export default function PMInquiriesPage() {
  redirect("/pm/clients?tab=inquiries");
}
