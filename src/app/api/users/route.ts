import { getAuthSession } from "@/utils/auth";
import { prisma } from "@/utils/connect";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export const GET = async () => {
  const session = await getAuthSession();
  if (!session?.user.isAdmin) {
    return NextResponse.json({ message: "You are not allowed." }, { status: 403 });
  }

  try {
    const users = await prisma.user.findMany({
      where: { isAdmin: false },
      select: {
        id: true,
        name: true,
        email: true,
        _count: { select: { Order: true } },
      },
      orderBy: { email: "asc" },
    });
    return NextResponse.json(
      users.map(({ _count, ...user }) => ({
        ...user,
        orderCount: _count.Order,
      }))
    );
  } catch (error) {
    console.error("Failed to fetch customers.", error);
    return NextResponse.json(
      { message: "Failed to fetch customers." },
      { status: 500 }
    );
  }
};
