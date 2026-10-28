import { redirect } from "next/navigation";

// /meter-reading → redirect to /technician (unified form)
export default function MeterReadingRedirectPage() {
  redirect("/technician");
}
