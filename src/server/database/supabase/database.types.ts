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
      calendar_connections: {
        Row: {
          access_token_encrypted: string;
          access_token_expires_at: string;
          account_label: string;
          created_at: string;
          id: string;
          last_error_code: string | null;
          last_synced_at: string | null;
          provider: string;
          provider_account_id: string;
          refresh_token_encrypted: string;
          scopes: string[];
          status: Database["public"]["Enums"]["calendar_connection_status"];
          updated_at: string;
          workspace_id: string;
        };
        Insert: {
          access_token_encrypted: string;
          access_token_expires_at: string;
          account_label: string;
          created_at?: string;
          id?: string;
          last_error_code?: string | null;
          last_synced_at?: string | null;
          provider?: string;
          provider_account_id: string;
          refresh_token_encrypted: string;
          scopes?: string[];
          status?: Database["public"]["Enums"]["calendar_connection_status"];
          updated_at?: string;
          workspace_id: string;
        };
        Update: {
          access_token_encrypted?: string;
          access_token_expires_at?: string;
          account_label?: string;
          created_at?: string;
          id?: string;
          last_error_code?: string | null;
          last_synced_at?: string | null;
          provider?: string;
          provider_account_id?: string;
          refresh_token_encrypted?: string;
          scopes?: string[];
          status?: Database["public"]["Enums"]["calendar_connection_status"];
          updated_at?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "calendar_connections_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      calendar_day_appearances: {
        Row: {
          color: Database["public"]["Enums"]["calendar_day_color"];
          created_at: string;
          id: string;
          updated_at: string;
          work_date: string;
          workspace_id: string;
        };
        Insert: {
          color: Database["public"]["Enums"]["calendar_day_color"];
          created_at?: string;
          id?: string;
          updated_at?: string;
          work_date: string;
          workspace_id: string;
        };
        Update: {
          color?: Database["public"]["Enums"]["calendar_day_color"];
          created_at?: string;
          id?: string;
          updated_at?: string;
          work_date?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "calendar_day_appearances_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      calendar_outcome_recovery: {
        Row: {
          attendance_status: Database["public"]["Enums"]["meeting_attendance_status"];
          confirmed_at: string | null;
          created_at: string;
          id: string;
          local_note: string | null;
          provider_calendar_id: string;
          provider_event_id: string;
          workspace_id: string;
        };
        Insert: {
          attendance_status: Database["public"]["Enums"]["meeting_attendance_status"];
          confirmed_at?: string | null;
          created_at?: string;
          id?: string;
          local_note?: string | null;
          provider_calendar_id: string;
          provider_event_id: string;
          workspace_id: string;
        };
        Update: {
          attendance_status?: Database["public"]["Enums"]["meeting_attendance_status"];
          confirmed_at?: string | null;
          created_at?: string;
          id?: string;
          local_note?: string | null;
          provider_calendar_id?: string;
          provider_event_id?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "calendar_outcome_recovery_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
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
      external_calendar_events: {
        Row: {
          created_at: string;
          end_local_date: string;
          ends_at: string;
          event_type: Database["public"]["Enums"]["external_calendar_event_type"];
          external_calendar_id: string;
          ical_uid: string | null;
          id: string;
          is_all_day: boolean;
          meeting_url: string | null;
          provider_event_id: string;
          provider_updated_at: string | null;
          provider_url: string | null;
          start_local_date: string;
          starts_at: string;
          status: string;
          synced_at: string;
          title: string;
          updated_at: string;
          workspace_id: string;
        };
        Insert: {
          created_at?: string;
          end_local_date: string;
          ends_at: string;
          event_type?: Database["public"]["Enums"]["external_calendar_event_type"];
          external_calendar_id: string;
          ical_uid?: string | null;
          id?: string;
          is_all_day?: boolean;
          meeting_url?: string | null;
          provider_event_id: string;
          provider_updated_at?: string | null;
          provider_url?: string | null;
          start_local_date: string;
          starts_at: string;
          status?: string;
          synced_at?: string;
          title?: string;
          updated_at?: string;
          workspace_id: string;
        };
        Update: {
          created_at?: string;
          end_local_date?: string;
          ends_at?: string;
          event_type?: Database["public"]["Enums"]["external_calendar_event_type"];
          external_calendar_id?: string;
          ical_uid?: string | null;
          id?: string;
          is_all_day?: boolean;
          meeting_url?: string | null;
          provider_event_id?: string;
          provider_updated_at?: string | null;
          provider_url?: string | null;
          start_local_date?: string;
          starts_at?: string;
          status?: string;
          synced_at?: string;
          title?: string;
          updated_at?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "external_calendar_events_external_calendar_id_workspace_id_fkey";
            columns: ["external_calendar_id", "workspace_id"];
            isOneToOne: false;
            referencedRelation: "external_calendars";
            referencedColumns: ["id", "workspace_id"];
          },
        ];
      };
      external_calendars: {
        Row: {
          calendar_connection_id: string;
          created_at: string;
          id: string;
          is_primary: boolean;
          is_selected: boolean;
          last_synced_at: string | null;
          name: string;
          provider_calendar_id: string;
          sync_token: string | null;
          time_zone: string | null;
          updated_at: string;
          workspace_id: string;
        };
        Insert: {
          calendar_connection_id: string;
          created_at?: string;
          id?: string;
          is_primary?: boolean;
          is_selected?: boolean;
          last_synced_at?: string | null;
          name: string;
          provider_calendar_id: string;
          sync_token?: string | null;
          time_zone?: string | null;
          updated_at?: string;
          workspace_id: string;
        };
        Update: {
          calendar_connection_id?: string;
          created_at?: string;
          id?: string;
          is_primary?: boolean;
          is_selected?: boolean;
          last_synced_at?: string | null;
          name?: string;
          provider_calendar_id?: string;
          sync_token?: string | null;
          time_zone?: string | null;
          updated_at?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "external_calendars_calendar_connection_id_workspace_id_fkey";
            columns: ["calendar_connection_id", "workspace_id"];
            isOneToOne: false;
            referencedRelation: "calendar_connections";
            referencedColumns: ["id", "workspace_id"];
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
      meeting_outcomes: {
        Row: {
          attendance_status: Database["public"]["Enums"]["meeting_attendance_status"];
          confirmed_at: string | null;
          created_at: string;
          external_calendar_event_id: string;
          id: string;
          local_note: string | null;
          updated_at: string;
          workspace_id: string;
        };
        Insert: {
          attendance_status?: Database["public"]["Enums"]["meeting_attendance_status"];
          confirmed_at?: string | null;
          created_at?: string;
          external_calendar_event_id: string;
          id?: string;
          local_note?: string | null;
          updated_at?: string;
          workspace_id: string;
        };
        Update: {
          attendance_status?: Database["public"]["Enums"]["meeting_attendance_status"];
          confirmed_at?: string | null;
          created_at?: string;
          external_calendar_event_id?: string;
          id?: string;
          local_note?: string | null;
          updated_at?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "meeting_outcomes_external_calendar_event_id_workspace_id_fkey";
            columns: ["external_calendar_event_id", "workspace_id"];
            isOneToOne: false;
            referencedRelation: "external_calendar_events";
            referencedColumns: ["id", "workspace_id"];
          },
        ];
      };
      month_notes: {
        Row: {
          body: string;
          created_at: string;
          id: string;
          month_start: string;
          updated_at: string;
          workspace_id: string;
        };
        Insert: {
          body: string;
          created_at?: string;
          id?: string;
          month_start: string;
          updated_at?: string;
          workspace_id: string;
        };
        Update: {
          body?: string;
          created_at?: string;
          id?: string;
          month_start?: string;
          updated_at?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "month_notes_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
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
      report_export_attempts: {
        Row: {
          id: string;
          profile_id: string;
          requested_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          requested_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          requested_at?: string;
        };
        Relationships: [];
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
          last_worked_on: string | null;
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
      apply_calendar_outcome_recovery: {
        Args: { target_workspace_id: string };
        Returns: number;
      };
      apply_end_of_day_outcome: {
        Args: {
          chosen_deferred_date?: string;
          chosen_outcome: Database["public"]["Enums"]["work_log_outcome"];
          target_daily_plan_item_id: string;
        };
        Returns: undefined;
      };
      bulk_add_work_items_to_plan: {
        Args: { chosen_work_date: string; target_work_item_ids: string[] };
        Returns: number;
      };
      bulk_archive_work_items: {
        Args: { target_work_item_ids: string[] };
        Returns: number;
      };
      bulk_set_follow_up_review: {
        Args: { chosen_review_on: string; target_work_item_ids: string[] };
        Returns: number;
      };
      claim_report_export_slot: { Args: never; Returns: boolean };
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
      create_workspace_backup: { Args: never; Returns: Json };
      create_workspace_backup_core: { Args: never; Returns: Json };
      current_personal_workspace_id: { Args: never; Returns: string };
      find_ticket_by_number: {
        Args: { chosen_ticket_number: string };
        Returns: string;
      };
      finish_end_of_day: {
        Args: { chosen_work_date: string };
        Returns: string;
      };
      global_work_search: {
        Args: { chosen_include_archived?: boolean; chosen_query: string };
        Returns: {
          id: string;
          kind: Database["public"]["Enums"]["work_item_kind"];
          match_reason: string;
          operational_status: Database["public"]["Enums"]["ticket_operational_status"];
          ticket_number: string;
          ticket_type_name: string;
          title: string;
          tracking_state: Database["public"]["Enums"]["work_tracking_state"];
          updated_at: string;
        }[];
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
      next_plannable_date: {
        Args: { chosen_after_date: string };
        Returns: string;
      };
      next_workday: { Args: { chosen_after_date: string }; Returns: string };
      previous_plannable_date: {
        Args: { chosen_before_date: string };
        Returns: string;
      };
      previous_workday: {
        Args: { chosen_before_date: string };
        Returns: string;
      };
      reopen_closed_day: {
        Args: { chosen_work_date: string };
        Returns: string;
      };
      reporting_daily_metrics: {
        Args: { chosen_end_date: string; chosen_start_date: string };
        Returns: {
          completed_items: number;
          day_note: string;
          deferred_items: number;
          has_important_note: boolean;
          is_out_of_office: boolean;
          meetings_attended: number;
          plan_intention: string;
          plan_status: string;
          planned_items: number;
          reminders_completed: number;
          returned_items: number;
          skipped_items: number;
          tasks_completed: number;
          tickets_closed: number;
          tickets_resolved: number;
          tickets_worked: number;
          work_date: string;
        }[];
      };
      reporting_inventory_metrics: {
        Args: { chosen_end_date: string; chosen_start_date: string };
        Returns: {
          active_tickets: number;
          age_0_7: number;
          age_15_30: number;
          age_31_plus: number;
          age_8_14: number;
          average_active_age: number;
          tickets_received: number;
          waiting_tickets: number;
          watching_tickets: number;
          work_date: string;
        }[];
      };
      reporting_period_totals: {
        Args: { chosen_end_date: string; chosen_start_date: string };
        Returns: {
          completed_items: number;
          meetings_attended: number;
          planned_items: number;
          reminders_completed: number;
          tasks_completed: number;
          tickets_closed: number;
          tickets_resolved: number;
          tickets_worked: number;
        }[];
      };
      reporting_work_status_snapshot: {
        Args: { chosen_as_of_date: string };
        Returns: {
          active_work: number;
          total_active: number;
          waiting: number;
          watching: number;
        }[];
      };
      resolve_end_of_day_follow_up: {
        Args: {
          chosen_decision: Database["public"]["Enums"]["follow_up_decision"];
          chosen_review_on?: string;
          target_follow_up_id: string;
        };
        Returns: undefined;
      };
      restore_archived_work_item: {
        Args: { target_work_item_id: string };
        Returns: undefined;
      };
      restore_workspace_backup: {
        Args: { chosen_backup: Json; chosen_confirmation: string };
        Returns: Json;
      };
      restore_workspace_backup_core: {
        Args: { chosen_backup: Json; chosen_confirmation: string };
        Returns: Json;
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
      update_profile_settings: {
        Args: { chosen_display_name: string };
        Returns: undefined;
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
      update_ticket_workflow: {
        Args: {
          chosen_operational_status: Database["public"]["Enums"]["ticket_operational_status"];
          chosen_system_priority: Database["public"]["Enums"]["ticket_priority"];
          chosen_tracking_state: Database["public"]["Enums"]["work_tracking_state"];
          target_work_item_id: string;
        };
        Returns: undefined;
      };
      update_work_schedule_settings: {
        Args: {
          chosen_ends_at_local: string;
          chosen_starts_at_local: string;
          chosen_time_zone: string;
          chosen_working_weekdays: number[];
        };
        Returns: undefined;
      };
    };
    Enums: {
      calendar_connection_status:
        "connected" | "stale" | "disconnected" | "error";
      calendar_day_color: "lavender" | "blush" | "rose" | "cream" | "sage";
      daily_plan_status: "draft" | "ready" | "active" | "closed";
      external_calendar_event_type:
        "default" | "out_of_office" | "focus_time" | "other";
      follow_up_decision:
        | "still_waiting"
        | "response_received"
        | "external_completed"
        | "no_longer_relevant";
      follow_up_state: "open" | "completed" | "cancelled";
      meeting_attendance_status:
        | "unconfirmed"
        | "probably_attended"
        | "attended"
        | "cancelled"
        | "did_not_attend"
        | "not_applicable";
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
      calendar_connection_status: [
        "connected",
        "stale",
        "disconnected",
        "error",
      ],
      calendar_day_color: ["lavender", "blush", "rose", "cream", "sage"],
      daily_plan_status: ["draft", "ready", "active", "closed"],
      external_calendar_event_type: [
        "default",
        "out_of_office",
        "focus_time",
        "other",
      ],
      follow_up_decision: [
        "still_waiting",
        "response_received",
        "external_completed",
        "no_longer_relevant",
      ],
      follow_up_state: ["open", "completed", "cancelled"],
      meeting_attendance_status: [
        "unconfirmed",
        "probably_attended",
        "attended",
        "cancelled",
        "did_not_attend",
        "not_applicable",
      ],
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
