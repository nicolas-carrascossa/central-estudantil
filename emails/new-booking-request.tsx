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

interface NewBookingRequestEmailProps {
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  spaceFirstOption: string;
  spaceSecondOption: string;
  clubEmail: string;
  representativeEmail: string;
}

export default function NewBookingRequestEmail({
  title,
  date,
  startTime,
  endTime,
  spaceFirstOption,
  spaceSecondOption,
  clubEmail,
  representativeEmail,
}: NewBookingRequestEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Nova solicitação de agendamento: {title}</Preview>
      <Tailwind>
        <Body className="bg-gray-100 font-sans">
          <Container className="mx-auto my-8 max-w-lg rounded-lg bg-white p-6 shadow-md">
            <Heading className="text-xl font-bold text-gray-900">
              Nova Solicitação de Agendamento
            </Heading>

            <Section className="mt-4 rounded-md bg-gray-50 p-4">
              <Text className="m-0 text-sm text-gray-700">
                <strong>Evento:</strong> {title}
              </Text>
              <Text className="m-0 text-sm text-gray-700">
                <strong>Data:</strong> {date}
              </Text>
              <Text className="m-0 text-sm text-gray-700">
                <strong>Horário:</strong> {startTime} — {endTime}
              </Text>
            </Section>

            <Hr className="my-4" />

            <Section className="rounded-md bg-gray-50 p-4">
              <Text className="m-0 text-sm text-gray-700">
                <strong>Espaço preferencial:</strong> {spaceFirstOption}
              </Text>
              <Text className="m-0 text-sm text-gray-700">
                <strong>Espaço alternativo:</strong> {spaceSecondOption}
              </Text>
            </Section>

            <Hr className="my-4" />

            <Text className="mb-1 mt-4 text-sm text-gray-700">
              <strong>E-mail da Liga:</strong> {clubEmail}
            </Text>
            <Text className="m-0 text-sm text-gray-700">
              <strong>E-mail do Representante:</strong> {representativeEmail}
            </Text>

            <Hr className="my-4" />

            <Text className="mt-4 text-xs text-gray-500">
              Acesse o painel administrativo para aprovar ou rejeitar esta
              solicitação.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
