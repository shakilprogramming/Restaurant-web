import { getAuthSession } from "@/utils/auth";
import { prisma } from "@/utils/connect";
import { NextRequest, NextResponse } from "next/server";
import { toProductType } from "@/utils/products";
import type { Product } from "@prisma/client";

type RequestedCartItem = {
  id?: unknown;
  quantity?: unknown;
  optionTitle?: unknown;
};

export const GET = async (_request: NextRequest) => {
  const session = await getAuthSession();

  if (!session) {
    return NextResponse.json(
      { message: "You are not authenticated." },
      { status: 401 }
    );
  }

  try {
    const orders = await prisma.order.findMany({
      where: session.user.isAdmin
        ? undefined
        : { userEmail: session.user.email ?? "" },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(orders);
  } catch (error) {
    console.error("Failed to fetch orders.", error);
    return NextResponse.json(
      { message: "Failed to fetch orders." },
      { status: 500 }
    );
  }
};

export const POST = async (request: NextRequest) => {
  const session = await getAuthSession();

  if (!session) {
    return NextResponse.json(
      { message: "You are not authenticated." },
      { status: 401 }
    );
  }

  if (!session.user.email) {
    return NextResponse.json(
      { message: "An email is required to create an order." },
      { status: 400 }
    );
  }

  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== "object" || !("products" in body)) {
      return NextResponse.json(
        { message: "A valid cart is required." },
        { status: 400 }
      );
    }

    const requestedProducts = (body as { products?: unknown }).products;
    if (!Array.isArray(requestedProducts) || requestedProducts.length === 0) {
      return NextResponse.json(
        { message: "Your cart is empty." },
        { status: 400 }
      );
    }

    const cartItems = requestedProducts as RequestedCartItem[];
    if (
      cartItems.some(
        (item) =>
          !item ||
          typeof item.id !== "string" ||
          !Number.isInteger(item.quantity) ||
          (item.quantity as number) < 1 ||
          (item.quantity as number) > 9 ||
          (item.optionTitle !== undefined &&
            typeof item.optionTitle !== "string")
      )
    ) {
      return NextResponse.json(
        { message: "Your cart contains an invalid item." },
        { status: 400 }
      );
    }

    const productsFromDb = await prisma.product.findMany({
      where: { id: { in: cartItems.map((item) => item.id as string) } },
    });
    const productMap = new Map(
      productsFromDb.map((product: Product) => [product.id, toProductType(product)])
    );
    const orderProducts = [];

    for (const item of cartItems) {
      const product = productMap.get(item.id as string);
      if (!product) {
        return NextResponse.json(
          { message: "A product in your cart is no longer available." },
          { status: 400 }
        );
      }

      const selectedOption = item.optionTitle
        ? product.options?.find((option) => option.title === item.optionTitle)
        : undefined;
      if (item.optionTitle && !selectedOption) {
        return NextResponse.json(
          { message: `${product.title} has an invalid option selected.` },
          { status: 400 }
        );
      }

      const quantity = item.quantity as number;
      const unitPrice = product.price + (selectedOption?.additionalPrice ?? 0);
      orderProducts.push({
        id: product.id,
        title: product.title,
        ...(product.img ? { img: product.img } : {}),
        ...(selectedOption ? { optionTitle: selectedOption.title } : {}),
        quantity,
        price: Math.round(unitPrice * quantity * 100) / 100,
      });
    }

    const price =
      Math.round(
        orderProducts.reduce((total, item) => total + item.price, 0) * 100
      ) / 100;
    const order = await prisma.order.create({
      data: {
        price,
        products: orderProducts,
        status: "Not Paid!",
        userEmail: session.user.email,
      },
    });
    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error("Failed to create order.", error);
    return NextResponse.json(
      { message: "Failed to create order." },
      { status: 500 }
    );
  }
};
