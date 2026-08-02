export function formatTicketNumber(ticketNumber: string) {
  const value = ticketNumber.trim();
  return value.startsWith("#") ? value : `#${value}`;
}
