export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          auto_post_count: number
          auto_post_enabled: boolean
          created_at: string
          date: string
          description: string | null
          group_id: string | null
          id: string
          image_url: string | null
          location: string | null
          max_auto_posts: number
          organizer_id: string
          participant_visibility: string
          session_type: string
          sport: string
          status: string
          title: string
          updated_at: string
          venue: string
          visibility: string
        }
        Insert: {
          auto_post_count?: number
          auto_post_enabled?: boolean
          created_at?: string
          date: string
          description?: string | null
          group_id?: string | null
          id?: string
          image_url?: string | null
          location?: string | null
          max_auto_posts?: number
          organizer_id: string
          participant_visibility?: string
          session_type?: string
          sport: string
          status?: string
          title: string
          updated_at?: string
          venue: string
          visibility?: string
        }
        Update: {
          auto_post_count?: number
          auto_post_enabled?: boolean
          created_at?: string
          date?: string
          description?: string | null
          group_id?: string | null
          id?: string
          image_url?: string | null
          location?: string | null
          max_auto_posts?: number
          organizer_id?: string
          participant_visibility?: string
          session_type?: string
          sport?: string
          status?: string
          title?: string
          updated_at?: string
          venue?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_sessions: {
        Row: {
          activity_id: string
          created_at: string
          end_time: string | null
          filled_slots: number
          id: string
          max_slots: number
          price: number
          released_details: string | null
          start_time: string | null
          time_label: string
        }
        Insert: {
          activity_id: string
          created_at?: string
          end_time?: string | null
          filled_slots?: number
          id?: string
          max_slots?: number
          price?: number
          released_details?: string | null
          start_time?: string | null
          time_label: string
        }
        Update: {
          activity_id?: string
          created_at?: string
          end_time?: string | null
          filled_slots?: number
          id?: string
          max_slots?: number
          price?: number
          released_details?: string | null
          start_time?: string | null
          time_label?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_sessions_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          activity_id: string
          created_at: string
          id: string
          message: string
          organizer_id: string
        }
        Insert: {
          activity_id: string
          created_at?: string
          id?: string
          message: string
          organizer_id: string
        }
        Update: {
          activity_id?: string
          created_at?: string
          id?: string
          message?: string
          organizer_id?: string
        }
        Relationships: []
      }
      ballot_participants: {
        Row: {
          attempt_count: number
          ballot_id: string
          created_at: string
          display_name: string | null
          id: string
          last_attempt_at: string
          status: string
          telegram_username: string | null
          user_id: string | null
        }
        Insert: {
          attempt_count?: number
          ballot_id: string
          created_at?: string
          display_name?: string | null
          id?: string
          last_attempt_at?: string
          status?: string
          telegram_username?: string | null
          user_id?: string | null
        }
        Update: {
          attempt_count?: number
          ballot_id?: string
          created_at?: string
          display_name?: string | null
          id?: string
          last_attempt_at?: string
          status?: string
          telegram_username?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ballot_participants_ballot_id_fkey"
            columns: ["ballot_id"]
            isOneToOne: false
            referencedRelation: "ballots"
            referencedColumns: ["id"]
          },
        ]
      }
      ballots: {
        Row: {
          activity_name: string
          ballot_deadline: string
          created_at: string
          created_by: string
          group_id: string | null
          id: string
          location: string
          slots: number
          sport: string
          visibility: string
        }
        Insert: {
          activity_name: string
          ballot_deadline: string
          created_at?: string
          created_by: string
          group_id?: string | null
          id?: string
          location: string
          slots?: number
          sport: string
          visibility?: string
        }
        Update: {
          activity_name?: string
          ballot_deadline?: string
          created_at?: string
          created_by?: string
          group_id?: string | null
          id?: string
          location?: string
          slots?: number
          sport?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "ballots_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      beta_registrations: {
        Row: {
          activity_size: string | null
          consent: boolean
          created_at: string
          email: string
          id: string
          name: string
          organize_frequency: string | null
          role: string | null
        }
        Insert: {
          activity_size?: string | null
          consent?: boolean
          created_at?: string
          email: string
          id?: string
          name: string
          organize_frequency?: string | null
          role?: string | null
        }
        Update: {
          activity_size?: string | null
          consent?: boolean
          created_at?: string
          email?: string
          id?: string
          name?: string
          organize_frequency?: string | null
          role?: string | null
        }
        Relationships: []
      }
      bookings: {
        Row: {
          amount: number | null
          created_at: string
          id: string
          payment_status: Database["public"]["Enums"]["payment_status"]
          player_name: string
          player_phone: string | null
          player_username: string | null
          reservation_status: Database["public"]["Enums"]["reservation_status"]
          reserved_until: string | null
          session_id: string
          special_request: string | null
          stripe_payment_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string
          id?: string
          payment_status?: Database["public"]["Enums"]["payment_status"]
          player_name: string
          player_phone?: string | null
          player_username?: string | null
          reservation_status?: Database["public"]["Enums"]["reservation_status"]
          reserved_until?: string | null
          session_id: string
          special_request?: string | null
          stripe_payment_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string
          id?: string
          payment_status?: Database["public"]["Enums"]["payment_status"]
          player_name?: string
          player_phone?: string | null
          player_username?: string | null
          reservation_status?: Database["public"]["Enums"]["reservation_status"]
          reserved_until?: string | null
          session_id?: string
          special_request?: string | null
          stripe_payment_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "activity_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      group_members: {
        Row: {
          group_id: string
          id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          group_id: string
          id?: string
          joined_at?: string
          user_id: string
        }
        Update: {
          group_id?: string
          id?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          organizer_id: string
          sport: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          organizer_id: string
          sport?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          organizer_id?: string
          sport?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          phone: string | null
          stripe_account_id: string | null
          stripe_customer_id: string | null
          telegram_chat_id: number | null
          updated_at: string
          user_id: string
          username: string | null
          verification_status: Database["public"]["Enums"]["verification_status"]
          welcome_email_sent_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          phone?: string | null
          stripe_account_id?: string | null
          stripe_customer_id?: string | null
          telegram_chat_id?: number | null
          updated_at?: string
          user_id: string
          username?: string | null
          verification_status?: Database["public"]["Enums"]["verification_status"]
          welcome_email_sent_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          phone?: string | null
          stripe_account_id?: string | null
          stripe_customer_id?: string | null
          telegram_chat_id?: number | null
          updated_at?: string
          user_id?: string
          username?: string | null
          verification_status?: Database["public"]["Enums"]["verification_status"]
          welcome_email_sent_at?: string | null
        }
        Relationships: []
      }
      session_ratings: {
        Row: {
          activity_id: string
          comment: string | null
          created_at: string
          group_id: string | null
          id: string
          organizer_id: string
          rating: number
          session_id: string | null
          user_id: string
        }
        Insert: {
          activity_id: string
          comment?: string | null
          created_at?: string
          group_id?: string | null
          id?: string
          organizer_id: string
          rating: number
          session_id?: string | null
          user_id: string
        }
        Update: {
          activity_id?: string
          comment?: string | null
          created_at?: string
          group_id?: string | null
          id?: string
          organizer_id?: string
          rating?: number
          session_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      special_requests: {
        Row: {
          activity_id: string | null
          created_at: string
          end_time: string
          id: string
          note: string | null
          preferred_date: string
          start_time: string
          status: string
          user_id: string
          venue: string
        }
        Insert: {
          activity_id?: string | null
          created_at?: string
          end_time: string
          id?: string
          note?: string | null
          preferred_date: string
          start_time: string
          status?: string
          user_id: string
          venue: string
        }
        Update: {
          activity_id?: string | null
          created_at?: string
          end_time?: string
          id?: string
          note?: string | null
          preferred_date?: string
          start_time?: string
          status?: string
          user_id?: string
          venue?: string
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      telegram_bot_state: {
        Row: {
          conversation_states: Json | null
          id: number
          update_offset: number
          updated_at: string
        }
        Insert: {
          conversation_states?: Json | null
          id: number
          update_offset?: number
          updated_at?: string
        }
        Update: {
          conversation_states?: Json | null
          id?: number
          update_offset?: number
          updated_at?: string
        }
        Relationships: []
      }
      telegram_messages: {
        Row: {
          chat_id: number
          created_at: string
          raw_update: Json
          text: string | null
          update_id: number
        }
        Insert: {
          chat_id: number
          created_at?: string
          raw_update: Json
          text?: string | null
          update_id: number
        }
        Update: {
          chat_id?: number
          created_at?: string
          raw_update?: Json
          text?: string | null
          update_id?: number
        }
        Relationships: []
      }
      terms_consent: {
        Row: {
          consent: boolean
          consent_type: string
          created_at: string
          id: string
          ip_address: string | null
          user_id: string | null
        }
        Insert: {
          consent?: boolean
          consent_type: string
          created_at?: string
          id?: string
          ip_address?: string | null
          user_id?: string | null
        }
        Update: {
          consent?: boolean
          consent_type?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      _check_welcome_vault_key: { Args: never; Returns: boolean }
      _test_fire_welcome: { Args: { p_email: string }; Returns: Json }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      get_active_booking_counts: {
        Args: { p_activity_id: string }
        Returns: {
          active_count: number
          session_id: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      payment_status: "unpaid" | "pending" | "paid" | "refunded"
      reservation_status: "pending" | "confirmed" | "rejected" | "cancelled"
      verification_status: "unverified" | "pending" | "verified" | "rejected"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
      payment_status: ["unpaid", "pending", "paid", "refunded"],
      reservation_status: ["pending", "confirmed", "rejected", "cancelled"],
      verification_status: ["unverified", "pending", "verified", "rejected"],
    },
  },
} as const
