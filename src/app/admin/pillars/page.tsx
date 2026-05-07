import { getPillars } from "@/lib/actions/pillars";
import AdminPillarsClient from "./AdminPillarsClient";

export default async function AdminPillarsPage() {
  const allPillars = await getPillars();
  return <AdminPillarsClient pillars={allPillars} />;
}
