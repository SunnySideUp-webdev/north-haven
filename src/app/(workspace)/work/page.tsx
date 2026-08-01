import type { Metadata } from "next";

import { WorkIndex } from "@/features/work-items/components/work-index";
import { getWorkInventory } from "@/features/work-items/queries";

export const metadata: Metadata = { title: "Work" };

export default async function WorkPage() {
  const items = await getWorkInventory();
  return <WorkIndex items={items} />;
}
