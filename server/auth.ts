"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";

export const signIn = async (email: string, password: string) => {
  try {
    await auth.api.signInEmail({
      body: {
        email,
        password,
      },
      headers: await headers(),
    });
    return {
      success: true,
      message: "Login realizado com sucesso",
    };
  } catch (error) {
    return {
      success: false,
      message: (error as Error).message,
    };
  }
};

export const signOut = async () => {
  await auth.api.signOut({
    headers: await headers(),
  });
  redirect("/login");
};


