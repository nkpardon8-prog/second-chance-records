import { getSubmissions } from "@/lib/actions/contact";
import AdminContactClient from "./AdminContactClient";

export default async function AdminContactSubmissionsPage() {
  const submissions = await getSubmissions();
  return <AdminContactClient submissions={submissions} />;
}
