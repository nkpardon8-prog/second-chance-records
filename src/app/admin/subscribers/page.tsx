import { getSubscribers } from "@/lib/actions/subscribers";
import AdminSubscribersClient from "./AdminSubscribersClient";

export default async function AdminSubscribersPage() {
  const allSubscribers = await getSubscribers();
  return <AdminSubscribersClient subscribers={allSubscribers} />;
}
