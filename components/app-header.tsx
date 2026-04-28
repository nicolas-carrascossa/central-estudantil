import Link from "next/link";
import { Calendar, LogOut, Shield } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { signOut } from "@/server/auth";

type AppHeaderProps = {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string | null;
  };
  variant?: "user" | "admin";
};

function getInitial(name: string | null | undefined): string {
  const trimmed = name?.trim();
  return (trimmed?.[0] ?? "?").toUpperCase();
}

const ADMIN_BADGE_BASE =
  "items-center gap-1 rounded bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground";

export function AppHeader({ user, variant = "user" }: AppHeaderProps) {
  const initial = getInitial(user.name);
  const isAdmin = user.role === "admin";

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-background px-4 md:h-18 md:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-primary transition-opacity hover:opacity-80"
          aria-label="Central Estudantil"
        >
          <Calendar
            className="size-6 shrink-0"
            strokeWidth={1.75}
            aria-hidden
          />
          <span className="truncate text-base font-bold tracking-tight md:text-lg">
            Central Estudantil
          </span>
        </Link>
        {isAdmin &&
          (variant === "user" ? (
            <Link
              href="/z_admin"
              className={cn(
                ADMIN_BADGE_BASE,
                "hidden transition-opacity hover:opacity-90 sm:flex",
              )}
            >
              <Shield className="size-3.5" aria-hidden />
              Admin
            </Link>
          ) : (
            <span className={cn(ADMIN_BADGE_BASE, "hidden sm:flex")}>
              <Shield className="size-3.5" aria-hidden />
              Admin
            </span>
          ))}
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden flex-col items-end leading-tight sm:flex">
          <span className="text-sm font-medium text-foreground">
            {user.name ?? "Usuário"}
          </span>
          {user.email && (
            <span className="text-xs text-muted-foreground">{user.email}</span>
          )}
        </div>
        <div
          className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground"
          aria-hidden
        >
          {initial}
        </div>
        <form action={signOut}>
          <Button
            type="submit"
            variant="ghost"
            size="icon"
            aria-label="Sair"
            title="Sair"
            className="text-muted-foreground hover:text-foreground"
          >
            <LogOut className="size-4" />
          </Button>
        </form>
      </div>
    </header>
  );
}
