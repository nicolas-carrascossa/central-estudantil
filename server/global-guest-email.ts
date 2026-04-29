"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

import prisma from "@/lib/db";
import { auth } from "@/lib/auth";
import { Prisma } from "@/lib/generated/prisma/client";
import {
  createGlobalGuestEmailSchema,
  type CreateGlobalGuestEmailInput,
} from "@/lib/schemas/global-guest-email";

function isAdmin(session: { user: { role?: string | null } } | null): boolean {
  return session?.user?.role === "admin";
}

export async function listGlobalGuestEmails() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !isAdmin(session)) return [];

  return prisma.globalGuestEmail.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function createGlobalGuestEmail(input: CreateGlobalGuestEmailInput) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !isAdmin(session)) {
    return { success: false, error: "Não autorizado" };
  }

  const parsed = createGlobalGuestEmailSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Email inválido" };
  }

  try {
    await prisma.globalGuestEmail.create({
      data: { email: parsed.data.email },
    });
    revalidatePath("/z_admin");
    return { success: true };
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return { success: false, error: "Esse email já está cadastrado." };
    }
    console.error("Erro ao adicionar convidado global:", err);
    return { success: false, error: "Erro ao adicionar email" };
  }
}

export async function deleteGlobalGuestEmail(id: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !isAdmin(session)) {
    return { success: false, error: "Não autorizado" };
  }

  try {
    await prisma.globalGuestEmail.delete({ where: { id } });
    revalidatePath("/z_admin");
    return { success: true };
  } catch (err) {
    console.error("Erro ao remover convidado global:", err);
    return { success: false, error: "Erro ao remover email" };
  }
}
