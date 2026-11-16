import FeedApp from "@/components/FeedApp";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Feeds - Magnanium",
  description: "Manage your followed artist release feeds and alert preferences.",
};

export default function FeedsPage() {
  return <FeedApp mode="feeds" />;
}
