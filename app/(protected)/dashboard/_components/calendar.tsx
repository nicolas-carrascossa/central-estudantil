"use client";

import { useCallback, useEffect, useState } from "react";
import {
  addMonths,
  addWeeks,
  subMonths,
  subWeeks,
  startOfMonth,
  startOfDay,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isBefore,
  isSameMonth,
  isSameDay,
  isToday,
  getMonth,
  getYear,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ChevronLeft,
  ChevronRight,
  CalendarPlus,
  Plus,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { CreateBookingInput } from "@/lib/schemas/booking";
import { createBooking, getBookingsByMonth } from "@/server/booking";
import { SPACE_OPTIONS } from "@/lib/constants/spaces";
import { toast } from "sonner";

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

type BookingFromDb = Awaited<ReturnType<typeof getBookingsByMonth>>[number];

export function Calendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [bookings, setBookings] = useState<BookingFromDb[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSpaceModalOpen, setIsSpaceModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState<CreateBookingInput>({
    title: "",
    description: "",
    date: new Date(),
    startTime: "09:00",
    endTime: "10:00",
    spaceFirstOption: "",
    spaceSecondOption: "",
    externalGuests: [],
    clubEmail: "",
    representativeEmail: "",
    status: "PENDING",
  });

  const fetchBookings = useCallback(async (date: Date) => {
    setIsLoading(true);
    try {
      const data = await getBookingsByMonth(getYear(date), getMonth(date) + 1);
      setBookings(data);
    } catch {
      toast.error("Erro ao carregar agendamentos");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchBookings(currentMonth);
  }, [currentMonth, fetchBookings]);

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextWeek = () => {
    const next = addWeeks(currentWeek, 1);
    setCurrentWeek(next);
    setCurrentMonth(next); // mantém fetch no mês correto
  };
  const prevWeek = () => {
    const prev = subWeeks(currentWeek, 1);
    setCurrentWeek(prev);
    setCurrentMonth(prev);
  };
  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    setCurrentWeek(today);
  };

  const openModal = (date: Date) => {
    setSelectedDate(date);
    setForm({
      title: "",
      description: "",
      date,
      startTime: "09:00",
      endTime: "10:00",
      spaceFirstOption: "",
      spaceSecondOption: "",
      externalGuests: [],
      clubEmail: "",
      representativeEmail: "",
      status: "PENDING",
    });
    setIsModalOpen(true);
  };

  const addExternalGuest = () => {
    setForm((prev) => ({
      ...prev,
      externalGuests: [...prev.externalGuests, { name: "", cpf: "", email: "" }],
    }));
  };

  const updateExternalGuest = (
    index: number,
    field: "name" | "cpf" | "email",
    value: string,
  ) => {
    setForm((prev) => ({
      ...prev,
      externalGuests: prev.externalGuests.map((g, i) =>
        i === index
          ? {
              ...g,
              [field]: field === "cpf" ? value.replace(/\D/g, "") : value,
            }
          : g,
      ),
    }));
  };

  const removeExternalGuest = (index: number) => {
    setForm((prev) => ({
      ...prev,
      externalGuests: prev.externalGuests.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate) return;

    setIsSubmitting(true);
    const result = await createBooking({
      ...form,
      date: selectedDate,
    });

    if (result.success) {
      toast.success("Agendamento criado com sucesso");
      setIsModalOpen(false);
      void fetchBookings(currentMonth);
    } else {
      toast.error(result.error ?? "Erro ao criar agendamento");
    }
    setIsSubmitting(false);
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const monthStartDate = startOfWeek(monthStart);
  const monthEndDate = endOfWeek(monthEnd);
  const monthDays = eachDayOfInterval({
    start: monthStartDate,
    end: monthEndDate,
  });

  const weekStart = startOfWeek(currentWeek);
  const weekEnd = endOfWeek(currentWeek);
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const today = startOfDay(new Date());
  const isPast = (date: Date) => isBefore(startOfDay(date), today);

  const DayCell = ({
    day,
    isCurrentMonth,
  }: {
    day: Date;
    isCurrentMonth: boolean;
  }) => {
    const dayBookings = bookings.filter((b) =>
      isSameDay(new Date(b.date), day),
    );
    const past = isPast(day);
    return (
      <div
        role={past ? undefined : "button"}
        tabIndex={past ? -1 : 0}
        onClick={() => !past && openModal(day)}
        onKeyDown={(e) => {
          if (!past && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            openModal(day);
          }
        }}
        className={cn(
          "group relative flex flex-col overflow-hidden rounded-md border border-border p-2 transition-colors md:min-h-[100px]",
          past
            ? "cursor-not-allowed bg-muted/40 opacity-60"
            : "cursor-pointer hover:bg-muted/50",
          !past && (isCurrentMonth ? "bg-card" : "bg-muted/30"),
        )}
      >
        <div className="flex items-start justify-between">
          <span
            className={cn(
              "flex size-7 items-center justify-center rounded-md text-xs font-medium",
              isToday(day)
                ? "bg-primary text-primary-foreground"
                : isCurrentMonth
                  ? "text-foreground"
                  : "text-muted-foreground",
            )}
          >
            {format(day, "d")}
          </span>
          {!past && (
            <CalendarPlus className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hidden md:block" />
          )}
        </div>
        <div className="mt-2 flex flex-1 flex-col gap-1 overflow-y-auto">
          {dayBookings.map((booking) => (
            <div
              key={booking.id}
              className={cn(
                "truncate rounded px-1.5 py-1 text-[10px] font-medium",
                booking.status === "APPROVED"
                  ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200"
                  : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200",
              )}
              title={`${booking.startTime} - ${booking.title} (${booking.createdBy.name})`}
            >
              <span className="font-bold opacity-75">{booking.startTime} </span>
              <span className="truncate">{booking.title}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex w-full flex-1 flex-col">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 sm:gap-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={prevWeek}
            disabled={isLoading}
            aria-label="Semana anterior"
            className="md:hidden"
          >
            <ChevronLeft className="size-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={prevMonth}
            disabled={isLoading}
            aria-label="Mês anterior"
            className="hidden md:flex"
          >
            <ChevronLeft className="size-5" />
          </Button>

          <h2 className="min-w-[140px] text-center text-lg font-bold capitalize text-primary sm:w-40 sm:text-xl md:text-2xl">
            <span className="md:hidden">
              {format(weekStart, "d")} -{" "}
              {format(weekEnd, "d MMM", { locale: ptBR })}
            </span>
            <span className="hidden md:inline">
              {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
            </span>
          </h2>

          <Button
            variant="ghost"
            size="icon"
            onClick={nextWeek}
            disabled={isLoading}
            aria-label="Próxima semana"
            className="md:hidden"
          >
            <ChevronRight className="size-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={nextMonth}
            disabled={isLoading}
            aria-label="Próximo mês"
            className="hidden md:flex"
          >
            <ChevronRight className="size-5" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={goToToday}
            className="ml-2"
          >
            Hoje
          </Button>
        </div>

        <div className="flex items-center gap-4 rounded-md border border-border bg-card px-4 py-2 text-sm font-medium">
          <div className="flex items-center gap-2">
            <span className="size-3 rounded-full bg-yellow-400" />
            Pendente
          </div>
          <div className="flex items-center gap-2">
            <span className="size-3 rounded-full bg-green-500" />
            Aprovado
          </div>
        </div>
      </div>

      {/* Mobile: semana em coluna */}
      <div className="flex flex-col gap-2 rounded-lg md:hidden">
        {weekDays.map((day, index) => {
          const past = isPast(day);
          return (
            <div
              key={index}
              role={past ? undefined : "button"}
              tabIndex={past ? -1 : 0}
              onClick={() => !past && openModal(day)}
              onKeyDown={(e) => {
                if (!past && (e.key === "Enter" || e.key === " ")) {
                  e.preventDefault();
                  openModal(day);
                }
              }}
              className={cn(
                "flex items-center gap-3 rounded-lg border border-border p-3 transition-colors",
                past
                  ? "cursor-not-allowed bg-muted/40 opacity-60"
                  : "cursor-pointer bg-card active:bg-muted/50",
                !past && !isSameMonth(day, currentMonth) && "opacity-70",
              )}
            >
              <div className="flex w-16 shrink-0 flex-col items-center">
                <span className="text-xs font-medium text-muted-foreground">
                  {WEEKDAYS[day.getDay()]}
                </span>
                <span
                  className={cn(
                    "mt-0.5 flex size-9 items-center justify-center rounded-lg text-sm font-semibold",
                    isToday(day)
                      ? "bg-primary text-primary-foreground"
                      : isSameMonth(day, currentMonth)
                        ? "bg-muted text-foreground"
                        : "bg-muted/80 text-muted-foreground",
                  )}
                >
                  {format(day, "d")}
                </span>
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                {bookings
                  .filter((b) => isSameDay(new Date(b.date), day))
                  .map((booking) => (
                    <div
                      key={booking.id}
                      className={cn(
                        "truncate rounded px-2 py-1 text-xs font-medium",
                        booking.status === "APPROVED"
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200"
                          : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200",
                      )}
                      title={`${booking.startTime} - ${booking.title} (${booking.createdBy.name})`}
                    >
                      {booking.startTime} {booking.title}
                    </div>
                  ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop: mês completo */}
      <div className="hidden w-full overflow-hidden rounded-lg border border-border bg-card shadow-sm md:block">
        <div className="grid grid-cols-7 bg-primary py-2 text-sm font-semibold text-primary-foreground">
          {WEEKDAYS.map((day) => (
            <div key={day} className="text-center">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1 p-1">
          {monthDays.map((day, index) => (
            <DayCell
              key={index}
              day={day}
              isCurrentMonth={isSameMonth(day, currentMonth)}
            />
          ))}
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[520px]">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-lg">
              Solicitar agendamento
              {selectedDate && (
                <span className="mt-1 block text-sm font-normal text-muted-foreground">
                  {format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Seção: Evento */}
            <section className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground">Evento</h3>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Nome do evento</Label>
                  <Input
                    id="title"
                    placeholder="Ex: Hackathon, Reunião Tech..."
                    className="bg-muted/60 border-border"
                    value={form.title}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, title: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="startTime">Horário de início</Label>
                    <Input
                      id="startTime"
                      type="time"
                      className="bg-muted/60 border-border"
                      value={form.startTime}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          startTime: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="endTime">Horário de fim</Label>
                    <Input
                      id="endTime"
                      type="time"
                      className="bg-muted/60 border-border"
                      value={form.endTime}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          endTime: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Descrição (opcional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Descreva o evento, agenda, observações..."
                    className="min-h-[80px] bg-muted/60 border-border"
                    value={form.description ?? ""}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    maxLength={2000}
                  />
                </div>
              </div>
            </section>

            <Separator />

            {/* Seção: Espaço */}
            <section className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground">Espaço</h3>
              <div className="grid gap-2">
                <Label>Espaços desejados</Label>
                <Button
                  type="button"
                  variant="outline"
                  className="h-auto justify-start bg-muted/60 py-3 text-left font-normal"
                  onClick={() => setIsSpaceModalOpen(true)}
                >
                  {form.spaceFirstOption && form.spaceSecondOption ? (
                    <span>
                      1ª{" "}
                      {
                        SPACE_OPTIONS.find(
                          (o) => o.value === form.spaceFirstOption,
                        )?.label
                      }{" "}
                      · 2ª{" "}
                      {
                        SPACE_OPTIONS.find(
                          (o) => o.value === form.spaceSecondOption,
                        )?.label
                      }
                    </span>
                  ) : (
                    <span className="text-muted-foreground">
                      Clique para selecionar 1ª e 2ª opção
                    </span>
                  )}
                </Button>
              </div>
            </section>

            <Dialog open={isSpaceModalOpen} onOpenChange={setIsSpaceModalOpen}>
              <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                  <DialogTitle>Espaços desejados</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label>1ª opção</Label>
                    <Select
                      value={form.spaceFirstOption}
                      onValueChange={(val) =>
                        setForm((prev) => ({ ...prev, spaceFirstOption: val }))
                      }
                    >
                      <SelectTrigger className="bg-muted/60 border-border">
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {SPACE_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>2ª opção</Label>
                    <Select
                      value={form.spaceSecondOption}
                      onValueChange={(val) =>
                        setForm((prev) => ({ ...prev, spaceSecondOption: val }))
                      }
                    >
                      <SelectTrigger className="bg-muted/60 border-border">
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {SPACE_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    type="button"
                    onClick={() => setIsSpaceModalOpen(false)}
                  >
                    Confirmar
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Separator />

            {/* Seção: Convidados externos */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">
                  Convidados externos
                </h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1"
                  onClick={addExternalGuest}
                >
                  <Plus className="size-4" />
                  Adicionar
                </Button>
              </div>
              {form.externalGuests.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">
                  Nenhum convidado externo. Clique em Adicionar para incluir.
                </p>
              ) : (
                <div className="space-y-3">
                  {form.externalGuests.map((guest, index) => (
                    <div
                      key={index}
                      className="flex gap-2 rounded-lg border border-border bg-muted/30 p-3"
                    >
                      <div className="flex flex-1 flex-col gap-2 sm:flex-row">
                        <Input
                          placeholder="Nome completo"
                          className="flex-1 bg-background"
                          value={guest.name}
                          onChange={(e) =>
                            updateExternalGuest(index, "name", e.target.value)
                          }
                        />
                        <Input
                          placeholder="CPF (apenas números)"
                          className="w-full bg-background sm:w-32"
                          value={guest.cpf}
                          onChange={(e) =>
                            updateExternalGuest(index, "cpf", e.target.value)
                          }
                          maxLength={11}
                        />
                        <Input
                          placeholder="E-mail"
                          type="email"
                          className="flex-1 bg-background"
                          value={guest.email ?? ""}
                          onChange={(e) =>
                            updateExternalGuest(index, "email", e.target.value)
                          }
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => removeExternalGuest(index)}
                        aria-label="Remover convidado"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <Separator />

            {/* Seção: Contato */}
            <section className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground">Contato</h3>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="clubEmail">Email do clube</Label>
                  <Input
                    id="clubEmail"
                    type="email"
                    placeholder="clube@inteli.edu.br"
                    className="bg-muted/60 border-border"
                    value={form.clubEmail}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        clubEmail: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="representativeEmail">
                    Email do representante
                  </Label>
                  <Input
                    id="representativeEmail"
                    type="email"
                    placeholder="representante@email.com"
                    className="bg-muted/60 border-border"
                    value={form.representativeEmail}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        representativeEmail: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
              </div>
            </section>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                Salvar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
