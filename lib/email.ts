import { Resend } from "resend";
import { env } from "@/lib/env";
import NewBookingRequestEmail from "@/emails/new-booking-request";
import BookingStatusUpdateEmail from "@/emails/booking-status-update";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const resend = new Resend(env.RESEND_API_KEY);

export async function sendNewBookingRequestEmail(params: {
  to: string;
  title: string;
  date: Date;
  startTime: string;
  endTime: string;
  spaceFirstOption: string;
  spaceSecondOption: string;
  clubEmail: string;
  representativeEmail: string;
}) {
  const { to, title, date, startTime, endTime, spaceFirstOption, spaceSecondOption, clubEmail, representativeEmail } = params;

  const formattedDate = format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });

  const result = await resend.emails.send({
    to,
    subject: `Nova solicitação de agendamento: ${title}`,
    react: NewBookingRequestEmail({
      title,
      date: formattedDate,
      startTime,
      endTime,
      spaceFirstOption,
      spaceSecondOption,
      clubEmail,
      representativeEmail,
    }),
    from: env.RESEND_FROM_EMAIL,
  });
  if (result.error) {
    console.error("[Resend] envio rejeitado:", result.error);
    throw new Error(
      `Resend rejeitou: ${result.error.name} — ${result.error.message}`
    );
  }
}

export async function sendBookingStatusUpdateEmail(params: {
  to: string | string[];
  bcc?: string[];
  title: string;
  status: "APPROVED" | "CANCELLED";
}) {
  const { to, bcc, title, status } = params;

  const subjectPrefix = status === "APPROVED" ? "Aprovado" : "Cancelado";

  const result = await resend.emails.send({
    to,
    bcc,
    subject: `Agendamento ${subjectPrefix}: ${title}`,
    react: BookingStatusUpdateEmail({ title, status }),
    from: env.RESEND_FROM_EMAIL,
  });
  if (result.error) {
    console.error("[Resend] envio rejeitado:", result.error);
    throw new Error(
      `Resend rejeitou: ${result.error.name} — ${result.error.message}`
    );
  }
}
