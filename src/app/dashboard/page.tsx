import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthSession } from "@/utils/auth";
import { prisma } from "@/utils/connect";

type OrderProduct = {
  title: string;
  quantity: number;
};

type PopularDish = {
  title: string;
  quantity: number;
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);

const formatChartDay = (date: Date, rangeDays: number) =>
  new Intl.DateTimeFormat("en-US", {
    ...(rangeDays === 7 ? { weekday: "short" as const } : { day: "numeric" as const }),
    ...(rangeDays === 30 ? { month: "short" as const } : {}),
    timeZone: "UTC",
  }).format(date);

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);

const getOrderProducts = (value: unknown): OrderProduct[] => {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const product = item as Record<string, unknown>;
    if (
      typeof product.title !== "string" ||
      typeof product.quantity !== "number" ||
      !Number.isFinite(product.quantity)
    ) {
      return [];
    }
    return [{ title: product.title, quantity: product.quantity }];
  });
};

const getStatusStyle = (status: string) => {
  if (status.toLowerCase() === "delivered") {
    return "bg-emerald-50 text-emerald-700";
  }
  if (status.toLowerCase().includes("not paid")) {
    return "bg-amber-50 text-amber-700";
  }
  return "bg-orange-50 text-orange-700";
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: { range?: string };
}) {
  const session = await getAuthSession();

  if (!session) redirect("/login");
  if (!session.user.isAdmin) redirect("/");

  const rangeDays = searchParams?.range === "30d" ? 30 : 7;
  const today = new Date();
  const todayStart = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
  );
  const historyStart = new Date(todayStart);
  historyStart.setUTCDate(historyStart.getUTCDate() - 29);
  const chartStart = new Date(todayStart);
  chartStart.setUTCDate(chartStart.getUTCDate() - (rangeDays - 1));

  let orders;
  let menuItemCount: number;
  let customerCount: number;

  try {
    [orders, menuItemCount, customerCount] = await Promise.all([
      prisma.order.findMany({
        where: { createdAt: { gte: historyStart } },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          createdAt: true,
          price: true,
          status: true,
          userEmail: true,
          products: true,
        },
      }),
      prisma.product.count(),
      prisma.user.count({ where: { isAdmin: false } }),
    ]);
  } catch (error) {
    console.error("Failed to load restaurant dashboard data.", error);
    return (
      <main className="min-h-[calc(100svh-9rem)] bg-stone-50 px-4 py-10 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-3xl rounded-2xl border border-rose-200 bg-white p-8 text-center shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-orange-700">
            Massimo administration
          </p>
          <h1 className="mt-3 text-2xl font-bold text-stone-900">
            Dashboard data is unavailable
          </h1>
          <p className="mt-2 text-stone-600">
            We couldn&apos;t load the latest restaurant data. Please try again.
          </p>
          <Link
            href="/dashboard"
            className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg bg-orange-600 px-5 font-semibold text-white transition-colors hover:bg-orange-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-700"
          >
            Try again
          </Link>
        </div>
      </main>
    );
  }

  const todayOrders = orders.filter(
    (order) => order.createdAt >= todayStart
  );
  const paidOrders = orders.filter(
    (order) => !order.status.toLowerCase().includes("not paid")
  );
  const revenueToday = paidOrders
    .filter((order) => order.createdAt >= todayStart)
    .reduce((total, order) => total + Number(order.price), 0);

  const dailyRevenue = Array.from({ length: rangeDays }, (_, index) => {
    const date = new Date(chartStart);
    date.setUTCDate(date.getUTCDate() + index);
    const key = date.toISOString().slice(0, 10);
    const revenue = paidOrders
      .filter((order) => order.createdAt.toISOString().slice(0, 10) === key)
      .reduce((total, order) => total + Number(order.price), 0);
    return { date, revenue };
  });
  const hasSalesData = dailyRevenue.some((day) => day.revenue > 0);
  const chartMax = Math.max(...dailyRevenue.map((day) => day.revenue), 1);
  const revenueInRange = dailyRevenue.reduce((total, day) => total + day.revenue, 0);
  const unpaidOrdersToday = todayOrders.filter((order) =>
    order.status.toLowerCase().includes("not paid")
  ).length;

  const popularDishMap = new Map<string, number>();
  for (const order of paidOrders) {
    for (const product of getOrderProducts(order.products)) {
      popularDishMap.set(
        product.title,
        (popularDishMap.get(product.title) ?? 0) + product.quantity
      );
    }
  }
  const popularDishes: PopularDish[] = Array.from(
    popularDishMap,
    ([title, quantity]) => ({ title, quantity })
  )
    .sort((left, right) => right.quantity - left.quantity)
    .slice(0, 5);

  const metricCards = [
    {
      label: "Revenue today",
      value: formatCurrency(revenueToday),
      detail: "Paid orders only",
      tone: "text-emerald-700",
    },
    {
      label: "Orders today",
      value: todayOrders.length.toString(),
      detail: "All order statuses",
      tone: "text-stone-900",
    },
    {
      label: "Awaiting payment",
      value: unpaidOrdersToday.toString(),
      detail: "Created today",
      tone: "text-amber-700",
    },
    {
      label: "Menu items",
      value: menuItemCount.toString(),
      detail: "In your catalog",
      tone: "text-stone-900",
    },
    {
      label: "Customers",
      value: customerCount.toString(),
      detail: "Registered non-admin accounts",
      tone: "text-stone-900",
    },
  ];

  return (
    <main className="min-h-[calc(100svh-78px)] bg-stone-50 px-4 py-8 sm:px-6 lg:px-8 lg:py-9">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-5 border-b border-stone-200 pb-7 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-700">
              Massimo administration
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-stone-950 sm:text-4xl">
              Good to see you{session.user.name ? `, ${session.user.name}` : ""}
            </h1>
            <p className="mt-2 text-sm text-stone-600">
              Here&apos;s how your restaurant is doing today.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/add"
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-orange-600 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-orange-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-700"
            >
              Add menu item
            </Link>
            <Link
              href="/orders"
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-800 transition-colors hover:bg-stone-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-700"
            >
              Manage orders
            </Link>
          </div>
        </header>

        <section
          aria-label="Restaurant overview"
          className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5"
        >
          {metricCards.map((metric, index) => (
            <article
              key={metric.label}
              className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium text-stone-600">
                  {metric.label}
                </p>
                <span
                  aria-hidden="true"
                  className={`flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold ${
                    index === 0
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-orange-50 text-orange-800"
                  }`}
                >
                  {["$", "#", "!", "M", "C"][index]}
                </span>
              </div>
              <p className={`mt-4 text-3xl font-bold tracking-tight ${metric.tone}`}>
                {metric.value}
              </p>
              <p className="mt-1 text-xs text-stone-500">{metric.detail}</p>
            </article>
          ))}
        </section>

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(18rem,1fr)]">
          <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-stone-900">
                  Sales overview
                </h2>
                <p className="mt-1 text-sm text-stone-500">
                  Paid order revenue · last {rangeDays} days
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-600">
                  {formatCurrency(revenueInRange)} total
                </span>
                <nav aria-label="Sales chart date range" className="flex rounded-lg bg-stone-100 p-1">
                  {[7, 30].map((days) => {
                    const active = days === rangeDays;
                    return (
                      <Link
                        key={days}
                        href={`/dashboard?range=${days}d`}
                        aria-current={active ? "page" : undefined}
                        className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                          active
                            ? "bg-white text-orange-800 shadow-sm"
                            : "text-stone-500 hover:text-stone-900"
                        }`}
                      >
                        {days} days
                      </Link>
                    );
                  })}
                </nav>
              </div>
            </div>

            {hasSalesData ? (
              <div className="mt-8 overflow-x-auto pb-2">
                <div
                  role="img"
                  aria-label={`Daily paid revenue for the last ${rangeDays} days: ${dailyRevenue
                    .map(
                      (day) =>
                        `${formatDate(day.date)} ${formatCurrency(day.revenue)}`
                    )
                    .join(", ")}`}
                  className={`grid h-56 gap-2 border-b border-stone-200 sm:gap-3 ${
                    rangeDays === 7 ? "grid-cols-7" : "min-w-[760px] grid-cols-[repeat(30,minmax(0,1fr))]"
                  }`}
                >
                  {dailyRevenue.map((day) => {
                    const height = Math.max((day.revenue / chartMax) * 100, 3);
                    return (
                      <div
                        key={day.date.toISOString()}
                        className="flex min-w-0 flex-col items-center justify-end gap-2"
                        title={`${formatDate(day.date)}: ${formatCurrency(day.revenue)}`}
                      >
                        {rangeDays === 7 && (
                          <span className="hidden truncate text-[10px] font-medium text-stone-500 sm:block">
                            {formatCurrency(day.revenue)}
                          </span>
                        )}
                        <div className="flex h-36 w-full items-end justify-center">
                          <div
                            aria-hidden="true"
                            className={`w-full rounded-t-md bg-orange-500 transition-[height] ${
                              rangeDays === 7 ? "max-w-12" : "max-w-5"
                            }`}
                            style={{ height: `${height}%` }}
                          />
                        </div>
                        <span className="pb-2 text-[10px] font-medium text-stone-500">
                          {formatChartDay(day.date, rangeDays)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div
                role="status"
                className="mt-6 flex h-56 flex-col items-center justify-center rounded-xl bg-stone-50 px-5 text-center"
              >
                <p className="font-semibold text-stone-800">
                  No paid sales in the last {rangeDays} days
                </p>
                <p className="mt-1 max-w-sm text-sm text-stone-500">
                  Sales will appear here after a customer completes payment.
                </p>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-stone-900">
                  Popular dishes
                </h2>
                <p className="mt-1 text-sm text-stone-500">
                  By quantity in paid orders · 30 days
                </p>
              </div>
              <Link
                href="/menu"
                className="text-sm font-semibold text-orange-700 hover:text-orange-800"
              >
                View menu
              </Link>
            </div>
            {popularDishes.length ? (
              <ol className="mt-5 divide-y divide-stone-100">
                {popularDishes.map((dish, index) => (
                  <li
                    key={dish.title}
                    className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-50 text-xs font-bold text-orange-800">
                      {index + 1}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold text-stone-800">
                      {dish.title}
                    </span>
                    <span className="shrink-0 text-xs text-stone-500">
                      {dish.quantity} sold
                    </span>
                  </li>
                ))}
              </ol>
            ) : (
              <div className="mt-5 rounded-xl bg-stone-50 p-5 text-center">
                <p className="text-sm font-medium text-stone-700">
                  No paid dish sales yet
                </p>
                <p className="mt-1 text-xs text-stone-500">
                  Popular items will appear here after your first paid order.
                </p>
              </div>
            )}
          </section>
        </div>

        <section className="mt-6 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 px-5 py-5 sm:px-6">
            <div>
              <h2 className="text-lg font-bold text-stone-900">Recent orders</h2>
              <p className="mt-1 text-sm text-stone-500">
                Latest orders from the past 30 days
              </p>
            </div>
            <Link
              href="/orders"
              className="text-sm font-semibold text-orange-700 hover:text-orange-800"
            >
              View all orders <span aria-hidden="true">→</span>
            </Link>
          </div>
          {orders.length ? (
            <ul className="divide-y divide-stone-100">
              {orders.slice(0, 5).map((order) => (
                <li
                  key={order.id}
                  className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-4 sm:px-6"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-stone-900">
                      {order.userEmail}
                    </p>
                    <p className="mt-1 text-xs text-stone-500">
                      Order #{order.id.slice(-8)} · {formatDate(order.createdAt)}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusStyle(order.status)}`}
                  >
                    {order.status}
                  </span>
                  <span className="w-20 text-right text-sm font-bold text-stone-900">
                    {formatCurrency(Number(order.price))}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-5 py-10 text-center sm:px-6">
              <p className="font-semibold text-stone-800">No recent orders</p>
              <p className="mt-1 text-sm text-stone-500">
                New orders will show up here when customers check out.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
