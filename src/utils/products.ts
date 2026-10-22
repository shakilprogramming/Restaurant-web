import { ProductType } from "@/types/types";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);

type ProductRecord = {
  id: string;
  title: string;
  desc: string;
  img: string | null;
  price: unknown;
  options: unknown[];
};

export const toProductType = (product: ProductRecord): ProductType => ({
  id: product.id,
  title: product.title,
  desc: product.desc,
  img: product.img ?? undefined,
  price: Number(product.price),
  options: product.options.flatMap((option) => {
    if (!isRecord(option)) {
      return [];
    }

    const title = option["title"];
    const additionalPrice = option["additionalPrice"];

    return typeof title === "string" && typeof additionalPrice === "number"
      ? [{ title, additionalPrice }]
      : [];
  }),
});
