import { getAuthSession } from "@/utils/auth";
import { redirect } from "next/navigation";

export default async function AddLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAuthSession();

  if (!session) redirect("/login");
  if (!session.user.isAdmin) redirect("/");

  return <>{children}</>;
}
