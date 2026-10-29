import { getAuthSession } from "@/utils/auth";
import { prisma } from "@/utils/connect";
import { NextResponse } from "next/server";

type RouteContext = {
  params: { id: string };
};

export const PATCH = async (request: Request, { params }: RouteContext) => {
  const session = await getAuthSession();
  if (!session?.user.isAdmin) {
    return NextResponse.json({ message: "You are not allowed." }, { status: 403 });
  }

  try {
    const body: unknown = await request.json();
    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body) ||
      !("name" in body) ||
      (body.name !== null && typeof body.name !== "string") ||
      (typeof body.name === "string" && body.name.trim().length > 120)
    ) {
      return NextResponse.json(
        { message: "Enter a customer name of 120 characters or fewer." },
        { status: 400 }
      );
    }

    const customer = await prisma.user.findFirst({
      where: { id: params.id, isAdmin: false },
      select: { id: true },
    });
    if (!customer) {
      return NextResponse.json({ message: "Customer not found." }, { status: 404 });
    }

    const updatedCustomer = await prisma.user.update({
      where: { id: params.id },
      data: { name: typeof body.name === "string" ? body.name.trim() || null : null },
      select: { id: true, name: true, email: true },
    });
    return NextResponse.json(updatedCustomer);
  } catch (error) {
    console.error("Failed to update customer.", error);
    return NextResponse.json(
      { message: "Failed to update customer." },
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
    const customer = await prisma.user.findFirst({
      where: { id: params.id, isAdmin: false },
      select: {
        id: true,
        _count: { select: { Order: true } },
      },
    });
    if (!customer) {
      return NextResponse.json({ message: "Customer not found." }, { status: 404 });
    }
    if (customer._count.Order > 0) {
      return NextResponse.json(
        { message: "Customers with order history cannot be deleted." },
        { status: 409 }
      );
    }

    await prisma.user.delete({ where: { id: customer.id } });
    return NextResponse.json({ message: "Customer deleted." });
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "P2003") {
      return NextResponse.json(
        { message: "This customer has order history and cannot be deleted." },
        { status: 409 }
      );
    }
    console.error("Failed to delete customer.", error);
    return NextResponse.json(
      { message: "Failed to delete customer." },
      { status: 500 }
    );
  }
};
