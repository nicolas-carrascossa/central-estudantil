import Link from "next/link";
import { LogOut, Shield, Umbrella } from "lucide-react";

import { Button } from "@/components/ui/button";
import { signOut } from "@/server/auth";

type DashboardHeaderProps = {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string | null;
  };
};

export function DashboardHeader({ user }: DashboardHeaderProps) {
  return (
    <header className="flex h-18 items-center justify-between border-b border-primary-foreground/20 bg-primary px-6">
      <div className="flex items-center gap-3">
        <Umbrella
          className="size-6 text-primary-foreground"
          strokeWidth={1.5}
        />
        <span className="font-semibold tracking-tight text-primary-foreground">
          Central Estudantil
        </span>
        {user.role === "admin" && (
          <Link
            href="/z_admin"
            className="flex items-center gap-1 rounded-md bg-primary-foreground/20 px-2 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary-foreground/30"
          >
            <Shield className="size-3.5" />
            Admin
          </Link>
        )}
      </div>
      <div className="flex items-center gap-3">
        <div className="flex flex-col items-end">
          <span className="text-sm font-medium text-primary-foreground">
            {user.name ?? "Usuário"}
          </span>
          {user.email && (
            <span className="text-xs text-primary-foreground/80">
              {user.email}
            </span>
          )}
        </div>
        <form action={signOut}>
          <Button
            type="submit"
            size="sm"
            className="border border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/15 hover:border-primary-foreground/50"
          >
            <LogOut className="mr-1.5 size-4" />
            Sair
          </Button>
        </form>
      </div>
    </header>
  );
}
