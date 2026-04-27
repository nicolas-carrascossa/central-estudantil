import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { Calendar } from "./_components/calendar";

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="mx-auto flex min-w-0 max-w-6xl flex-1 flex-col">
      <Calendar currentUserId={session.user.id} />
    </div>
  );
}
