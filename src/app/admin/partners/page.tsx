import { getPartners } from "@/lib/actions/partners";
import AdminPartnersClient from "./AdminPartnersClient";

export default async function AdminPartnersPage() {
  const allPartners = await getPartners();
  return <AdminPartnersClient partners={allPartners} />;
}
