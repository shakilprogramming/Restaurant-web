import { prisma } from "@/utils/connect";
import { getAuthSession } from "@/utils/auth";
import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export const PUT = async (
  _request: Request,
  { params }: { params: { intentId: string } }
) => {
  const { intentId } = params;
  const session = await getAuthSession();
  if (!session?.user.email) {
    return NextResponse.json(
      { message: "You must sign in to confirm this order." },
      { status: 401 }
    );
  }

  try {
    const order = await prisma.order.findUnique({
      where: {
        intent_id: intentId,
      },
    });
    if (!order) {
      return NextResponse.json({ message: "Order not found." }, { status: 404 });
    }
    if (order.userEmail !== session.user.email && !session.user.isAdmin) {
      return NextResponse.json({ message: "You are not allowed." }, { status: 403 });
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(intentId);
    if (
      paymentIntent.status !== "succeeded" ||
      paymentIntent.metadata.orderId !== order.id ||
      paymentIntent.amount !== Math.round(Number(order.price) * 100)
    ) {
      return NextResponse.json(
        { message: "Payment has not been completed." },
        { status: 409 }
      );
    }

    if (order.status !== "Being prepared!") {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: "Being prepared!" },
      });
    }

    return NextResponse.json({ message: "Order payment confirmed." });
  } catch (error) {
    console.error("Failed to confirm payment.", error);
    return NextResponse.json(
      { message: "Could not confirm payment." },
      { status: 500 }
    );
  }
};