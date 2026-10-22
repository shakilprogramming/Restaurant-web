import { prisma } from "@/utils/connect";
import { NextResponse } from "next/server";
import { getAuthSession } from "@/utils/auth";

// FETCH ALL PRODUCTS
export const GET = async (req) => {
  const { searchParams } = new URL(req.url);
  const cat = searchParams.get("cat");
  const manage = searchParams.get("manage") === "1";

  try {
    if (manage) {
      const session = await getAuthSession();
      if (!session?.user.isAdmin) {
        return NextResponse.json(
          { message: "You are not allowed." },
          { status: 403 }
        );
      }

      const products = await prisma.product.findMany({
        include: { category: { select: { title: true } } },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json(products);
    }

    const products = await prisma.product.findMany({
      where: {
        ...(cat ? { catSlug: cat } : { isFeatured: true }),
      },
    });
    return new NextResponse(JSON.stringify(products), { status: 200 });
  } catch (err) {
    console.error("Failed to fetch products.", err);
    return new NextResponse(
      JSON.stringify({ message: "Something went wrong!" }),
      { status: 500 }
    );
  }
};
export const POST = async (req) => {
  const session = await getAuthSession();
  if (!session?.user.isAdmin) {
    return NextResponse.json({ message: "You are not allowed." }, { status: 403 });
  }

  try {
    const body = await req.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { message: "A valid product is required." },
        { status: 400 }
      );
    }

    const { title, desc, price, catSlug, img, options, isFeatured } = body;
    if (
      typeof title !== "string" ||
      !title.trim() ||
      typeof desc !== "string" ||
      !desc.trim() ||
      typeof price !== "number" ||
      !Number.isFinite(price) ||
      price <= 0 ||
      typeof catSlug !== "string" ||
      !catSlug.trim() ||
      (img !== undefined && typeof img !== "string") ||
      (isFeatured !== undefined && typeof isFeatured !== "boolean") ||
      !Array.isArray(options) ||
      options.some(
        (option) =>
          !option ||
          typeof option !== "object" ||
          typeof option.title !== "string" ||
          !option.title.trim() ||
          typeof option.additionalPrice !== "number" ||
          !Number.isFinite(option.additionalPrice) ||
          option.additionalPrice < 0
      )
    ) {
      return NextResponse.json(
        { message: "Enter valid product details, price, category, and options." },
        { status: 400 }
      );
    }

    const category = await prisma.category.findUnique({
      where: { slug: catSlug.trim() },
      select: { slug: true },
    });
    if (!category) {
      return NextResponse.json(
        { message: "The selected category no longer exists. Choose another category." },
        { status: 400 }
      );
    }

    const product = await prisma.product.create({
      data: {
        title: title.trim(),
        desc: desc.trim(),
        price,
        catSlug: category.slug,
        ...(typeof img === "string" ? { img } : {}),
        ...(typeof isFeatured === "boolean" ? { isFeatured } : {}),
        options,
      },
    });
    return new NextResponse(JSON.stringify(product), { status: 201 });
  } catch (err) {
    console.error("Failed to create product.", err);
    return new NextResponse(
      JSON.stringify({ message: "Something went wrong!" }),
      { status: 500 }
    );
  }
};
