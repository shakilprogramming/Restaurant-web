
import { NextResponse } from "next/server";
import { prisma } from "@/utils/connect";
import { getAuthSession } from "@/utils/auth";
import { parseCategoryInput } from "@/utils/categoryInput";

export const dynamic = "force-dynamic";

export const GET = async () => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { title: "asc" },
    });
    return NextResponse.json(categories);
  } catch (error) {
    console.error("Failed to fetch categories.", error);
    return NextResponse.json(
      { message: "Failed to fetch categories." },
      { status: 500 }
    );
  }
};

export const POST = async (request: Request) => {
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

    const category = await prisma.category.create({ data: categoryInput });
    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "P2002") {
      return NextResponse.json(
        { message: "A category with that title already exists." },
        { status: 409 }
      );
    }
    console.error("Failed to create category.", error);
    return NextResponse.json(
      { message: "Failed to create category." },
      { status: 500 }
    );
  }
};
