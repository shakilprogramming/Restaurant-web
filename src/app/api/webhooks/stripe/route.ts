import { prisma } from "@/utils/connect";
import {
  processStripeEventInTransaction,
  type StripeWebhookPaymentIntent,
  verifyStripeWebhookEvent,
} from "@/utils/stripeWebhook";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature) {
    return NextResponse.json(
      { message: "Missing Stripe signature." },
      { status: 400 }
    );
  }
  if (!webhookSecret) {
    console.error("Stripe webhook signing secret is not configured.");
    return NextResponse.json(
      { message: "Webhook processing is not configured." },
      { status: 500 }
    );
  }

  let event: Stripe.Event;
  try {
    const rawBody = await request.text();
    event = verifyStripeWebhookEvent(
      rawBody,
      signature,
      webhookSecret,
      (body, suppliedSignature, secret) =>
        stripe.webhooks.constructEvent(body, suppliedSignature, secret)
    );
  } catch {
    return NextResponse.json(
      { message: "Invalid webhook signature." },
      { status: 400 }
    );
  }

  if (
    event.type !== "payment_intent.succeeded" &&
    event.type !== "payment_intent.payment_failed"
  ) {
    return NextResponse.json({ received: true });
  }

  const paymentIntent = event.data.object as Stripe.PaymentIntent;
  let verifiedPaymentIntent: StripeWebhookPaymentIntent | undefined;

  if (event.type === "payment_intent.succeeded") {
    try {
      verifiedPaymentIntent = await stripe.paymentIntents.retrieve(paymentIntent.id);
    } catch {
      // Transient Stripe API failures should be retried by Stripe.
      return NextResponse.json(
        { message: "Payment verification is temporarily unavailable." },
        { status: 500 }
      );
    }
  }

  try {
    await prisma.$transaction(async (tx) =>
      processStripeEventInTransaction(
        tx,
        event as unknown as Parameters<typeof processStripeEventInTransaction>[1],
        verifiedPaymentIntent
      )
    );
    return NextResponse.json({ received: true });
  } catch (error) {
    // A unique event ID means Stripe already delivered this event. Acknowledge
    // concurrent or sequential duplicates without repeating order processing.
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json({ received: true, duplicate: true });
    }

    // Do not log event payloads, intent details, customer data, or secrets.
    console.error("Stripe webhook processing failed.");
    return NextResponse.json(
      { message: "Webhook processing failed." },
      { status: 500 }
    );
  }
}
