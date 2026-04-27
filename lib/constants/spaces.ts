export const SPACE_OPTIONS = [
  { value: "auditorio", label: "Auditório" },
  { value: "sala-reuniao-1", label: "Sala de Reunião 1" },
  { value: "sala-reuniao-2", label: "Sala de Reunião 2" },
  { value: "sala-coworking", label: "Sala Co-working" },
  { value: "laboratorio", label: "Laboratório" },
  { value: "sala-eventos", label: "Sala de Eventos" },
] as const;

export type SpaceValue = (typeof SPACE_OPTIONS)[number]["value"];

export function getSpaceLabel(value: string): string {
  return SPACE_OPTIONS.find((s) => s.value === value)?.label ?? value;
}
