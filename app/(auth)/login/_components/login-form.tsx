"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { loginSchema, LoginSchemaType } from "@/lib/schemas/auth";
import { signIn } from "@/server/auth";

export function LoginForm() {
  const [isPending, startTransition] = useTransition();

  const form = useForm<LoginSchemaType>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: LoginSchemaType) {
    startTransition(async () => {
      try {
        const { success, message } = await signIn(
          values.email,
          values.password
        );
        if (success) {
          toast.success(message as string);
          window.location.href = "callback";
        } else {
          toast.error(message as string);
        }
      } catch {
        toast.error("Erro ao fazer login");
      }
    });
  }

  return (
    <form className="w-full" onSubmit={form.handleSubmit(onSubmit)}>
      <FieldGroup>
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-2xl font-bold">Bem-vindo de volta</h1>
          <p className="text-balance text-muted-foreground">
            Entre com suas credenciais.
          </p>
        </div>

        <Field data-invalid={!!form.formState.errors.email}>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            type="email"
            placeholder="clube@inteli.edu.br"
            className="border-border/50"
            {...form.register("email")}
            disabled={isPending}
          />
          {form.formState.errors.email && (
            <FieldError>{form.formState.errors.email.message}</FieldError>
          )}
        </Field>

        <Field data-invalid={!!form.formState.errors.password}>
          <div className="flex items-center">
            <FieldLabel htmlFor="password">Senha</FieldLabel>
          </div>
          <PasswordInput
            id="password"
            className="border-border/50"
            {...form.register("password")}
            disabled={isPending}
          />
          {form.formState.errors.password && (
            <FieldError>{form.formState.errors.password.message}</FieldError>
          )}
        </Field>

        <Field className="mb-3 mt-1">
          <Button type="submit" className="h-10 w-full" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            Login
          </Button>
        </Field>
      </FieldGroup>
    </form>
  );
}
