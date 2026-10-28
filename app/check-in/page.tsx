import { redirect } from "next/navigation";

// /check-in → redirect to /technician (unified form)
export default function CheckInRedirectPage() {
  redirect("/technician");
}
