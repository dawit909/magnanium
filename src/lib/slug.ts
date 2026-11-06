import { isValidPersonId } from "./negative-cache";

export function createPersonSlug(id: number, name: string): string {
  const cleanName = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return cleanName ? `${id}-${cleanName}` : `${id}`;
}

export function parsePersonIdFromSlug(slug: string): number | null {
  const match = slug.match(/^(\d+)(?:-|$)/);
  if (!match) return null;
  const id = parseInt(match[1], 10);
  if (isNaN(id) || !isValidPersonId(id)) return null;
  return id;
}
