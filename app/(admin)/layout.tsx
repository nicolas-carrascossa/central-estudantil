import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";

import { auth } from "@/lib/auth";
import { signOut } from "@/server/auth";
import { Button } from "@/components/ui/button";
import { LogOut, Shield, Umbrella } from "lucide-react";

export default async function AdminLayout({
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

  if (session.user.role !== "admin") {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-svh flex-col bg-blue-50">
      <header className="flex h-18 items-center justify-between border-b border-border bg-primary px-6">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-primary-foreground hover:opacity-90"
          >
            <Umbrella className="size-6" strokeWidth={1.5} />
            <span className="font-semibold tracking-tight">
              Central Estudantil
            </span>
          </Link>
          <span className="flex items-center gap-1 rounded-md bg-primary-foreground/20 px-2 py-1 text-xs font-medium text-primary-foreground">
            <Shield className="size-3.5" />
            Admin
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <span className="text-sm font-medium text-primary-foreground">
              {session.user.name ?? "Admin"}
            </span>
            {session.user.email && (
              <span className="text-xs text-primary-foreground/80">
                {session.user.email}
              </span>
            )}
          </div>
          <form action={signOut}>
            <Button
              type="submit"
              size="sm"
              className="border border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/15"
            >
              <LogOut className="mr-1.5 size-4" />
              Sair
            </Button>
          </form>
        </div>
      </header>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
