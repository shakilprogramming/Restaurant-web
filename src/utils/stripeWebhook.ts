export type StripeWebhookPaymentIntent = {
  id: string;
  status: string;
  amount: number;
  currency: string;
  metadata: Record<string, string>;
};

type WebhookEvent = {
  id: string;
  type: string;
  data: { object: StripeWebhookPaymentIntent };
};

type WebhookTransaction = {
  processedStripeEvent: {
    create(args: { data: { eventId: string; eventType: string } }): Promise<unknown>;
  };
  order: {
    findUnique(args: {
      where: { intent_id: string };
      select: { id: true; price: true; status: true; intent_id: true };
    }): Promise<{
      id: string;
      price: unknown;
      status: string;
      intent_id: string | null;
    } | null>;
    updateMany(args: {
      where: { id: string; status: string; intent_id: string };
      data: { status: string };
    }): Promise<{ count: number }>;
  };
};

export type WebhookProcessResult = "processed" | "ignored";

export function verifyStripeWebhookEvent<T>(
  rawBody: string,
  signature: string,
  secret: string,
  constructEvent: (body: string, signature: string, secret: string) => T
): T {
  return constructEvent(rawBody, signature, secret);
}

const expectedAmount = (price: unknown) => Math.round(Number(price) * 100);

/** Run inside a Prisma transaction. The unique event ID is the idempotency gate. */
export async function processStripeEventInTransaction(
  tx: WebhookTransaction,
  event: WebhookEvent,
  verifiedPaymentIntent?: StripeWebhookPaymentIntent
): Promise<WebhookProcessResult> {
  await tx.processedStripeEvent.create({
    data: { eventId: event.id, eventType: event.type },
  });

  if (
    event.type !== "payment_intent.succeeded" &&
    event.type !== "payment_intent.payment_failed"
  ) {
    return "ignored";
  }

  const paymentIntent = event.data.object;
  const order = await tx.order.findUnique({
    where: { intent_id: paymentIntent.id },
    select: { id: true, price: true, status: true, intent_id: true },
  });

  if (
    !order ||
    order.intent_id !== paymentIntent.id ||
    paymentIntent.metadata.orderId !== order.id ||
    paymentIntent.amount !== expectedAmount(order.price) ||
    paymentIntent.currency.toLowerCase() !== "usd"
  ) {
    return "ignored";
  }

  if (event.type === "payment_intent.payment_failed") {
    // Failed orders remain Not Paid! and can be retried through the current checkout.
    return "processed";
  }

  if (
    paymentIntent.status !== "succeeded" ||
    !verifiedPaymentIntent ||
    verifiedPaymentIntent.id !== order.intent_id ||
    verifiedPaymentIntent.status !== "succeeded" ||
    verifiedPaymentIntent.amount !== expectedAmount(order.price) ||
    verifiedPaymentIntent.currency.toLowerCase() !== "usd" ||
    verifiedPaymentIntent.metadata.orderId !== order.id
  ) {
    return "ignored";
  }

  if (order.status === "Not Paid!") {
    await tx.order.updateMany({
      where: { id: order.id, status: "Not Paid!", intent_id: paymentIntent.id },
      data: { status: "Being prepared!" },
    });
  }

  return "processed";
}
