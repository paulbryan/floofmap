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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      community_pins: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          lat_blurred: number
          lon_blurred: number
          status: string | null
          type: string
          votes: number | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          lat_blurred: number
          lon_blurred: number
          status?: string | null
          type: string
          votes?: number | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          lat_blurred?: number
          lon_blurred?: number
          status?: string | null
          type?: string
          votes?: number | null
        }
        Relationships: []
      }
      dog_walkers: {
        Row: {
          accepted_at: string | null
          created_at: string
          dog_id: string
          id: string
          owner_user_id: string
          revoked_at: string | null
          status: string
          walker_email: string
          walker_user_id: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          dog_id: string
          id?: string
          owner_user_id: string
          revoked_at?: string | null
          status?: string
          walker_email: string
          walker_user_id: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          dog_id?: string
          id?: string
          owner_user_id?: string
          revoked_at?: string | null
          status?: string
          walker_email?: string
          walker_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dog_walkers_dog_id_fkey"
            columns: ["dog_id"]
            isOneToOne: false
            referencedRelation: "dogs"
            referencedColumns: ["id"]
          },
        ]
      }
      dogs: {
        Row: {
          avatar_url: string | null
          birthday: string | null
          breed: string | null
          created_at: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          birthday?: string | null
          breed?: string | null
          created_at?: string
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          birthday?: string | null
          breed?: string | null
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      poi_cache: {
        Row: {
          bbox_hash: string
          category: string
          data_json: Json
          fetched_at: string
          id: string
        }
        Insert: {
          bbox_hash: string
          category: string
          data_json: Json
          fetched_at?: string
          id?: string
        }
        Update: {
          bbox_hash?: string
          category?: string
          data_json?: Json
          fetched_at?: string
          id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      stop_events: {
        Row: {
          confidence: number | null
          created_at: string
          id: string
          label: string | null
          lat: number
          lon: number
          radius_m: number | null
          score: number | null
          ts_end: string
          ts_start: string
          walk_id: string
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          id?: string
          label?: string | null
          lat: number
          lon: number
          radius_m?: number | null
          score?: number | null
          ts_end: string
          ts_start: string
          walk_id: string
        }
        Update: {
          confidence?: number | null
          created_at?: string
          id?: string
          label?: string | null
          lat?: number
          lon?: number
          radius_m?: number | null
          score?: number | null
          ts_end?: string
          ts_start?: string
          walk_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stop_events_walk_id_fkey"
            columns: ["walk_id"]
            isOneToOne: false
            referencedRelation: "walks"
            referencedColumns: ["id"]
          },
        ]
      }
      track_points: {
        Row: {
          accuracy_m: number | null
          id: string
          lat: number
          lon: number
          speed_mps: number | null
          ts: string
          walk_id: string
        }
        Insert: {
          accuracy_m?: number | null
          id?: string
          lat: number
          lon: number
          speed_mps?: number | null
          ts?: string
          walk_id: string
        }
        Update: {
          accuracy_m?: number | null
          id?: string
          lat?: number
          lon?: number
          speed_mps?: number | null
          ts?: string
          walk_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "track_points_walk_id_fkey"
            columns: ["walk_id"]
            isOneToOne: false
            referencedRelation: "walks"
            referencedColumns: ["id"]
          },
        ]
      }
      walks: {
        Row: {
          created_at: string
          distance_m: number | null
          dog_id: string | null
          duration_s: number | null
          ended_at: string | null
          id: string
          notes: string | null
          sniff_time_s: number | null
          started_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          distance_m?: number | null
          dog_id?: string | null
          duration_s?: number | null
          ended_at?: string | null
          id?: string
          notes?: string | null
          sniff_time_s?: number | null
          started_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          distance_m?: number | null
          dog_id?: string | null
          duration_s?: number | null
          ended_at?: string | null
          id?: string
          notes?: string | null
          sniff_time_s?: number | null
          started_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "walks_dog_id_fkey"
            columns: ["dog_id"]
            isOneToOne: false
            referencedRelation: "dogs"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      dog_walkers_safe: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          dog_id: string | null
          id: string | null
          owner_user_id: string | null
          revoked_at: string | null
          status: string | null
          walker_user_id: string | null
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          dog_id?: string | null
          id?: string | null
          owner_user_id?: string | null
          revoked_at?: string | null
          status?: string | null
          walker_user_id?: string | null
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          dog_id?: string | null
          id?: string | null
          owner_user_id?: string | null
          revoked_at?: string | null
          status?: string | null
          walker_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dog_walkers_dog_id_fkey"
            columns: ["dog_id"]
            isOneToOne: false
            referencedRelation: "dogs"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      blur_coordinate: { Args: { coord: number }; Returns: number }
      get_dog_walkers_for_owner: {
        Args: { p_owner_user_id: string }
        Returns: {
          accepted_at: string
          created_at: string
          dog_id: string
          id: string
          revoked_at: string
          status: string
          walker_avatar: string
          walker_name: string
          walker_user_id: string
        }[]
      }
      get_my_pending_invites: {
        Args: never
        Returns: {
          dog_id: string
          dog_name: string
          id: string
          owner_user_id: string
          status: string
        }[]
      }
      get_walk_track_points: {
        Args: { p_walk_id: string }
        Returns: {
          accuracy_m: number
          id: string
          lat: number
          lon: number
          speed_mps: number
          ts: string
          walk_id: string
        }[]
      }
      has_walker_access: {
        Args: { p_dog_id: string; p_user_id: string }
        Returns: boolean
      }
      owns_dog: {
        Args: { p_dog_id: string; p_user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
