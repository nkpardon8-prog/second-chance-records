import { getNews } from "@/lib/actions/news";
import AdminNewsClient from "./AdminNewsClient";

export default async function AdminNewsPage() {
  const allNews = await getNews();
  return <AdminNewsClient news={allNews} />;
}
