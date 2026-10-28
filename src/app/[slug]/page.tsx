import { notFound } from "next/navigation";
import { getPersonDetails } from "@/lib/tmdb";
import { parsePersonIdFromSlug } from "@/lib/slug";
import FeedApp from "@/components/FeedApp";
import type { Metadata } from "next";

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await props.params;
  const personId = parsePersonIdFromSlug(slug);

  if (!personId) {
    return { title: "Magnanium" };
  }

  const person = await getPersonDetails(personId);
  if (!person || !person.name) {
    return { title: "Magnanium" };
  }

  return {
    title: `${person.name} - Magnanium`,
    description: `Movie release RSS feed for ${person.name}.`,
  };
}

export default async function PersonPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;
  const personId = parsePersonIdFromSlug(slug);

  if (!personId) {
    notFound();
  }

  const person = await getPersonDetails(personId);
  if (!person || !person.name) {
    notFound();
  }

  const initialPerson = {
    id: person.id,
    name: person.name,
    original_name: person.original_name || person.name,
    known_for_department: person.known_for_department || "Directing",
    profile_path: person.profile_path || null,
    popularity: person.popularity || 0,
  };

  return <FeedApp initialPerson={initialPerson} />;
}
