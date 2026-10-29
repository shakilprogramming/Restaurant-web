import { getAuthSession } from "@/utils/auth";
import { prisma } from "@/utils/connect";
import { parseCategoryInput } from "@/utils/categoryInput";
import { NextResponse } from "next/server";

type RouteContext = {
  params: { slug: string };
};

export const PUT = async (request: Request, { params }: RouteContext) => {
  const session = await getAuthSession();
  if (!session?.user.isAdmin) {
    return NextResponse.json({ message: "You are not allowed." }, { status: 403 });
  }

  try {
    const categoryInput = parseCategoryInput(await request.json());
    if (!categoryInput) {
      return NextResponse.json(
        { message: "Enter a valid title, description, color, and image URL." },
        { status: 400 }
      );
    }

    const category = await prisma.category.update({
      where: { slug: params.slug },
      data: categoryInput,
    });
    return NextResponse.json(category);
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "P2002") {
      return NextResponse.json(
        { message: "A category with that title already exists." },
        { status: 409 }
      );
    }
    if (error instanceof Error && "code" in error && error.code === "P2025") {
      return NextResponse.json({ message: "Category not found." }, { status: 404 });
    }
    console.error("Failed to update category.", error);
    return NextResponse.json(
      { message: "Failed to update category." },
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
    const category = await prisma.category.findUnique({
      where: { slug: params.slug },
      select: { _count: { select: { products: true } } },
    });
    if (!category) {
      return NextResponse.json({ message: "Category not found." }, { status: 404 });
    }
    if (category._count.products > 0) {
      return NextResponse.json(
        { message: "Delete this category's menu items before deleting it." },
        { status: 409 }
      );
    }

    await prisma.category.delete({ where: { slug: params.slug } });
    return NextResponse.json({ message: "Category deleted." });
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "P2003") {
      return NextResponse.json(
        { message: "Delete this category's menu items before deleting it." },
        { status: 409 }
      );
    }
    console.error("Failed to delete category.", error);
    return NextResponse.json(
      { message: "Failed to delete category." },
      { status: 500 }
    );
  }
};
