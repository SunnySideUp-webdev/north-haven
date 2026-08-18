export function formatTicketNumber(ticketNumber: string) {
  const value = ticketNumber.trim();
  if (value.toLowerCase() === "tracking ticket") return "Tracking Ticket";
  return value.startsWith("#") ? value : `#${value}`;
}
