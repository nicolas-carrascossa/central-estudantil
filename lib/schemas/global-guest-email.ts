import { z } from "zod/v3";

export const createGlobalGuestEmailSchema = z.object({
  email: z.string().email("Email inválido"),
});

export type CreateGlobalGuestEmailInput = z.infer<typeof createGlobalGuestEmailSchema>;
