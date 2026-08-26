import type { Metadata } from "next";

import { WorkIndex } from "@/features/work-items/components/work-index";
import { getTicketTypes, getWorkInventory } from "@/features/work-items/queries";

export const metadata: Metadata = { title: "Work" };

export default async function WorkPage() {
  const [items, ticketTypes] = await Promise.all([
    getWorkInventory(),
    getTicketTypes(),
  ]);

  return <WorkIndex items={items} ticketTypes={ticketTypes} />;
}
