import { redirect } from "next/navigation";

export default function RootPage() {
  // Root always redirects — middleware handles auth, this is a fallback
  redirect("/login");
}
