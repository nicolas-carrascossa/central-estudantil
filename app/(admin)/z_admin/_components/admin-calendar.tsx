"use client";

import { useCallback, useEffect, useState } from "react";
import {
  addMonths,
  addWeeks,
  subMonths,
  subWeeks,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  isToday,
  getMonth,
  getYear,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { BookingDetailsModal } from "@/components/booking-details-modal";
import { cn } from "@/lib/utils";
import {
  adminGetBookingsByMonth,
  adminUpdateBookingStatus,
  adminDeleteBooking,
} from "@/server/booking-admin";
import { toast } from "sonner";

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

type AdminBooking = Awaited<ReturnType<typeof adminGetBookingsByMonth>>[number];

export function AdminCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<AdminBooking | null>(
    null
  );

  const fetchBookings = useCallback(async (date: Date) => {
    setIsLoading(true);
    try {
      const data = await adminGetBookingsByMonth(
        getYear(date),
        getMonth(date) + 1
      );
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
    setCurrentMonth(next);
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

  const openDetailModal = (booking: AdminBooking, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedBooking(booking);
    setDetailModalOpen(true);
  };

  const handleStatusChange = async (
    status: "PENDING" | "APPROVED" | "CANCELLED",
    approvedSpace?: string
  ) => {
    if (!selectedBooking) return;
    const result = await adminUpdateBookingStatus(
      selectedBooking.id,
      status,
      approvedSpace
    );
    if (result.success) {
      const messages = {
        PENDING: "Voltado para pendente",
        APPROVED: "Agendamento aprovado",
        CANCELLED: "Agendamento cancelado",
      } as const;
      toast.success(messages[status]);
      setSelectedBooking((prev) =>
        prev
          ? {
              ...prev,
              status,
              approvedSpace:
                status === "APPROVED" ? (approvedSpace ?? null) : null,
            }
          : null
      );
      void fetchBookings(currentMonth);
    } else {
      toast.error(result.error ?? "Erro ao atualizar");
    }
  };

  const handleDelete = async () => {
    if (!selectedBooking) return;
    if (!confirm("Excluir este agendamento permanentemente?")) return;
    const result = await adminDeleteBooking(selectedBooking.id);
    if (result.success) {
      toast.success("Agendamento excluído");
      setDetailModalOpen(false);
      setSelectedBooking(null);
      void fetchBookings(currentMonth);
    } else {
      toast.error(result.error ?? "Erro ao excluir");
    }
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

  const getStatusStyles = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200";
      case "CANCELLED":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200";
      default:
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200";
    }
  };

  const DayCell = ({
    day,
    isCurrentMonth,
  }: {
    day: Date;
    isCurrentMonth: boolean;
  }) => {
    const dayBookings = bookings.filter((b) =>
      isSameDay(new Date(b.date), day)
    );
    return (
      <div
        className={cn(
          "group relative flex flex-col overflow-hidden rounded-md border border-border p-2 transition-colors md:min-h-[100px]",
          isCurrentMonth ? "bg-card" : "bg-muted/30"
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
                  : "text-muted-foreground"
            )}
          >
            {format(day, "d")}
          </span>
        </div>
        <div className="mt-2 flex flex-1 flex-col gap-1 overflow-y-auto">
          {dayBookings.map((booking) => (
            <button
              key={booking.id}
              type="button"
              onClick={(e) => openDetailModal(booking, e)}
              className={cn(
                "truncate rounded px-1.5 py-1 text-left text-[10px] font-medium transition-opacity hover:opacity-90",
                getStatusStyles(booking.status)
              )}
              title={`${booking.startTime} - ${booking.title} (${booking.createdBy.name})`}
            >
              <span className="font-bold opacity-75">{booking.startTime} </span>
              <span className="truncate">{booking.title}</span>
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="mx-auto flex min-w-0 max-w-6xl flex-1 flex-col">
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
              {format(weekStart, "d")} - {format(weekEnd, "d MMM", { locale: ptBR })}
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

        <div className="flex flex-wrap items-center gap-4 rounded-md border border-border bg-card px-4 py-2 text-sm font-medium">
          <div className="flex items-center gap-2">
            <span className="size-3 rounded-full bg-yellow-400" />
            Pendente
          </div>
          <div className="flex items-center gap-2">
            <span className="size-3 rounded-full bg-green-500" />
            Aprovado
          </div>
          <div className="flex items-center gap-2">
            <span className="size-3 rounded-full bg-red-500" />
            Cancelado
          </div>
        </div>
      </div>

      {/* Mobile: semana em coluna */}
      <div className="flex flex-col gap-2 rounded-lg md:hidden">
        {weekDays.map((day, index) => (
          <div
            key={index}
            className={cn(
              "flex items-center gap-3 rounded-lg border border-border p-3 transition-colors bg-card",
              !isSameMonth(day, currentMonth) && "opacity-70"
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
                      : "bg-muted/80 text-muted-foreground"
                )}
              >
                {format(day, "d")}
              </span>
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              {bookings
                .filter((b) => isSameDay(new Date(b.date), day))
                .map((booking) => (
                  <button
                    key={booking.id}
                    type="button"
                    onClick={() => openDetailModal(booking)}
                    className={cn(
                      "truncate rounded px-2 py-1 text-left text-xs font-medium transition-opacity hover:opacity-90",
                      getStatusStyles(booking.status)
                    )}
                  >
                    {booking.startTime} {booking.title} · {booking.createdBy.name}
                  </button>
                ))}
            </div>
          </div>
        ))}
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

      <BookingDetailsModal
        booking={selectedBooking}
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        mode="admin"
        onStatusChange={handleStatusChange}
        onDelete={handleDelete}
      />
    </div>
  );
}
