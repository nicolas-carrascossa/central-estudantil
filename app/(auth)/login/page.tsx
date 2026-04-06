import { Umbrella } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { FieldDescription } from "@/components/ui/field";
import { LoginForm } from "./_components/login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6 md:max-w-4xl">
        <Card className="overflow-hidden p-0">
          <CardContent className="grid p-0 md:grid-cols-2">
            <div className="relative hidden min-h-[280px] overflow-hidden bg-primary md:flex md:min-h-0 md:flex-col md:items-center md:justify-center">
              <div
                className="pointer-events-none absolute inset-0 opacity-[0.08]"
                aria-hidden
              >
                <div className="absolute -left-12 -top-12 size-48 rounded-full bg-primary-foreground blur-3xl" />
                <div className="absolute -bottom-16 -right-16 size-64 rounded-full bg-primary-foreground blur-3xl" />
                <div className="absolute left-1/2 top-1/2 size-32 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary-foreground blur-2xl" />
              </div>
              <div className="relative z-10 flex flex-col items-center gap-4">
                <Umbrella
                  className="size-24 text-primary-foreground drop-shadow-sm md:size-28"
                  strokeWidth={1.5}
                  aria-hidden
                />
                <span className="text-center text-xl font-semibold tracking-tight text-primary-foreground drop-shadow-sm md:text-2xl">
                  Central Estudantil
                </span>
              </div>
            </div>
            <LoginForm />
          </CardContent>
        </Card>
        <FieldDescription className="text-center">
          Problemas para acessar? Entre em contato com a Central Estudantil.
        </FieldDescription>
      </div>
    </div>
  );
}
