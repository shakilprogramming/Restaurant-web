export type CategoryInput = {
  title: string;
  desc: string;
  color: string;
  img: string;
  slug: string;
};

export const parseCategoryInput = (value: unknown): CategoryInput | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  const input = value as Record<string, unknown>;
  if (
    typeof input.title !== "string" ||
    typeof input.desc !== "string" ||
    typeof input.color !== "string" ||
    typeof input.img !== "string"
  ) {
    return null;
  }

  const title = input.title.trim();
  const desc = input.desc.trim();
  const color = input.color.trim();
  const img = input.img.trim();
  const slug = title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  if (
    !title ||
    title.length > 100 ||
    !desc ||
    desc.length > 2000 ||
    !color ||
    color.length > 64 ||
    img.length > 2000 ||
    !slug
  ) {
    return null;
  }

  return { title, desc, color, img, slug };
};
