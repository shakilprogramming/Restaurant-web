import { getAuthSession } from "@/utils/auth";
import { prisma } from "@/utils/connect";
import { NextResponse } from "next/server";

type RouteContext = {
  params: { id: string };
};

type ProductOption = {
  title: string;
  additionalPrice: number;
};

const parseProductInput = (value: unknown) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  const input = value as Record<string, unknown>;
  if (
    typeof input.title !== "string" ||
    !input.title.trim() ||
    input.title.trim().length > 160 ||
    typeof input.desc !== "string" ||
    !input.desc.trim() ||
    input.desc.trim().length > 4000 ||
    typeof input.price !== "number" ||
    !Number.isFinite(input.price) ||
    input.price <= 0 ||
    typeof input.catSlug !== "string" ||
    !input.catSlug.trim() ||
    (input.img !== null && typeof input.img !== "string") ||
    (typeof input.img === "string" && input.img.length > 2000) ||
    typeof input.isFeatured !== "boolean" ||
    !Array.isArray(input.options)
  ) {
    return null;
  }

  const options: ProductOption[] = [];
  for (const option of input.options) {
    if (
      !option ||
      typeof option !== "object" ||
      !("title" in option) ||
      !("additionalPrice" in option) ||
      typeof option.title !== "string" ||
      !option.title.trim() ||
      option.title.trim().length > 100 ||
      typeof option.additionalPrice !== "number" ||
      !Number.isFinite(option.additionalPrice) ||
      option.additionalPrice < 0
    ) {
      return null;
    }
    options.push({
      title: option.title.trim(),
      additionalPrice: option.additionalPrice,
    });
  }

  if (new Set(options.map((option) => option.title.toLowerCase())).size !== options.length) {
    return null;
  }

  return {
    title: input.title.trim(),
    desc: input.desc.trim(),
    price: input.price,
    catSlug: input.catSlug.trim(),
    img: typeof input.img === "string" ? input.img.trim() || null : null,
    isFeatured: input.isFeatured,
    options,
  };
};

export const GET = async (_request: Request, { params }: RouteContext) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: params.id },
    });

    if (!product) {
      return NextResponse.json({ message: "Product not found." }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error("Failed to fetch product.", error);
    return NextResponse.json(
      { message: "Failed to fetch product." },
      { status: 500 }
    );
  }
};

export const PUT = async (request: Request, { params }: RouteContext) => {
  const session = await getAuthSession();
  if (!session?.user.isAdmin) {
    return NextResponse.json({ message: "You are not allowed." }, { status: 403 });
  }

  try {
    const productInput = parseProductInput(await request.json());
    if (!productInput) {
      return NextResponse.json(
        { message: "Enter valid menu item details, price, category, and options." },
        { status: 400 }
      );
    }

    const category = await prisma.category.findUnique({
      where: { slug: productInput.catSlug },
      select: { slug: true },
    });
    if (!category) {
      return NextResponse.json(
        { message: "The selected category no longer exists. Choose another category." },
        { status: 400 }
      );
    }

    const product = await prisma.product.update({
      where: { id: params.id },
      data: {
        ...productInput,
        catSlug: category.slug,
      },
    });
    return NextResponse.json(product);
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "P2025") {
      return NextResponse.json({ message: "Menu item not found." }, { status: 404 });
    }
    console.error("Failed to update product.", error);
    return NextResponse.json(
      { message: "Failed to update menu item." },
      { status: 500 }
    );
  }
};

export const DELETE = async (_request: Request, { params }: RouteContext) => {
  const session = await getAuthSession();

  if (!session?.user.isAdmin) {
    return NextResponse.json({ message: "You are not allowed." }, { status: 403 });
  }

  try {
    await prisma.product.delete({ where: { id: params.id } });
    return NextResponse.json({ message: "Product has been deleted." });
  } catch (error) {
    console.error("Failed to delete product.", error);
    return NextResponse.json(
      { message: "Failed to delete product." },
      { status: 500 }
    );
  }
};
