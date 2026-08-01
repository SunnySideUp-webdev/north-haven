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
      daily_plan_items: {
        Row: {
          completed_at: string | null;
          created_at: string;
          daily_plan_id: string;
          deferred_to_plan_id: string | null;
          execution_status: Database["public"]["Enums"]["plan_execution_status"];
          id: string;
          outcome_note: string | null;
          position: number;
          started_at: string | null;
          updated_at: string;
          work_item_id: string;
          workspace_id: string;
        };
        Insert: {
          completed_at?: string | null;
          created_at?: string;
          daily_plan_id: string;
          deferred_to_plan_id?: string | null;
          execution_status?: Database["public"]["Enums"]["plan_execution_status"];
          id?: string;
          outcome_note?: string | null;
          position: number;
          started_at?: string | null;
          updated_at?: string;
          work_item_id: string;
          workspace_id: string;
        };
        Update: {
          completed_at?: string | null;
          created_at?: string;
          daily_plan_id?: string;
          deferred_to_plan_id?: string | null;
          execution_status?: Database["public"]["Enums"]["plan_execution_status"];
          id?: string;
          outcome_note?: string | null;
          position?: number;
          started_at?: string | null;
          updated_at?: string;
          work_item_id?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "daily_plan_items_daily_plan_id_workspace_id_fkey";
            columns: ["daily_plan_id", "workspace_id"];
            isOneToOne: false;
            referencedRelation: "daily_plans";
            referencedColumns: ["id", "workspace_id"];
          },
          {
            foreignKeyName: "daily_plan_items_deferred_to_plan_id_workspace_id_fkey";
            columns: ["deferred_to_plan_id", "workspace_id"];
            isOneToOne: false;
            referencedRelation: "daily_plans";
            referencedColumns: ["id", "workspace_id"];
          },
          {
            foreignKeyName: "daily_plan_items_work_item_id_workspace_id_fkey";
            columns: ["work_item_id", "workspace_id"];
            isOneToOne: false;
            referencedRelation: "work_inventory_rows";
            referencedColumns: ["id", "workspace_id"];
          },
          {
            foreignKeyName: "daily_plan_items_work_item_id_workspace_id_fkey";
            columns: ["work_item_id", "workspace_id"];
            isOneToOne: false;
            referencedRelation: "work_items";
            referencedColumns: ["id", "workspace_id"];
          },
        ];
      };
      daily_plans: {
        Row: {
          closed_at: string | null;
          created_at: string;
          end_of_day_step: number;
          id: string;
          intention: string | null;
          ready_at: string | null;
          status: Database["public"]["Enums"]["daily_plan_status"];
          updated_at: string;
          work_date: string;
          workspace_id: string;
        };
        Insert: {
          closed_at?: string | null;
          created_at?: string;
          end_of_day_step?: number;
          id?: string;
          intention?: string | null;
          ready_at?: string | null;
          status?: Database["public"]["Enums"]["daily_plan_status"];
          updated_at?: string;
          work_date: string;
          workspace_id: string;
        };
        Update: {
          closed_at?: string | null;
          created_at?: string;
          end_of_day_step?: number;
          id?: string;
          intention?: string | null;
          ready_at?: string | null;
          status?: Database["public"]["Enums"]["daily_plan_status"];
          updated_at?: string;
          work_date?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "daily_plans_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      day_notes: {
        Row: {
          body: string;
          created_at: string;
          id: string;
          is_important: boolean;
          updated_at: string;
          work_date: string;
          workspace_id: string;
        };
        Insert: {
          body: string;
          created_at?: string;
          id?: string;
          is_important?: boolean;
          updated_at?: string;
          work_date: string;
          workspace_id: string;
        };
        Update: {
          body?: string;
          created_at?: string;
          id?: string;
          is_important?: boolean;
          updated_at?: string;
          work_date?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "day_notes_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
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
      non_working_days: {
        Row: {
          allows_urgent_work: boolean;
          created_at: string;
          id: string;
          kind: Database["public"]["Enums"]["non_working_day_kind"];
          source: Database["public"]["Enums"]["non_working_day_source"];
          source_event_id: string | null;
          work_date: string;
          workspace_id: string;
        };
        Insert: {
          allows_urgent_work?: boolean;
          created_at?: string;
          id?: string;
          kind: Database["public"]["Enums"]["non_working_day_kind"];
          source: Database["public"]["Enums"]["non_working_day_source"];
          source_event_id?: string | null;
          work_date: string;
          workspace_id: string;
        };
        Update: {
          allows_urgent_work?: boolean;
          created_at?: string;
          id?: string;
          kind?: Database["public"]["Enums"]["non_working_day_kind"];
          source?: Database["public"]["Enums"]["non_working_day_source"];
          source_event_id?: string | null;
          work_date?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "non_working_days_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
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
      work_logs: {
        Row: {
          created_at: string;
          daily_plan_item_id: string | null;
          ended_at: string | null;
          id: string;
          is_automatic: boolean;
          outcome: Database["public"]["Enums"]["work_log_outcome"];
          started_at: string | null;
          work_item_id: string;
          worked_on: string;
          workspace_id: string;
        };
        Insert: {
          created_at?: string;
          daily_plan_item_id?: string | null;
          ended_at?: string | null;
          id?: string;
          is_automatic?: boolean;
          outcome: Database["public"]["Enums"]["work_log_outcome"];
          started_at?: string | null;
          work_item_id: string;
          worked_on: string;
          workspace_id: string;
        };
        Update: {
          created_at?: string;
          daily_plan_item_id?: string | null;
          ended_at?: string | null;
          id?: string;
          is_automatic?: boolean;
          outcome?: Database["public"]["Enums"]["work_log_outcome"];
          started_at?: string | null;
          work_item_id?: string;
          worked_on?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "work_logs_daily_plan_item_id_workspace_id_fkey";
            columns: ["daily_plan_item_id", "workspace_id"];
            isOneToOne: false;
            referencedRelation: "daily_plan_items";
            referencedColumns: ["id", "workspace_id"];
          },
          {
            foreignKeyName: "work_logs_work_item_id_workspace_id_fkey";
            columns: ["work_item_id", "workspace_id"];
            isOneToOne: false;
            referencedRelation: "work_inventory_rows";
            referencedColumns: ["id", "workspace_id"];
          },
          {
            foreignKeyName: "work_logs_work_item_id_workspace_id_fkey";
            columns: ["work_item_id", "workspace_id"];
            isOneToOne: false;
            referencedRelation: "work_items";
            referencedColumns: ["id", "workspace_id"];
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
      apply_end_of_day_outcome: {
        Args: {
          chosen_deferred_date?: string;
          chosen_outcome: Database["public"]["Enums"]["work_log_outcome"];
          target_daily_plan_item_id: string;
        };
        Returns: undefined;
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
      create_ticket_type: { Args: { chosen_name: string }; Returns: string };
      current_personal_workspace_id: { Args: never; Returns: string };
      finish_end_of_day: {
        Args: { chosen_work_date: string };
        Returns: string;
      };
      is_workspace_member: {
        Args: { target_workspace_id: string };
        Returns: boolean;
      };
      is_workspace_owner: {
        Args: { target_workspace_id: string };
        Returns: boolean;
      };
      move_daily_plan_item: {
        Args: { chosen_direction: number; target_daily_plan_item_id: string };
        Returns: undefined;
      };
      move_ticket_type: {
        Args: { chosen_direction: number; target_ticket_type_id: string };
        Returns: undefined;
      };
      next_workday: { Args: { chosen_after_date: string }; Returns: string };
      resolve_end_of_day_follow_up: {
        Args: {
          chosen_decision: Database["public"]["Enums"]["follow_up_decision"];
          chosen_review_on?: string;
          target_follow_up_id: string;
        };
        Returns: undefined;
      };
      save_day_note: {
        Args: {
          chosen_body: string;
          chosen_is_important: boolean;
          chosen_work_date: string;
        };
        Returns: undefined;
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
      set_daily_plan_item_done: {
        Args: { chosen_done: boolean; target_daily_plan_item_id: string };
        Returns: undefined;
      };
      set_end_of_day_step: {
        Args: { chosen_step: number; chosen_work_date: string };
        Returns: string;
      };
      set_plan_item_selected: {
        Args: {
          chosen_selected: boolean;
          chosen_work_date: string;
          target_work_item_id: string;
        };
        Returns: string;
      };
      transition_follow_up: {
        Args: {
          chosen_state: Database["public"]["Enums"]["follow_up_state"];
          target_follow_up_id: string;
        };
        Returns: undefined;
      };
      update_daily_plan_details: {
        Args: {
          chosen_intention: string;
          chosen_mark_ready: boolean;
          chosen_work_date: string;
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
      update_ticket_type: {
        Args: {
          chosen_is_active: boolean;
          chosen_name: string;
          target_ticket_type_id: string;
        };
        Returns: undefined;
      };
    };
    Enums: {
      daily_plan_status: "draft" | "ready" | "active" | "closed";
      follow_up_decision:
        | "still_waiting"
        | "response_received"
        | "external_completed"
        | "no_longer_relevant";
      follow_up_state: "open" | "completed" | "cancelled";
      non_working_day_kind: "out_of_office" | "holiday" | "manual";
      non_working_day_source: "google" | "manual";
      plan_execution_status:
        | "planned"
        | "in_progress"
        | "done"
        | "returned"
        | "deferred"
        | "skipped";
      status_dimension: "operational" | "tracking" | "backup" | "execution";
      ticket_operational_status:
        "pending" | "in_progress" | "waiting_response" | "resolved";
      ticket_priority: "urgent" | "high" | "medium" | "low";
      work_item_kind: "ticket" | "task" | "reminder";
      work_log_outcome:
        "worked" | "done" | "returned" | "deferred" | "watching" | "skipped";
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
      daily_plan_status: ["draft", "ready", "active", "closed"],
      follow_up_decision: [
        "still_waiting",
        "response_received",
        "external_completed",
        "no_longer_relevant",
      ],
      follow_up_state: ["open", "completed", "cancelled"],
      non_working_day_kind: ["out_of_office", "holiday", "manual"],
      non_working_day_source: ["google", "manual"],
      plan_execution_status: [
        "planned",
        "in_progress",
        "done",
        "returned",
        "deferred",
        "skipped",
      ],
      status_dimension: ["operational", "tracking", "backup", "execution"],
      ticket_operational_status: [
        "pending",
        "in_progress",
        "waiting_response",
        "resolved",
      ],
      ticket_priority: ["urgent", "high", "medium", "low"],
      work_item_kind: ["ticket", "task", "reminder"],
      work_log_outcome: [
        "worked",
        "done",
        "returned",
        "deferred",
        "watching",
        "skipped",
      ],
      work_tracking_state: ["active", "watching", "closed", "archived"],
    },
  },
} as const;
