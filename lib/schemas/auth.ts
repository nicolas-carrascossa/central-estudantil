import { z } from "zod/v3";

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Senha deve ter pelo menos 8 caracteres"),
});


export type LoginSchemaType = z.infer<typeof loginSchema>;
