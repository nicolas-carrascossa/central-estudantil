import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
  Tailwind,
} from "@react-email/components";

interface BookingStatusUpdateEmailProps {
  title: string;
  status: "APPROVED" | "CANCELLED";
}

export default function BookingStatusUpdateEmail({
  title,
  status,
}: BookingStatusUpdateEmailProps) {
  const isApproved = status === "APPROVED";

  return (
    <Html>
      <Head />
      <Preview>
        Agendamento {isApproved ? "aprovado" : "cancelado"}: {title}
      </Preview>
      <Tailwind>
        <Body className="bg-gray-100 font-sans">
          <Container className="mx-auto my-8 max-w-lg rounded-lg bg-white p-6 shadow-md">
            <Heading
              className={
                isApproved
                  ? "text-xl font-bold text-green-700"
                  : "text-xl font-bold text-red-700"
              }
            >
              Agendamento {isApproved ? "Aprovado" : "Cancelado"}
            </Heading>

            <Section className="mt-4 rounded-md bg-gray-50 p-4">
              <Text className="m-0 text-sm text-gray-700">
                <strong>Evento:</strong> {title}
              </Text>
              <Text className="m-0 text-sm text-gray-700">
                <strong>Status:</strong> {isApproved ? "Aprovado" : "Cancelado"}
              </Text>
            </Section>

            <Hr className="my-4" />

            {isApproved ? (
              <Text className="text-sm text-gray-700">
                Sua solicitação foi aprovada com sucesso. O evento já foi
                adicionado ao calendário oficial. Compareça no dia e horário
                agendados.
              </Text>
            ) : (
              <Text className="text-sm text-gray-700">
                Sua solicitação foi cancelada. Caso acredite que houve um erro
                ou desejar mais informações, entre em contato com a Secretaria.
              </Text>
            )}

            <Hr className="my-4" />

            <Text className="mt-4 text-xs text-gray-500">
              Esta é uma mensagem automática. Não é necessário responder.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
