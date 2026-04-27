"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

import prisma from "@/lib/db";
import { auth } from "@/lib/auth";
import { createBookingSchema, type CreateBookingInput } from "@/lib/schemas/booking";
import { sendNewBookingRequestEmail, sendBookingStatusUpdateEmail } from "@/lib/email";
import { env } from "@/lib/env";

export async function getBookingsByMonth(year: number, month: number) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return [];

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  const bookings = await prisma.booking.findMany({
    where: {
      OR: [
        { createdById: session.user.id },
        { status: "APPROVED" }],
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      createdBy: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });

  return bookings;
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
