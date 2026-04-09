import { getEvents } from "@/lib/actions/events";
import AdminEventsClient from "./AdminEventsClient";

export default async function AdminEventsPage() {
  const allEvents = await getEvents();
  return <AdminEventsClient events={allEvents} />;
}
