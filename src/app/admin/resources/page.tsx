import { getResources } from "@/lib/actions/resources";
import AdminResourcesClient from "./AdminResourcesClient";

export default async function AdminResourcesPage() {
  const allResources = await getResources();
  return <AdminResourcesClient resources={allResources} />;
}
