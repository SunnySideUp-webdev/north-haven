export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      follow_ups: {
        Row: {
          completed_at: string | null;
          created_at: string;
          created_by: string;
          id: string;
          reason: string;
          review_on: string | null;
          started_at: string;
          state: Database["public"]["Enums"]["follow_up_state"];
          updated_at: string;
          waiting_on: string | null;
          work_item_id: string;
          workspace_id: string;
        };
        Insert: {
          completed_at?: string | null;
          created_at?: string;
          created_by: string;
          id?: string;
          reason: string;
          review_on?: string | null;
          started_at?: string;
          state?: Database["public"]["Enums"]["follow_up_state"];
          updated_at?: string;
          waiting_on?: string | null;
          work_item_id: string;
          workspace_id: string;
        };
        Update: {
          completed_at?: string | null;
          created_at?: string;
          created_by?: string;
          id?: string;
          reason?: string;
          review_on?: string | null;
          started_at?: string;
          state?: Database["public"]["Enums"]["follow_up_state"];
          updated_at?: string;
          waiting_on?: string | null;
          work_item_id?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "follow_ups_work_item_id_workspace_id_fkey";
            columns: ["work_item_id", "workspace_id"];
            isOneToOne: false;
            referencedRelation: "work_inventory_rows";
            referencedColumns: ["id", "workspace_id"];
          },
          {
            foreignKeyName: "follow_ups_work_item_id_workspace_id_fkey";
            columns: ["work_item_id", "workspace_id"];
            isOneToOne: false;
            referencedRelation: "work_items";
            referencedColumns: ["id", "workspace_id"];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          display_name: string;
          id: string;
          setup_completed_at: string | null;
          time_zone: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          display_name?: string;
          id: string;
          setup_completed_at?: string | null;
          time_zone?: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          display_name?: string;
          id?: string;
          setup_completed_at?: string | null;
          time_zone?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      reminder_details: {
        Row: {
          acknowledged_at: string | null;
          created_at: string;
          kind: Database["public"]["Enums"]["work_item_kind"];
          remind_at: string;
          updated_at: string;
          work_item_id: string;
          workspace_id: string;
        };
        Insert: {
          acknowledged_at?: string | null;
          created_at?: string;
          kind?: Database["public"]["Enums"]["work_item_kind"];
          remind_at: string;
          updated_at?: string;
          work_item_id: string;
          workspace_id: string;
        };
        Update: {
          acknowledged_at?: string | null;
          created_at?: string;
          kind?: Database["public"]["Enums"]["work_item_kind"];
          remind_at?: string;
          updated_at?: string;
          work_item_id?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reminder_details_work_item_id_workspace_id_kind_fkey";
            columns: ["work_item_id", "workspace_id", "kind"];
            isOneToOne: false;
            referencedRelation: "work_inventory_rows";
            referencedColumns: ["id", "workspace_id", "kind"];
          },
          {
            foreignKeyName: "reminder_details_work_item_id_workspace_id_kind_fkey";
            columns: ["work_item_id", "workspace_id", "kind"];
            isOneToOne: false;
            referencedRelation: "work_items";
            referencedColumns: ["id", "workspace_id", "kind"];
          },
        ];
      };
      status_events: {
        Row: {
          changed_at: string;
          changed_by: string | null;
          from_value: string | null;
          id: string;
          status_dimension: Database["public"]["Enums"]["status_dimension"];
          to_value: string;
          work_item_id: string;
          workspace_id: string;
        };
        Insert: {
          changed_at?: string;
          changed_by?: string | null;
          from_value?: string | null;
          id?: string;
          status_dimension: Database["public"]["Enums"]["status_dimension"];
          to_value: string;
          work_item_id: string;
          workspace_id: string;
        };
        Update: {
          changed_at?: string;
          changed_by?: string | null;
          from_value?: string | null;
          id?: string;
          status_dimension?: Database["public"]["Enums"]["status_dimension"];
          to_value?: string;
          work_item_id?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "status_events_work_item_id_workspace_id_fkey";
            columns: ["work_item_id", "workspace_id"];
            isOneToOne: false;
            referencedRelation: "work_inventory_rows";
            referencedColumns: ["id", "workspace_id"];
          },
          {
            foreignKeyName: "status_events_work_item_id_workspace_id_fkey";
            columns: ["work_item_id", "workspace_id"];
            isOneToOne: false;
            referencedRelation: "work_items";
            referencedColumns: ["id", "workspace_id"];
          },
        ];
      };
      task_details: {
        Row: {
          completed_at: string | null;
          created_at: string;
          kind: Database["public"]["Enums"]["work_item_kind"];
          updated_at: string;
          work_item_id: string;
          workspace_id: string;
        };
        Insert: {
          completed_at?: string | null;
          created_at?: string;
          kind?: Database["public"]["Enums"]["work_item_kind"];
          updated_at?: string;
          work_item_id: string;
          workspace_id: string;
        };
        Update: {
          completed_at?: string | null;
          created_at?: string;
          kind?: Database["public"]["Enums"]["work_item_kind"];
          updated_at?: string;
          work_item_id?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "task_details_work_item_id_workspace_id_kind_fkey";
            columns: ["work_item_id", "workspace_id", "kind"];
            isOneToOne: false;
            referencedRelation: "work_inventory_rows";
            referencedColumns: ["id", "workspace_id", "kind"];
          },
          {
            foreignKeyName: "task_details_work_item_id_workspace_id_kind_fkey";
            columns: ["work_item_id", "workspace_id", "kind"];
            isOneToOne: false;
            referencedRelation: "work_items";
            referencedColumns: ["id", "workspace_id", "kind"];
          },
        ];
      };
      ticket_details: {
        Row: {
          closed_at: string | null;
          created_at: string;
          external_url: string | null;
          form_backup_completed_at: string | null;
          kind: Database["public"]["Enums"]["work_item_kind"];
          normalized_ticket_number: string | null;
          operational_status: Database["public"]["Enums"]["ticket_operational_status"];
          received_at: string;
          resolved_at: string | null;
          system_priority: Database["public"]["Enums"]["ticket_priority"];
          ticket_number: string;
          ticket_type_id: string;
          updated_at: string;
          work_item_id: string;
          workspace_id: string;
        };
        Insert: {
          closed_at?: string | null;
          created_at?: string;
          external_url?: string | null;
          form_backup_completed_at?: string | null;
          kind?: Database["public"]["Enums"]["work_item_kind"];
          normalized_ticket_number?: string | null;
          operational_status?: Database["public"]["Enums"]["ticket_operational_status"];
          received_at?: string;
          resolved_at?: string | null;
          system_priority?: Database["public"]["Enums"]["ticket_priority"];
          ticket_number: string;
          ticket_type_id: string;
          updated_at?: string;
          work_item_id: string;
          workspace_id: string;
        };
        Update: {
          closed_at?: string | null;
          created_at?: string;
          external_url?: string | null;
          form_backup_completed_at?: string | null;
          kind?: Database["public"]["Enums"]["work_item_kind"];
          normalized_ticket_number?: string | null;
          operational_status?: Database["public"]["Enums"]["ticket_operational_status"];
          received_at?: string;
          resolved_at?: string | null;
          system_priority?: Database["public"]["Enums"]["ticket_priority"];
          ticket_number?: string;
          ticket_type_id?: string;
          updated_at?: string;
          work_item_id?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ticket_details_ticket_type_id_workspace_id_fkey";
            columns: ["ticket_type_id", "workspace_id"];
            isOneToOne: false;
            referencedRelation: "ticket_types";
            referencedColumns: ["id", "workspace_id"];
          },
          {
            foreignKeyName: "ticket_details_work_item_id_workspace_id_kind_fkey";
            columns: ["work_item_id", "workspace_id", "kind"];
            isOneToOne: false;
            referencedRelation: "work_inventory_rows";
            referencedColumns: ["id", "workspace_id", "kind"];
          },
          {
            foreignKeyName: "ticket_details_work_item_id_workspace_id_kind_fkey";
            columns: ["work_item_id", "workspace_id", "kind"];
            isOneToOne: false;
            referencedRelation: "work_items";
            referencedColumns: ["id", "workspace_id", "kind"];
          },
        ];
      };
      ticket_types: {
        Row: {
          created_at: string;
          id: string;
          is_active: boolean;
          name: string;
          sort_order: number;
          updated_at: string;
          workspace_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          is_active?: boolean;
          name: string;
          sort_order?: number;
          updated_at?: string;
          workspace_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_active?: boolean;
          name?: string;
          sort_order?: number;
          updated_at?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ticket_types_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      work_item_notes: {
        Row: {
          body: string;
          created_at: string;
          created_by: string;
          id: string;
          is_pinned: boolean;
          updated_at: string;
          work_item_id: string;
          workspace_id: string;
        };
        Insert: {
          body: string;
          created_at?: string;
          created_by: string;
          id?: string;
          is_pinned?: boolean;
          updated_at?: string;
          work_item_id: string;
          workspace_id: string;
        };
        Update: {
          body?: string;
          created_at?: string;
          created_by?: string;
          id?: string;
          is_pinned?: boolean;
          updated_at?: string;
          work_item_id?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "work_item_notes_work_item_id_workspace_id_fkey";
            columns: ["work_item_id", "workspace_id"];
            isOneToOne: false;
            referencedRelation: "work_inventory_rows";
            referencedColumns: ["id", "workspace_id"];
          },
          {
            foreignKeyName: "work_item_notes_work_item_id_workspace_id_fkey";
            columns: ["work_item_id", "workspace_id"];
            isOneToOne: false;
            referencedRelation: "work_items";
            referencedColumns: ["id", "workspace_id"];
          },
        ];
      };
      work_items: {
        Row: {
          archived_at: string | null;
          created_at: string;
          created_by: string;
          description: string | null;
          due_at: string | null;
          id: string;
          kind: Database["public"]["Enums"]["work_item_kind"];
          title: string;
          tracking_state: Database["public"]["Enums"]["work_tracking_state"];
          updated_at: string;
          workspace_id: string;
        };
        Insert: {
          archived_at?: string | null;
          created_at?: string;
          created_by: string;
          description?: string | null;
          due_at?: string | null;
          id?: string;
          kind: Database["public"]["Enums"]["work_item_kind"];
          title: string;
          tracking_state?: Database["public"]["Enums"]["work_tracking_state"];
          updated_at?: string;
          workspace_id: string;
        };
        Update: {
          archived_at?: string | null;
          created_at?: string;
          created_by?: string;
          description?: string | null;
          due_at?: string | null;
          id?: string;
          kind?: Database["public"]["Enums"]["work_item_kind"];
          title?: string;
          tracking_state?: Database["public"]["Enums"]["work_tracking_state"];
          updated_at?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "work_items_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      work_schedules: {
        Row: {
          ends_at_local: string;
          starts_at_local: string;
          time_zone: string;
          working_weekdays: number[];
          workspace_id: string;
        };
        Insert: {
          ends_at_local?: string;
          starts_at_local?: string;
          time_zone?: string;
          working_weekdays?: number[];
          workspace_id: string;
        };
        Update: {
          ends_at_local?: string;
          starts_at_local?: string;
          time_zone?: string;
          working_weekdays?: number[];
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "work_schedules_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: true;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      workspace_members: {
        Row: {
          created_at: string;
          profile_id: string;
          role: string;
          workspace_id: string;
        };
        Insert: {
          created_at?: string;
          profile_id: string;
          role?: string;
          workspace_id: string;
        };
        Update: {
          created_at?: string;
          profile_id?: string;
          role?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "workspace_members_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "workspace_members_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      workspaces: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      work_inventory_rows: {
        Row: {
          archived_at: string | null;
          closed_at: string | null;
          created_at: string | null;
          description: string | null;
          due_at: string | null;
          external_url: string | null;
          form_backup_completed_at: string | null;
          id: string | null;
          kind: Database["public"]["Enums"]["work_item_kind"] | null;
          next_review_on: string | null;
          operational_status:
            Database["public"]["Enums"]["ticket_operational_status"] | null;
          received_at: string | null;
          remind_at: string | null;
          reminder_acknowledged_at: string | null;
          resolved_at: string | null;
          system_priority:
            Database["public"]["Enums"]["ticket_priority"] | null;
          task_completed_at: string | null;
          ticket_number: string | null;
          ticket_type_id: string | null;
          ticket_type_name: string | null;
          title: string | null;
          tracking_state:
            Database["public"]["Enums"]["work_tracking_state"] | null;
          updated_at: string | null;
          workspace_id: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "work_items_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Functions: {
      add_work_item_note: {
        Args: { chosen_body: string; target_work_item_id: string };
        Returns: string;
      };
      complete_initial_setup: {
        Args: {
          chosen_display_name: string;
          chosen_ends_at_local: string;
          chosen_starts_at_local: string;
          chosen_time_zone: string;
          chosen_working_weekdays: number[];
        };
        Returns: undefined;
      };
      create_reminder: {
        Args: {
          chosen_description?: string;
          chosen_remind_at: string;
          chosen_title: string;
        };
        Returns: string;
      };
      create_task: {
        Args: {
          chosen_description?: string;
          chosen_due_at?: string;
          chosen_title: string;
        };
        Returns: string;
      };
      create_ticket: {
        Args: {
          chosen_description?: string;
          chosen_external_url?: string;
          chosen_form_backup_complete?: boolean;
          chosen_note?: string;
          chosen_operational_status?: Database["public"]["Enums"]["ticket_operational_status"];
          chosen_received_at: string;
          chosen_system_priority?: Database["public"]["Enums"]["ticket_priority"];
          chosen_ticket_number: string;
          chosen_ticket_type_id: string;
          chosen_title: string;
        };
        Returns: string;
      };
      current_personal_workspace_id: { Args: never; Returns: string };
      is_workspace_member: {
        Args: { target_workspace_id: string };
        Returns: boolean;
      };
      is_workspace_owner: {
        Args: { target_workspace_id: string };
        Returns: boolean;
      };
      save_open_follow_up: {
        Args: {
          chosen_reason: string;
          chosen_review_on?: string;
          chosen_waiting_on?: string;
          target_work_item_id: string;
        };
        Returns: string;
      };
      update_reminder: {
        Args: {
          chosen_description?: string;
          chosen_remind_at: string;
          chosen_title: string;
          chosen_tracking_state: Database["public"]["Enums"]["work_tracking_state"];
          target_work_item_id: string;
        };
        Returns: undefined;
      };
      update_task: {
        Args: {
          chosen_description?: string;
          chosen_due_at?: string;
          chosen_title: string;
          chosen_tracking_state: Database["public"]["Enums"]["work_tracking_state"];
          target_work_item_id: string;
        };
        Returns: undefined;
      };
      update_ticket: {
        Args: {
          chosen_description?: string;
          chosen_external_url?: string;
          chosen_form_backup_complete?: boolean;
          chosen_operational_status: Database["public"]["Enums"]["ticket_operational_status"];
          chosen_received_at: string;
          chosen_system_priority: Database["public"]["Enums"]["ticket_priority"];
          chosen_ticket_number: string;
          chosen_ticket_type_id: string;
          chosen_title: string;
          chosen_tracking_state: Database["public"]["Enums"]["work_tracking_state"];
          target_work_item_id: string;
        };
        Returns: undefined;
      };
    };
    Enums: {
      follow_up_state: "open" | "completed" | "cancelled";
      status_dimension: "operational" | "tracking" | "backup";
      ticket_operational_status:
        "pending" | "in_progress" | "waiting_response" | "resolved";
      ticket_priority: "urgent" | "high" | "medium" | "low";
      work_item_kind: "ticket" | "task" | "reminder";
      work_tracking_state: "active" | "watching" | "closed" | "archived";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      follow_up_state: ["open", "completed", "cancelled"],
      status_dimension: ["operational", "tracking", "backup"],
      ticket_operational_status: [
        "pending",
        "in_progress",
        "waiting_response",
        "resolved",
      ],
      ticket_priority: ["urgent", "high", "medium", "low"],
      work_item_kind: ["ticket", "task", "reminder"],
      work_tracking_state: ["active", "watching", "closed", "archived"],
    },
  },
} as const;
