import { getPressMentions } from "@/lib/actions/press-mentions";
import AdminPressMentionsClient from "./AdminPressMentionsClient";

export default async function AdminPressMentionsPage() {
  const all = await getPressMentions();
  return <AdminPressMentionsClient pressMentions={all} />;
}
