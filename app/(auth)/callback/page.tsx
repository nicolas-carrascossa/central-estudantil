import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { AuthCallbackClient } from "./_components/auth-callback-client";

export const dynamic = "force-dynamic";

export default async function AuthCallbackPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const destination =
    session.user.role === "admin" ? "/z_admin" : "/dashboard";
  return <AuthCallbackClient destination={destination} />;
}
