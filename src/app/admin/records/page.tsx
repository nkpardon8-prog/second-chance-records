import { getFeaturedRecords } from "@/lib/actions/records";
import AdminRecordsClient from "./AdminRecordsClient";

export default async function AdminRecordsPage() {
  const allRecords = await getFeaturedRecords();
  return <AdminRecordsClient records={allRecords} />;
}
