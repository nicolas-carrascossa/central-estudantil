import { z } from "zod/v3";

export const bookingStatusSchema = z.enum(["PENDING", "APPROVED", "CANCELLED"]);

const cpfSchema = z
  .string()
  .refine((val) => val && /^\d{11}$/.test(val.replace(/\D/g, "")), "CPF inválido");

const externalGuestSchema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  cpf: cpfSchema,
  email: z.string().email("E-mail inválido").optional(),
});

export const createBookingSchema = z.object({
  title: z.string().min(1, "Nome do evento é obrigatório").max(200),
  date: z.coerce.date(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Horário inválido (use HH:mm)"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Horário inválido (use HH:mm)"),
  spaceFirstOption: z.string().min(1, "Selecione a primeira opção de espaço"),
  spaceSecondOption: z.string().min(1, "Selecione a segunda opção de espaço"),
  externalGuests: z.array(externalGuestSchema).default([]),
  clubEmail: z.string().email("Email do clube inválido"),
  representativeEmail: z.string().email("Email do representante inválido"),
  status: bookingStatusSchema.default("PENDING"),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type ExternalGuest = z.infer<typeof externalGuestSchema>;
