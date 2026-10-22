import { getAuthSession } from "@/utils/auth";
import { prisma } from "@/utils/connect";
import { NextResponse } from "next/server";

type RouteContext = {
  params: { id: string };
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
