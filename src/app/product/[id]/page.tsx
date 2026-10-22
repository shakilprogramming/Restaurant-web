import DeleteButton from "@/components/DeleteButton";
import Price from "@/components/Price";
import { notFound } from "next/navigation";
import { prisma } from "@/utils/connect";
import { toProductType } from "@/utils/products";
import Image from "next/image";

export const dynamic = "force-dynamic";

const SingleProductPage = async ({ params }: { params: { id: string } }) => {
  const record = await prisma.product.findUnique({
    where: { id: params.id },
  });

  if (!record) notFound();
  const singleProduct = toProductType(record);

  return (
    <main className="p-4 lg:px-20 xl:px-40 min-h-[calc(100svh-15rem)] flex flex-col justify-around text-red-500 md:flex-row md:gap-8 md:items-center relative">
      <div className="relative w-full aspect-square md:w-1/2 md:aspect-[4/3]">
        {singleProduct.img ? (
          <Image
            src={singleProduct.img}
            alt={singleProduct.title}
            className="object-contain"
            fill
          />
        ) : (
          <div className="flex h-full items-center justify-center rounded-xl bg-orange-100 text-6xl" aria-hidden="true">
            🍽️
          </div>
        )}
      </div>
      <div className="flex w-full flex-col gap-4 md:w-1/2 md:justify-center md:gap-6 xl:gap-8">
        <h1 className="text-3xl font-bold uppercase">
          <span>{singleProduct.title}</span>
          <DeleteButton id={singleProduct.id} />
        </h1>
        <p>{singleProduct.desc}</p>
        <Price product={singleProduct} />
      </div>
    </main>
  );
};

export default SingleProductPage;