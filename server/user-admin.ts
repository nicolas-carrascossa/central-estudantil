"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";

function isAdmin(session: { user: { role?: string | null } } | null): boolean {
  return session?.user?.role === "admin";
}

export async function adminListUsers() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !isAdmin(session)) return { users: [], total: 0 };

  try {
    const result = await auth.api.listUsers({
      query: { limit: 100 },
      headers: await headers(),
    });
    const data = result as { users?: unknown[]; total?: number };
    return {
      users: data.users ?? [],
      total: data.total ?? 0,
    };
  } catch {
    return { users: [], total: 0 };
  }
}

const VALID_ROLES = ["user", "admin"] as const;

export async function adminUpdateUser(
  userId: string,
  data: { name?: string; email?: string; role?: string }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !isAdmin(session)) {
    return { success: false, error: "Não autorizado" };
  }

  if (!userId?.trim()) {
    return { success: false, error: "ID de usuário inválido" };
  }

  if (data.role !== undefined && !VALID_ROLES.includes(data.role as "user" | "admin")) {
    return { success: false, error: "Role inválido. Use 'user' ou 'admin'" };
  }

  try {
    await auth.api.adminUpdateUser({
      body: { userId, data },
      headers: await headers(),
    });
    revalidatePath("/z_admin");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Erro ao atualizar",
    };
  }
}

export async function adminRemoveUser(userId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !isAdmin(session)) {
    return { success: false, error: "Não autorizado" };
  }

  if (!userId?.trim()) {
    return { success: false, error: "ID de usuário inválido" };
  }

  try {
    await auth.api.removeUser({
      body: { userId },
      headers: await headers(),
    });
    revalidatePath("/z_admin");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Erro ao excluir",
    };
  }
}

export async function adminSetUserPassword(userId: string, newPassword: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !isAdmin(session)) {
    return { success: false, error: "Não autorizado" };
  }

  if (!userId?.trim()) {
    return { success: false, error: "ID de usuário inválido" };
  }

  if (!newPassword || newPassword.length < 8) {
    return { success: false, error: "A senha deve ter pelo menos 8 caracteres" };
  }

  try {
    await auth.api.setUserPassword({
      body: { userId, newPassword },
      headers: await headers(),
    });
    revalidatePath("/z_admin");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Erro ao alterar senha",
    };
  }
}

export async function adminCreateUser(input: {
  name: string;
  email: string;
  password: string;
  role: "user" | "admin";
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !isAdmin(session)) {
    return { success: false, error: "Não autorizado" };
  }

  if (!input.name?.trim()) {
    return { success: false, error: "Nome é obrigatório" };
  }
  if (!input.email?.trim()) {
    return { success: false, error: "Email é obrigatório" };
  }
  if (!input.password || input.password.length < 8) {
    return { success: false, error: "A senha deve ter pelo menos 8 caracteres" };
  }

  try {
    await auth.api.createUser({
      body: {
        name: input.name.trim(),
        email: input.email.trim().toLowerCase(),
        password: input.password,
        role: input.role,
      },
      headers: await headers(),
    });
    revalidatePath("/z_admin");
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro ao criar usuário";
    if (msg.includes("already") || msg.includes("existe")) {
      return { success: false, error: "Este email já está em uso" };
    }
    return { success: false, error: msg };
  }
}
