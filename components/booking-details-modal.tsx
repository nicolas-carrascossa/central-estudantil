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

export type BookingForModal = {
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

export type BookingDetailsMode = "admin" | "owner" | "public";

type Props = {
  booking: BookingForModal | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: BookingDetailsMode;
  onStatusChange?: (
    status: "PENDING" | "APPROVED" | "CANCELLED",
    approvedSpace?: string
  ) => Promise<void>;
  onDelete?: () => Promise<void>;
};

type ExternalGuest = { name: string; cpf: string; email?: string };

function isExternalGuest(g: unknown): g is ExternalGuest {
  if (typeof g !== "object" || g === null) return false;
  const obj = g as Record<string, unknown>;
  return typeof obj.name === "string" && typeof obj.cpf === "string";
}

export function BookingDetailsModal({
  booking,
  open,
  onOpenChange,
  mode,
  onStatusChange,
  onDelete,
}: Props) {
  const [approvedSpace, setApprovedSpace] = useState<string>("");
  const [statusChanging, setStatusChanging] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (booking) {
      setApprovedSpace(booking.approvedSpace ?? booking.spaceFirstOption);
    }
  }, [booking]);

  if (!booking) return null;

  const showPrivateInfo = mode === "admin" || mode === "owner";
  const showActions = mode === "admin";
  const externalGuests = Array.isArray(booking.externalGuests)
    ? (booking.externalGuests as unknown[]).filter(isExternalGuest)
    : [];

  const handleStatus = async (
    status: "PENDING" | "APPROVED" | "CANCELLED",
    approvedSpaceArg?: string
  ) => {
    if (!onStatusChange) return;
    setStatusChanging(true);
    try {
      await onStatusChange(status, approvedSpaceArg);
    } finally {
      setStatusChanging(false);
    }
  };

  const handleDeleteClick = async () => {
    if (!onDelete) return;
    setDeleting(true);
    try {
      await onDelete();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[520px]">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-lg">
            Detalhes do agendamento
            <span className="mt-1 block text-sm font-normal text-muted-foreground">
              {format(new Date(booking.date), "EEEE, dd 'de' MMMM", {
                locale: ptBR,
              })}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Evento */}
          <section className="space-y-2">
            <h3 className="text-sm font-semibold">Evento</h3>
            <p className="font-medium">{booking.title}</p>
            <p className="text-sm text-muted-foreground">
              {booking.startTime} – {booking.endTime}
            </p>
            {booking.description && (
              <p className="whitespace-pre-wrap text-sm text-foreground/80">
                {booking.description}
              </p>
            )}
          </section>

          <Separator />

          {/* Espaço */}
          <section className="space-y-2">
            <h3 className="text-sm font-semibold">Espaço</h3>
            {booking.approvedSpace ? (
              <p className="text-sm">
                <span className="text-muted-foreground">Aprovado:</span>{" "}
                <span className="font-medium">
                  {getSpaceLabel(booking.approvedSpace)}
                </span>
              </p>
            ) : (
              <p className="text-sm">
                1ª {getSpaceLabel(booking.spaceFirstOption)} · 2ª{" "}
                {getSpaceLabel(booking.spaceSecondOption)}
              </p>
            )}
          </section>

          {showPrivateInfo && (
            <>
              <Separator />

              {/* Solicitante */}
              <section className="space-y-2">
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <User className="size-4" />
                  Solicitante
                </h3>
                <p className="text-sm font-medium">{booking.createdBy.name}</p>
                <p className="text-sm text-muted-foreground">
                  {booking.createdBy.email}
                </p>
              </section>

              <Separator />

              {/* Contato */}
              <section className="space-y-2">
                <h3 className="text-sm font-semibold">Contato</h3>
                <p className="text-sm">Clube: {booking.clubEmail}</p>
                <p className="text-sm">
                  Representante: {booking.representativeEmail}
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

          {showActions && (
            <>
              <Separator />

              <section className="space-y-4">
                <h3 className="text-sm font-semibold">Ações</h3>

                {booking.status === "PENDING" && (
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
                          <SelectItem value={booking.spaceFirstOption}>
                            1ª opção: {getSpaceLabel(booking.spaceFirstOption)}
                          </SelectItem>
                          <SelectItem value={booking.spaceSecondOption}>
                            2ª opção: {getSpaceLabel(booking.spaceSecondOption)}
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

                {booking.status === "APPROVED" && (
                  <div className="space-y-3">
                    <div className="grid gap-1 text-sm">
                      <p>
                        <span className="text-muted-foreground">Status:</span>{" "}
                        <span className="font-medium text-green-700 dark:text-green-300">
                          Aprovado
                        </span>
                      </p>
                      {booking.approvedSpace && (
                        <p>
                          <span className="text-muted-foreground">
                            Espaço aprovado:
                          </span>{" "}
                          <span className="font-medium">
                            {getSpaceLabel(booking.approvedSpace)}
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

                {booking.status === "CANCELLED" && (
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
