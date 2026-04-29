"use client";

import { useState } from "react";
import { Calendar, Mail, Users } from "lucide-react";

import { AdminCalendar } from "./_components/admin-calendar";
import { CreateUserForm } from "./_components/create-user-form";
import { GlobalGuestList } from "./_components/global-guest-list";
import { UserList } from "./_components/user-list";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Tab = "calendar" | "users" | "global-guests";

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("calendar");
  const [usersRefreshKey, setUsersRefreshKey] = useState(0);

  return (
    <div className="mx-auto flex min-w-0 max-w-6xl flex-1 flex-col">
      <div className="mb-6 flex flex-wrap gap-2 border-b border-border pb-4">
        <Button
          variant={tab === "calendar" ? "default" : "ghost"}
          size="sm"
          onClick={() => setTab("calendar")}
          className={cn(
            "gap-2",
            tab === "calendar" && "bg-primary text-primary-foreground"
          )}
        >
          <Calendar className="size-4" />
          Calendário
        </Button>
        <Button
          variant={tab === "users" ? "default" : "ghost"}
          size="sm"
          onClick={() => setTab("users")}
          className={cn(
            "gap-2",
            tab === "users" && "bg-primary text-primary-foreground"
          )}
        >
          <Users className="size-4" />
          Usuários
        </Button>
        <Button
          variant={tab === "global-guests" ? "default" : "ghost"}
          size="sm"
          onClick={() => setTab("global-guests")}
          className={cn(
            "gap-2",
            tab === "global-guests" && "bg-primary text-primary-foreground"
          )}
        >
          <Mail className="size-4" />
          Convidados globais
        </Button>
      </div>

      {tab === "calendar" && <AdminCalendar />}
      {tab === "users" && (
        <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
          <CreateUserForm onUserCreated={() => setUsersRefreshKey((k) => k + 1)} />
          <UserList refreshKey={usersRefreshKey} />
        </div>
      )}
      {tab === "global-guests" && <GlobalGuestList />}
    </div>
  );
}
