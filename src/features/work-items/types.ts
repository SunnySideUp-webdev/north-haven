import type { Database } from "@/server/database/supabase/database.types";

export type WorkInventoryRow =
  Database["public"]["Views"]["work_inventory_rows"]["Row"];
export type WorkItemKind = Database["public"]["Enums"]["work_item_kind"];
export type WorkTrackingState =
  Database["public"]["Enums"]["work_tracking_state"];

export type WorkFormState = {
  status: "idle" | "error";
  message?: string;
};

export const initialWorkFormState: WorkFormState = { status: "idle" };

export type TicketTypeOption = {
  id: string;
  name: string;
};
