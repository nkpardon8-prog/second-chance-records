import { getInstagramPosts } from "@/lib/actions/instagram";
import AdminInstagramClient from "./AdminInstagramClient";

export default async function AdminInstagramPage() {
  const posts = await getInstagramPosts();
  return <AdminInstagramClient posts={posts} />;
}
