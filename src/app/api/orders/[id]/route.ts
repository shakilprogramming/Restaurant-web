import { getAuthSession } from "@/utils/auth";
import { prisma } from "@/utils/connect";
import { NextRequest, NextResponse } from "next/server";

export const PUT = async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const session = await getAuthSession();
  if (!session?.user.isAdmin) {
    return NextResponse.json({ message: "You are not allowed." }, { status: 403 });
  }

  try {
    const body: unknown = await request.json();
    const status =
      typeof body === "string"
        ? body
        : body && typeof body === "object" && "status" in body
          ? body.status
          : undefined;

    if (typeof status !== "string" || !status.trim()) {
      return NextResponse.json(
        { message: "A valid order status is required." },
        { status: 400 }
      );
    }

    const order = await prisma.order.update({
      where: { id: params.id },
      data: { status: status.trim() },
    });
    return NextResponse.json(order);
  } catch (error) {
    console.error("Failed to update order.", error);
    return NextResponse.json(
      { message: "Failed to update order." },
      { status: 500 }
    );
  }
};
