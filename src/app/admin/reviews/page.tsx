import { getReviews } from "@/lib/actions/reviews";
import AdminReviewsClient from "./AdminReviewsClient";

export default async function AdminReviewsPage() {
  const allReviews = await getReviews();
  return <AdminReviewsClient reviews={allReviews} />;
}
