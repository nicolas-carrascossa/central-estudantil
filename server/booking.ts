"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

import prisma from "@/lib/db";
import { auth } from "@/lib/auth";
import { Prisma } from "@/lib/generated/prisma/client";
import { createBookingSchema, type CreateBookingInput } from "@/lib/schemas/booking";
import { sendNewBookingRequestEmail, sendBookingStatusUpdateEmail } from "@/lib/email";
import { env } from "@/lib/env";

const PUBLIC_BOOKING_SELECT = {
  id: true,
  title: true,
  description: true,
  date: true,
  startTime: true,
  endTime: true,
  approvedSpace: true,
  status: true,
} satisfies Prisma.BookingSelect;

const OWNED_BOOKING_INCLUDE = {
  createdBy: {
    select: { id: true, name: true, email: true },
  },
} satisfies Prisma.BookingInclude;

export type OwnedBookingDTO = Prisma.BookingGetPayload<{
  include: typeof OWNED_BOOKING_INCLUDE;
}> & { isOwn: true };

export type PublicBookingDTO = Prisma.BookingGetPayload<{
  select: typeof PUBLIC_BOOKING_SELECT;
}> & { isOwn: false };

export type BookingDTO = OwnedBookingDTO | PublicBookingDTO;

// Minimização de dados (LGPD art. 6º, IX): bookings de outros usuários só
// trazem campos públicos (sem CPF de convidados, sem e-mails de contato, sem
// identificação do solicitante). Em vez de filtrar campos no JS após o fetch,
// fazemos duas queries com `include`/`select` distintos — assim o payload sai
// do banco já minimizado e nunca é serializado pro cliente. A flag `isOwn`
// discrimina os dois shapes na união retornada.
export async function getBookingsByMonth(
  year: number,
  month: number
): Promise<BookingDTO[]> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return [];

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);
  const userId = session.user.id;

  const [owned, publicBookings] = await Promise.all([
    prisma.booking.findMany({
      where: {
        createdById: userId,
        date: { gte: startDate, lte: endDate },
      },
      include: OWNED_BOOKING_INCLUDE,
    }),
    prisma.booking.findMany({
      where: {
        createdById: { not: userId },
        status: "APPROVED",
        date: { gte: startDate, lte: endDate },
      },
      select: PUBLIC_BOOKING_SELECT,
    }),
  ]);

  const merged: BookingDTO[] = [
    ...owned.map((b) => ({ ...b, isOwn: true as const })),
    ...publicBookings.map((b) => ({ ...b, isOwn: false as const })),
  ];

  // Ordenação invariante (date asc, startTime asc) garantida no servidor
  // independente da ordem de chegada das duas queries. localeCompare é seguro
  // pra startTime porque o formato é sempre "HH:mm" com 2 dígitos zero-padded
  // — comparação lexicográfica equivale à cronológica nesse formato fixo.
  merged.sort((a, b) => {
    const dateDiff = a.date.getTime() - b.date.getTime();
    if (dateDiff !== 0) return dateDiff;
    return a.startTime.localeCompare(b.startTime);
  });

  return merged;
}

export async function createBooking(input: CreateBookingInput) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return { success: false, error: "Não autorizado" };
  }

  const data = {
    ...input,
    externalGuests: input.externalGuests.filter(
      (g) => g.name?.trim() && g.cpf?.replace(/\D/g, "").length === 11
    ),
  };

  const parsed = createBookingSchema.safeParse(data);
  if (!parsed.success) {
    const err = parsed.error;
    const firstIssue = err.issues[0];
    const message = firstIssue?.message ?? "Dados inválidos";
    return {
      success: false,
      error: String(message),
    };
  }

  const bookingDate = new Date(parsed.data.date);
  bookingDate.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (bookingDate < today) {
    return { success: false, error: "Não é possível agendar em data passada" };
  }

  try {
    const { externalGuests, ...rest } = parsed.data;
    const booking = await prisma.booking.create({
      data: {
        ...rest,
        externalGuests:
          externalGuests.length > 0 ? externalGuests : [],
        createdById: session.user.id,
      },
    });
    revalidatePath("/calendar-page");
    revalidatePath("/dashboard");

    try {
      await sendNewBookingRequestEmail({
        to: env.SECRETARIA_EMAIL,
        title: booking.title,
        date: booking.date,
        startTime: booking.startTime,
        endTime: booking.endTime,
        spaceFirstOption: booking.spaceFirstOption,
        spaceSecondOption: booking.spaceSecondOption,
        clubEmail: booking.clubEmail,
        representativeEmail: booking.representativeEmail,
      });
    } catch (emailErr) {
      console.error("Erro ao enviar e-mail de nova solicitação:", emailErr);
    }

    return { success: true };
  } catch (err) {
    console.error("Erro ao criar agendamento:", err);
    return { success: false, error: "Erro ao salvar agendamento" };
  }
}

export async function updateBookingStatus(
  id: string,
  status: "PENDING" | "APPROVED" | "CANCELLED"
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return { success: false, error: "Não autorizado" };
  }

  try {
    const updated = await prisma.booking.update({
      where: {
        id,
        createdById: session.user.id,
      },
      data: { status },
    });
    revalidatePath("/calendar-page");
    revalidatePath("/dashboard");

    if (status === "APPROVED" || status === "CANCELLED") {
      try {
        await sendBookingStatusUpdateEmail({
          to: updated.clubEmail,
          title: updated.title,
          status,
        });
      } catch (emailErr) {
        console.error("Erro ao enviar e-mail de atualização de status:", emailErr);
      }
    }

    return { success: true };
  } catch (err) {
    console.error("Erro ao atualizar agendamento:", err);
    return { success: false, error: "Erro ao atualizar agendamento" };
  }
}

export async function deleteBooking(id: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return { success: false, error: "Não autorizado" };
  }

  try {
    await prisma.booking.delete({
      where: {
        id,
        createdById: session.user.id,
      },
    });
    revalidatePath("/calendar-page");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err) {
    console.error("Erro ao excluir agendamento:", err);
    return { success: false, error: "Erro ao excluir agendamento" };
  }
}
