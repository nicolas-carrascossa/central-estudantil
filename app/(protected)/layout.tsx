import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { DashboardHeader } from "./dashboard/_components/header";
import { auth } from "@/lib/auth";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-svh flex-col">
      <DashboardHeader user={session.user} />
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
