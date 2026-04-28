import { Calendar, MapPin, Users } from "lucide-react";
import { FieldDescription } from "@/components/ui/field";
import { LoginForm } from "./_components/login-form";

export default function LoginPage() {
  return (
    <div className="grid min-h-svh grid-cols-1 md:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-primary p-12 md:flex md:flex-col md:justify-center lg:p-16">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.08]"
          aria-hidden
        >
          <div className="absolute -left-12 -top-12 size-48 rounded-full bg-primary-foreground blur-3xl" />
          <div className="absolute -bottom-16 -right-16 size-64 rounded-full bg-primary-foreground blur-3xl" />
          <div className="absolute left-1/2 top-1/2 size-32 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary-foreground blur-2xl" />
        </div>

        <div className="relative z-10 flex max-w-md flex-col gap-10">
          <div className="flex flex-col gap-4">
            <Calendar
              className="size-14 text-primary-foreground drop-shadow-sm"
              strokeWidth={1.5}
              aria-hidden
            />
            <h1 className="text-balance text-3xl font-semibold tracking-tight text-primary-foreground drop-shadow-sm lg:text-4xl">
              Central Estudantil
            </h1>
            <p className="text-balance text-base text-primary-foreground/80 lg:text-lg">
              Reserve espaços para eventos do seu clube.
            </p>
          </div>

          <ul className="flex flex-col gap-5">
            <li className="flex items-start gap-3 text-primary-foreground/90">
              <Calendar
                className="mt-0.5 size-5 shrink-0"
                strokeWidth={1.75}
                aria-hidden
              />
              <span className="text-sm lg:text-base">
                Veja todos os eventos do mês em um só lugar
              </span>
            </li>
            <li className="flex items-start gap-3 text-primary-foreground/90">
              <Users
                className="mt-0.5 size-5 shrink-0"
                strokeWidth={1.75}
                aria-hidden
              />
              <span className="text-sm lg:text-base">
                Convide membros do clube e convidados externos
              </span>
            </li>
            <li className="flex items-start gap-3 text-primary-foreground/90">
              <MapPin
                className="mt-0.5 size-5 shrink-0"
                strokeWidth={1.75}
                aria-hidden
              />
              <span className="text-sm lg:text-base">
                Auditório, salas de reunião, coworking e laboratório
              </span>
            </li>
          </ul>
        </div>
      </aside>

      <main className="flex flex-col bg-background">
        <div className="flex items-center gap-2 px-6 pt-6 md:hidden">
          <Calendar
            className="size-6 text-primary"
            strokeWidth={1.75}
            aria-hidden
          />
          <span className="text-base font-semibold tracking-tight text-foreground">
            Central Estudantil
          </span>
        </div>

        <div className="flex flex-1 items-center justify-center px-6 py-10 md:px-10 md:py-12">
          <div className="flex w-full max-w-sm flex-col gap-6">
            <LoginForm />
            <FieldDescription className="text-center">
              Problemas para acessar? Entre em contato com a Central
              Estudantil.
            </FieldDescription>
          </div>
        </div>
      </main>
    </div>
  );
}
