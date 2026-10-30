import assert from "node:assert/strict";
import { test } from "node:test";
import {
  processStripeEventInTransaction,
  verifyStripeWebhookEvent,
} from "../src/utils/stripeWebhook.ts";

const makeFixture = ({ status = "Not Paid!", price = "12.50" } = {}) => {
  const state = {
    processed: new Set(),
    order: { id: "order_1", intent_id: "pi_1", price, status },
    failNextUpdate: false,
  };

  const tx = {
    processedStripeEvent: {
      async create({ data }) {
        if (state.processed.has(data.eventId)) {
          const error = new Error("Unique constraint");
          error.code = "P2002";
          throw error;
        }
        state.processed.add(data.eventId);
      },
    },
    order: {
      async findUnique({ where }) {
        return state.order.intent_id === where.intent_id
          ? { ...state.order }
          : null;
      },
      async updateMany({ where, data }) {
        if (state.failNextUpdate) {
          state.failNextUpdate = false;
          throw new Error("Temporary database failure");
        }
        if (
          state.order.id === where.id &&
          state.order.status === where.status &&
          state.order.intent_id === where.intent_id
        ) {
          state.order.status = data.status;
          return { count: 1 };
        }
        return { count: 0 };
      },
    },
  };

  return { state, tx };
};

const makeEvent = ({
  id = "evt_1",
  type = "payment_intent.succeeded",
  intent = {},
} = {}) => ({
  id,
  type,
  data: {
    object: {
      id: "pi_1",
      status: type === "payment_intent.payment_failed" ? "requires_payment_method" : "succeeded",
      amount: 1250,
      currency: "usd",
      metadata: { orderId: "order_1" },
      ...intent,
    },
  },
});

const verifiedIntent = (overrides = {}) => ({
  id: "pi_1",
  status: "succeeded",
  amount: 1250,
  currency: "usd",
  metadata: { orderId: "order_1" },
  ...overrides,
});

test("successful payment marks the matching unpaid order as prepared", async () => {
  const { state, tx } = makeFixture();
  const result = await processStripeEventInTransaction(
    tx,
    makeEvent(),
    verifiedIntent()
  );
  assert.equal(result, "processed");
  assert.equal(state.order.status, "Being prepared!");
  assert.deepEqual([...state.processed], ["evt_1"]);
});

test("valid webhook signature passes the original body unchanged to Stripe verification", () => {
  const rawBody = '{ "id": "evt_signed", "type": "payment_intent.succeeded" }';
  const result = verifyStripeWebhookEvent(rawBody, "sig_valid", "whsec_test", (...args) => {
    assert.deepEqual(args, [rawBody, "sig_valid", "whsec_test"]);
    return { id: "evt_signed" };
  });
  assert.deepEqual(result, { id: "evt_signed" });
});

test("invalid webhook signature is rejected by Stripe verification", () => {
  assert.throws(
    () =>
      verifyStripeWebhookEvent("raw", "sig_invalid", "whsec_test", () => {
        throw new Error("Invalid signature");
      }),
    /Invalid signature/
  );
});

test("failed payment is recorded without marking the order paid", async () => {
  const { state, tx } = makeFixture();
  const result = await processStripeEventInTransaction(
    tx,
    makeEvent({ type: "payment_intent.payment_failed" })
  );
  assert.equal(result, "processed");
  assert.equal(state.order.status, "Not Paid!");
});

test("unknown Payment Intent is ignored", async () => {
  const { state, tx } = makeFixture();
  const result = await processStripeEventInTransaction(
    tx,
    makeEvent({ intent: { id: "pi_unknown" } }),
    verifiedIntent({ id: "pi_unknown" })
  );
  assert.equal(result, "ignored");
  assert.equal(state.order.status, "Not Paid!");
});

test("incorrect amount or currency cannot mark the order paid", async (t) => {
  for (const [label, intent] of [
    ["event amount", { amount: 1249 }],
    ["event currency", { currency: "eur" }],
  ]) {
    await t.test(label, async () => {
      const { state, tx } = makeFixture();
      await processStripeEventInTransaction(
        tx,
        makeEvent({ intent }),
        verifiedIntent()
      );
      assert.equal(state.order.status, "Not Paid!");
    });
  }
});

test("incorrect retrieved intent amount, currency, status, or order metadata is rejected", async (t) => {
  for (const [label, intent] of [
    ["amount", { amount: 1249 }],
    ["currency", { currency: "eur" }],
    ["status", { status: "processing" }],
    ["order metadata", { metadata: { orderId: "another_order" } }],
  ]) {
    await t.test(label, async () => {
      const { state, tx } = makeFixture();
      await processStripeEventInTransaction(tx, makeEvent(), verifiedIntent(intent));
      assert.equal(state.order.status, "Not Paid!");
    });
  }
});

test("wrong event order metadata is rejected", async () => {
  const { state, tx } = makeFixture();
  await processStripeEventInTransaction(
    tx,
    makeEvent({ intent: { metadata: { orderId: "another_order" } } }),
    verifiedIntent()
  );
  assert.equal(state.order.status, "Not Paid!");
});

test("duplicate event IDs cannot process twice", async () => {
  const { state, tx } = makeFixture();
  await processStripeEventInTransaction(tx, makeEvent(), verifiedIntent());
  await assert.rejects(
    processStripeEventInTransaction(tx, makeEvent(), verifiedIntent()),
    (error) => error.code === "P2002"
  );
  assert.equal(state.order.status, "Being prepared!");
  assert.equal(state.processed.size, 1);
});

test("concurrent duplicate deliveries are protected by the unique event ID", async () => {
  const { state, tx } = makeFixture();
  const results = await Promise.allSettled([
    processStripeEventInTransaction(tx, makeEvent(), verifiedIntent()),
    processStripeEventInTransaction(tx, makeEvent(), verifiedIntent()),
  ]);
  assert.equal(results.filter((result) => result.status === "fulfilled").length, 1);
  assert.equal(results.filter((result) => result.status === "rejected").length, 1);
  assert.equal(state.order.status, "Being prepared!");
});

test("already paid or fulfilled orders are not regressed", async () => {
  for (const status of ["Being prepared!", "Delivered"]) {
    const { state, tx } = makeFixture({ status });
    await processStripeEventInTransaction(tx, makeEvent(), verifiedIntent());
    assert.equal(state.order.status, status);
  }
});

test("a transaction failure can be retried with the same event", async () => {
  const { state, tx } = makeFixture();
  state.failNextUpdate = true;
  await assert.rejects(
    processStripeEventInTransaction(tx, makeEvent(), verifiedIntent()),
    /Temporary database failure/
  );

  // Model the database rolling back both the event row and order write.
  state.processed.delete("evt_1");
  await processStripeEventInTransaction(tx, makeEvent(), verifiedIntent());
  assert.equal(state.order.status, "Being prepared!");
});

test("unsupported event types are safely ignored", async () => {
  const { state, tx } = makeFixture();
  const result = await processStripeEventInTransaction(
    tx,
    makeEvent({ type: "customer.created" })
  );
  assert.equal(result, "ignored");
  assert.equal(state.order.status, "Not Paid!");
});
