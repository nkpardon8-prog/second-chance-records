import { getSwagItems } from "@/lib/actions/shop-swag";
import AdminShopSwagClient from "./AdminShopSwagClient";

export default async function AdminShopSwagPage() {
  const items = await getSwagItems();
  return <AdminShopSwagClient items={items} />;
}
