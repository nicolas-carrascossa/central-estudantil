"use client";

import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Mail, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  createGlobalGuestEmailSchema,
  type CreateGlobalGuestEmailInput,
} from "@/lib/schemas/global-guest-email";
import {
  createGlobalGuestEmail,
  deleteGlobalGuestEmail,
  listGlobalGuestEmails,
} from "@/server/global-guest-email";

type GlobalGuestEmail = Awaited<
  ReturnType<typeof listGlobalGuestEmails>
>[number];

export function GlobalGuestList() {
  const [emails, setEmails] = useState<GlobalGuestEmail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddPending, startAddTransition] = useTransition();
  const [isDeletePending, startDeleteTransition] = useTransition();
  const [emailToDelete, setEmailToDelete] = useState<GlobalGuestEmail | null>(
    null
  );

  const form = useForm<CreateGlobalGuestEmailInput>({
    resolver: zodResolver(createGlobalGuestEmailSchema),
    defaultValues: { email: "" },
  });

  useEffect(() => {
    void (async () => {
      const list = await listGlobalGuestEmails();
      setEmails(list);
      setIsLoading(false);
    })();
  }, []);

  function onSubmit(values: CreateGlobalGuestEmailInput) {
    startAddTransition(async () => {
      const result = await createGlobalGuestEmail(values);
      if (result.success) {
        toast.success("Email adicionado");
        form.reset();
        const list = await listGlobalGuestEmails();
        setEmails(list);
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleConfirmDelete() {
    const target = emailToDelete;
    if (!target) return;
    startDeleteTransition(async () => {
      const result = await deleteGlobalGuestEmail(target.id);
      if (result.success) {
        toast.success("Email removido");
        setEmails((prev) => prev.filter((e) => e.id !== target.id));
        setEmailToDelete(null);
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <Mail className="size-5" />
          Convidados globais
        </h2>

        <p className="mb-4 text-sm text-muted-foreground">
          Emails que sempre receberão convite em eventos aprovados.
        </p>

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start"
        >
          <Field
            data-invalid={!!form.formState.errors.email}
            className="flex-1"
          >
            <FieldLabel htmlFor="add-email" className="sr-only">
              Email
            </FieldLabel>
            <Input
              id="add-email"
              type="email"
              placeholder="email@exemplo.com"
              autoComplete="off"
              {...form.register("email")}
              disabled={isAddPending}
            />
            {form.formState.errors.email && (
              <FieldError>{form.formState.errors.email.message}</FieldError>
            )}
          </Field>
          <Button type="submit" disabled={isAddPending} className="gap-2">
            {isAddPending && <Loader2 className="size-4 animate-spin" />}
            Adicionar
          </Button>
        </form>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : emails.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum email cadastrado. Adicione o primeiro acima.
          </p>
        ) : (
          <ul className="space-y-2">
            {emails.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-border bg-muted/30 p-3"
              >
                <span className="truncate text-sm">{item.email}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setEmailToDelete(item)}
                  disabled={isDeletePending}
                  aria-label={`Remover ${item.email}`}
                >
                  <Trash2 className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <AlertDialog
        open={!!emailToDelete}
        onOpenChange={(open) => {
          if (!open && !isDeletePending) setEmailToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover email?</AlertDialogTitle>
            <AlertDialogDescription>
              {`O email "${emailToDelete?.email ?? ""}" não receberá mais convites automáticos.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletePending}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isDeletePending}
              onClick={(e) => {
                e.preventDefault();
                handleConfirmDelete();
              }}
            >
              {isDeletePending && (
                <Loader2 className="mr-2 size-4 animate-spin" />
              )}
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
