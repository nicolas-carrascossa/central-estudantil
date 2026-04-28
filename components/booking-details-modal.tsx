"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Trash2, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { getSpaceLabel } from "@/lib/constants/spaces";

export type OwnerOrAdminBookingForModal = {
  id: string;
  title: string;
  description: string | null;
  date: string | Date;
  startTime: string;
  endTime: string;
  spaceFirstOption: string;
  spaceSecondOption: string;
  approvedSpace: string | null;
  externalGuests: unknown;
  clubEmail: string;
  representativeEmail: string;
  status: "PENDING" | "APPROVED" | "CANCELLED";
  createdBy: { id: string; name: string; email: string };
};

export type PublicBookingForModal = {
  id: string;
  title: string;
  description: string | null;
  date: string | Date;
  startTime: string;
  endTime: string;
  approvedSpace: string | null;
  // Em runtime status é sempre "APPROVED" (filtrado no servidor), mas o tipo
  // do Prisma não estreita por WHERE — manter o enum completo aqui evita
  // cast desnecessário no calendar e mantém consistência com o modelo.
  status: "PENDING" | "APPROVED" | "CANCELLED";
};

export type BookingDetailsMode = "admin" | "owner" | "public";

type Props =
  | {
      mode: "admin" | "owner";
      booking: OwnerOrAdminBookingForModal | null;
      open: boolean;
      onOpenChange: (open: boolean) => void;
      onStatusChange?: (
        status: "PENDING" | "APPROVED" | "CANCELLED",
        approvedSpace?: string
      ) => Promise<void>;
      onDelete?: () => Promise<void>;
    }
  | {
      mode: "public";
      booking: PublicBookingForModal | null;
      open: boolean;
      onOpenChange: (open: boolean) => void;
    };

type ExternalGuest = { name: string; cpf: string; email?: string };

function isExternalGuest(g: unknown): g is ExternalGuest {
  if (typeof g !== "object" || g === null) return false;
  const obj = g as Record<string, unknown>;
  return typeof obj.name === "string" && typeof obj.cpf === "string";
}

export function BookingDetailsModal(props: Props) {
  const [approvedSpace, setApprovedSpace] = useState<string>("");
  const [statusChanging, setStatusChanging] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!props.booking) return;
    if (props.mode === "public") {
      setApprovedSpace(props.booking.approvedSpace ?? "");
    } else {
      setApprovedSpace(
        props.booking.approvedSpace ?? props.booking.spaceFirstOption
      );
    }
  }, [props.booking, props.mode]);

  if (!props.booking) return null;

  const externalGuests =
    (props.mode === "admin" || props.mode === "owner") &&
    Array.isArray(props.booking.externalGuests)
      ? (props.booking.externalGuests as unknown[]).filter(isExternalGuest)
      : [];

  const handleStatus = async (
    status: "PENDING" | "APPROVED" | "CANCELLED",
    approvedSpaceArg?: string
  ) => {
    if (props.mode !== "admin" || !props.onStatusChange) return;
    setStatusChanging(true);
    try {
      await props.onStatusChange(status, approvedSpaceArg);
    } finally {
      setStatusChanging(false);
    }
  };

  const handleDeleteClick = async () => {
    if (props.mode !== "admin" || !props.onDelete) return;
    setDeleting(true);
    try {
      await props.onDelete();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[520px]">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-lg">
            Detalhes do agendamento
            <span className="mt-1 block text-sm font-normal text-muted-foreground">
              {format(new Date(props.booking.date), "EEEE, dd 'de' MMMM", {
                locale: ptBR,
              })}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Evento */}
          <section className="space-y-2">
            <h3 className="text-sm font-semibold">Evento</h3>
            <p className="font-medium">{props.booking.title}</p>
            <p className="text-sm text-muted-foreground">
              {props.booking.startTime} – {props.booking.endTime}
            </p>
            {props.booking.description && (
              <p className="whitespace-pre-wrap text-sm text-foreground/80">
                {props.booking.description}
              </p>
            )}
          </section>

          <Separator />

          {/* Espaço */}
          <section className="space-y-2">
            <h3 className="text-sm font-semibold">Espaço</h3>
            {props.booking.approvedSpace ? (
              <p className="text-sm">
                <span className="text-muted-foreground">Aprovado:</span>{" "}
                <span className="font-medium">
                  {getSpaceLabel(props.booking.approvedSpace)}
                </span>
              </p>
            ) : props.mode === "public" ? (
              <p className="text-sm text-muted-foreground">
                Espaço não informado
              </p>
            ) : (
              <p className="text-sm">
                1ª {getSpaceLabel(props.booking.spaceFirstOption)} · 2ª{" "}
                {getSpaceLabel(props.booking.spaceSecondOption)}
              </p>
            )}
          </section>

          {(props.mode === "admin" || props.mode === "owner") && (
            <>
              <Separator />

              {/* Solicitante */}
              <section className="space-y-2">
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <User className="size-4" />
                  Solicitante
                </h3>
                <p className="text-sm font-medium">
                  {props.booking.createdBy.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {props.booking.createdBy.email}
                </p>
              </section>

              <Separator />

              {/* Contato */}
              <section className="space-y-2">
                <h3 className="text-sm font-semibold">Contato</h3>
                <p className="text-sm">Clube: {props.booking.clubEmail}</p>
                <p className="text-sm">
                  Representante: {props.booking.representativeEmail}
                </p>
              </section>

              {externalGuests.length > 0 && (
                <>
                  <Separator />
                  <section className="space-y-2">
                    <h3 className="text-sm font-semibold">Convidados externos</h3>
                    <ul className="space-y-1 text-sm">
                      {externalGuests.map((g, i) => (
                        <li key={i}>
                          {g.name} · CPF {g.cpf}
                          {g.email ? ` · ${g.email}` : ""}
                        </li>
                      ))}
                    </ul>
                  </section>
                </>
              )}
            </>
          )}

          {props.mode === "admin" && (
            <>
              <Separator />

              <section className="space-y-4">
                <h3 className="text-sm font-semibold">Ações</h3>

                {props.booking.status === "PENDING" && (
                  <div className="space-y-3">
                    <div className="grid gap-2">
                      <span className="text-sm text-muted-foreground">
                        Espaço a aprovar
                      </span>
                      <Select
                        value={approvedSpace}
                        onValueChange={setApprovedSpace}
                        disabled={statusChanging}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={props.booking.spaceFirstOption}>
                            1ª opção: {getSpaceLabel(props.booking.spaceFirstOption)}
                          </SelectItem>
                          <SelectItem value={props.booking.spaceSecondOption}>
                            2ª opção: {getSpaceLabel(props.booking.spaceSecondOption)}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        onClick={() => handleStatus("APPROVED", approvedSpace)}
                        disabled={statusChanging || !approvedSpace}
                      >
                        Aprovar
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleStatus("CANCELLED")}
                        disabled={statusChanging}
                      >
                        Cancelar pedido
                      </Button>
                    </div>
                  </div>
                )}

                {props.booking.status === "APPROVED" && (
                  <div className="space-y-3">
                    <div className="grid gap-1 text-sm">
                      <p>
                        <span className="text-muted-foreground">Status:</span>{" "}
                        <span className="font-medium text-green-700 dark:text-green-300">
                          Aprovado
                        </span>
                      </p>
                      {props.booking.approvedSpace && (
                        <p>
                          <span className="text-muted-foreground">
                            Espaço aprovado:
                          </span>{" "}
                          <span className="font-medium">
                            {getSpaceLabel(props.booking.approvedSpace)}
                          </span>
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleStatus("CANCELLED")}
                        disabled={statusChanging}
                      >
                        Cancelar evento
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleStatus("PENDING")}
                        disabled={statusChanging}
                      >
                        Voltar para pendente
                      </Button>
                    </div>
                  </div>
                )}

                {props.booking.status === "CANCELLED" && (
                  <div className="space-y-3">
                    <p className="text-sm">
                      <span className="text-muted-foreground">Status:</span>{" "}
                      <span className="font-medium text-red-700 dark:text-red-300">
                        Cancelado
                      </span>
                    </p>
                    <div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleStatus("PENDING")}
                        disabled={statusChanging}
                      >
                        Voltar para pendente
                      </Button>
                    </div>
                  </div>
                )}

                <Separator />

                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteClick}
                  disabled={deleting}
                  className="gap-2"
                >
                  <Trash2 className="size-4" />
                  Excluir
                </Button>
              </section>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
