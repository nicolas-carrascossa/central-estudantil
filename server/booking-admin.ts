"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

import prisma from "@/lib/db";
import { auth } from "@/lib/auth";
import { sendBookingStatusUpdateEmail } from "@/lib/email";

function isAdmin(session: { user: { role?: string | null } } | null): boolean {
  return session?.user?.role === "admin";
}

export async function adminGetBookingsByMonth(year: number, month: number) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !isAdmin(session)) return [];

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  const bookings = await prisma.booking.findMany({
    where: {
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

export async function adminUpdateBookingStatus(
  id: string,
  status: "PENDING" | "APPROVED" | "CANCELLED",
  approvedSpace?: string
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !isAdmin(session)) {
    return { success: false, error: "Não autorizado" };
  }

  try {
    if (status === "APPROVED") {
      if (!approvedSpace) {
        return {
          success: false,
          error: "Espaço aprovado é obrigatório ao aprovar",
        };
      }
      const booking = await prisma.booking.findUnique({
        where: { id },
        select: { spaceFirstOption: true, spaceSecondOption: true },
      });
      if (!booking) {
        return { success: false, error: "Agendamento não encontrado" };
      }
      if (
        approvedSpace !== booking.spaceFirstOption &&
        approvedSpace !== booking.spaceSecondOption
      ) {
        return {
          success: false,
          error: "Espaço aprovado deve ser uma das opções solicitadas",
        };
      }
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: {
        status,
        approvedSpace: status === "APPROVED" ? approvedSpace : null,
      },
    });
    revalidatePath("/z_admin");

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

export async function adminDeleteBooking(id: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !isAdmin(session)) {
    return { success: false, error: "Não autorizado" };
  }

  try {
    await prisma.booking.delete({
      where: { id },
    });
    revalidatePath("/z_admin");
    return { success: true };
  } catch (err) {
    console.error("Erro ao excluir agendamento:", err);
    return { success: false, error: "Erro ao excluir agendamento" };
  }
}
