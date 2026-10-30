import { prisma } from "@/utils/connect";
import { getAuthSession } from "@/utils/auth";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
export async function POST(
  request: NextRequest,
  { params }: { params: { order: string } }
) {
  const orderId = params?.order;
  if (!orderId) {
    return NextResponse.json(
      { message: "Order ID is required." },
      { status: 400 }
    );
  }

  const session = await getAuthSession();
  if (!session?.user.email) {
    return NextResponse.json(
      { message: "You must sign in before paying." },
      { status: 401 }
    );
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return NextResponse.json({ message: "Order not found." }, { status: 404 });
    }
    if (order.userEmail !== session.user.email && !session.user.isAdmin) {
      return NextResponse.json({ message: "You are not allowed." }, { status: 403 });
    }
    if (order.status !== "Not Paid!") {
      return NextResponse.json(
        { message: "This order is no longer awaiting payment." },
        { status: 409 }
      );
    }

    if (order.intent_id) {
      const existingIntent = await stripe.paymentIntents.retrieve(order.intent_id);
      if (existingIntent.status === "succeeded") {
        return NextResponse.json(
          { message: "This order has already been paid." },
          { status: 409 }
        );
      }
      if (existingIntent.status !== "canceled") {
        return NextResponse.json({
          clientSecret: existingIntent.client_secret,
        });
      }
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(Number(order.price) * 100),
      currency: "usd",
      automatic_payment_methods: { enabled: true },
      metadata: { orderId: order.id, userEmail: order.userEmail },
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { intent_id: paymentIntent.id },
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error("Failed to create payment intent.", error);
    return NextResponse.json(
      { message: "Could not start payment. Please try again." },
      { status: 500 }
    );
  }
}
