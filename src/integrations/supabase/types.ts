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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      discovery_items: {
        Row: {
          created_at: string
          description: string
          id: string
          image_url: string
          is_published: boolean
          kind: string
          release_at: string | null
          title: string
          video_url: string
        }
        Insert: {
          created_at?: string
          description?: string
          id?: string
          image_url: string
          is_published?: boolean
          kind: string
          release_at?: string | null
          title: string
          video_url: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          image_url?: string
          is_published?: boolean
          kind?: string
          release_at?: string | null
          title?: string
          video_url?: string
        }
        Relationships: []
      }
      episodes: {
        Row: {
          access_tier: string
          created_at: string
          description: string | null
          duration_seconds: number | null
          episode_number: number
          id: string
          language: string | null
          publish_status: string
          release_date: string | null
          scheduled_at: string | null
          season_id: string
          show_id: string
          stream_url: string | null
          thumbnail_url: string | null
          title: string
          updated_at: string
          video_asset_id: string | null
        }
        Insert: {
          access_tier?: string
          created_at?: string
          description?: string | null
          duration_seconds?: number | null
          episode_number: number
          id?: string
          language?: string | null
          publish_status?: string
          release_date?: string | null
          scheduled_at?: string | null
          season_id: string
          show_id: string
          stream_url?: string | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          video_asset_id?: string | null
        }
        Update: {
          access_tier?: string
          created_at?: string
          description?: string | null
          duration_seconds?: number | null
          episode_number?: number
          id?: string
          language?: string | null
          publish_status?: string
          release_date?: string | null
          scheduled_at?: string | null
          season_id?: string
          show_id?: string
          stream_url?: string | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          video_asset_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "episodes_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "episodes_show_id_fkey"
            columns: ["show_id"]
            isOneToOne: false
            referencedRelation: "shows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "episodes_video_asset_id_fkey"
            columns: ["video_asset_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      live_channels: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          language: string | null
          logo_url: string | null
          name: string
          sort_order: number
          stream_url: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          language?: string | null
          logo_url?: string | null
          name: string
          sort_order?: number
          stream_url: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          language?: string | null
          logo_url?: string | null
          name?: string
          sort_order?: number
          stream_url?: string
          updated_at?: string
        }
        Relationships: []
      }
      media_assets: {
        Row: {
          asset_kind: string
          created_at: string
          created_by: string | null
          dash_manifest_key: string | null
          duration_seconds: number | null
          episode_id: string | null
          error_message: string | null
          file_size_bytes: number
          height: number | null
          hls_manifest_key: string | null
          id: string
          is_current: boolean
          mime_type: string
          original_filename: string
          playback_manifest_ref: string | null
          processing_status: string
          provider_id: string | null
          replaced_asset_id: string | null
          show_id: string | null
          storage_key: string | null
          thumbnail_key: string | null
          updated_at: string
          upload_status: string
          width: number | null
        }
        Insert: {
          asset_kind: string
          created_at?: string
          created_by?: string | null
          dash_manifest_key?: string | null
          duration_seconds?: number | null
          episode_id?: string | null
          error_message?: string | null
          file_size_bytes: number
          height?: number | null
          hls_manifest_key?: string | null
          id?: string
          is_current?: boolean
          mime_type: string
          original_filename: string
          playback_manifest_ref?: string | null
          processing_status?: string
          provider_id?: string | null
          replaced_asset_id?: string | null
          show_id?: string | null
          storage_key?: string | null
          thumbnail_key?: string | null
          updated_at?: string
          upload_status?: string
          width?: number | null
        }
        Update: {
          asset_kind?: string
          created_at?: string
          created_by?: string | null
          dash_manifest_key?: string | null
          duration_seconds?: number | null
          episode_id?: string | null
          error_message?: string | null
          file_size_bytes?: number
          height?: number | null
          hls_manifest_key?: string | null
          id?: string
          is_current?: boolean
          mime_type?: string
          original_filename?: string
          playback_manifest_ref?: string | null
          processing_status?: string
          provider_id?: string | null
          replaced_asset_id?: string | null
          show_id?: string | null
          storage_key?: string | null
          thumbnail_key?: string | null
          updated_at?: string
          upload_status?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "media_assets_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "episodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_assets_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "storage_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_assets_replaced_asset_id_fkey"
            columns: ["replaced_asset_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_assets_show_id_fkey"
            columns: ["show_id"]
            isOneToOne: false
            referencedRelation: "shows"
            referencedColumns: ["id"]
          },
        ]
      }
      nova_announcements: {
        Row: {
          body: string
          created_at: string
          id: string
          path: string
          title: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          path?: string
          title: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          path?: string
          title?: string
        }
        Relationships: []
      }
      nova_push_config: {
        Row: {
          id: number
          private_jwk: Json
          public_key: string
        }
        Insert: {
          id: number
          private_jwk: Json
          public_key: string
        }
        Update: {
          id?: number
          private_jwk?: Json
          public_key?: string
        }
        Relationships: []
      }
      nova_push_devices: {
        Row: {
          created_at: string
          endpoint: string
          id: string
          subscription: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          endpoint: string
          id?: string
          subscription: Json
          user_id: string
        }
        Update: {
          created_at?: string
          endpoint?: string
          id?: string
          subscription?: Json
          user_id?: string
        }
        Relationships: []
      }
      otp_codes: {
        Row: {
          code: string
          consumed: boolean
          created_at: string
          expires_at: string
          id: string
          phone: string
        }
        Insert: {
          code: string
          consumed?: boolean
          created_at?: string
          expires_at: string
          id?: string
          phone: string
        }
        Update: {
          code?: string
          consumed?: boolean
          created_at?: string
          expires_at?: string
          id?: string
          phone?: string
        }
        Relationships: []
      }
      seasons: {
        Row: {
          created_at: string
          id: string
          season_number: number
          show_id: string
          title: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          season_number: number
          show_id: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          season_number?: number
          show_id?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "seasons_show_id_fkey"
            columns: ["show_id"]
            isOneToOne: false
            referencedRelation: "shows"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          created_at: string
          expires_at: string
          token: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          token: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          token?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      shows: {
        Row: {
          banner_end_at: string | null
          banner_start_at: string | null
          banner_url: string | null
          category: string | null
          content_type: string
          created_at: string
          description: string | null
          genres: string[]
          id: string
          is_featured: boolean
          is_published: boolean
          languages: string[]
          mobile_banner_url: string | null
          rating: number | null
          release_year: number | null
          thumbnail_url: string | null
          title: string
          updated_at: string
          video_asset_id: string | null
          video_url: string | null
        }
        Insert: {
          banner_end_at?: string | null
          banner_start_at?: string | null
          banner_url?: string | null
          category?: string | null
          content_type?: string
          created_at?: string
          description?: string | null
          genres?: string[]
          id?: string
          is_featured?: boolean
          is_published?: boolean
          languages?: string[]
          mobile_banner_url?: string | null
          rating?: number | null
          release_year?: number | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          video_asset_id?: string | null
          video_url?: string | null
        }
        Update: {
          banner_end_at?: string | null
          banner_start_at?: string | null
          banner_url?: string | null
          category?: string | null
          content_type?: string
          created_at?: string
          description?: string | null
          genres?: string[]
          id?: string
          is_featured?: boolean
          is_published?: boolean
          languages?: string[]
          mobile_banner_url?: string | null
          rating?: number | null
          release_year?: number | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          video_asset_id?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shows_video_asset_id_fkey"
            columns: ["video_asset_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      storage_providers: {
        Row: {
          config: Json
          connection_status: string
          created_at: string
          id: string
          is_active: boolean
          is_enabled: boolean
          last_test_message: string | null
          last_tested_at: string | null
          updated_at: string
        }
        Insert: {
          config?: Json
          connection_status?: string
          created_at?: string
          id: string
          is_active?: boolean
          is_enabled?: boolean
          last_test_message?: string | null
          last_tested_at?: string | null
          updated_at?: string
        }
        Update: {
          config?: Json
          connection_status?: string
          created_at?: string
          id?: string
          is_active?: boolean
          is_enabled?: boolean
          last_test_message?: string | null
          last_tested_at?: string | null
          updated_at?: string
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
      users: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          is_blocked: boolean
          phone: string
          pin_hash: string | null
          pin_salt: string | null
          subscription_status: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id?: string
          is_blocked?: boolean
          phone: string
          pin_hash?: string | null
          pin_salt?: string | null
          subscription_status?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          is_blocked?: boolean
          phone?: string
          pin_hash?: string | null
          pin_salt?: string | null
          subscription_status?: string
        }
        Relationships: []
      }
      video_processing_jobs: {
        Row: {
          asset_id: string
          created_at: string
          error_message: string | null
          finished_at: string | null
          id: string
          job_type: string
          output_key: string | null
          progress: number
          provider_job_id: string | null
          started_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          asset_id: string
          created_at?: string
          error_message?: string | null
          finished_at?: string | null
          id?: string
          job_type: string
          output_key?: string | null
          progress?: number
          provider_job_id?: string | null
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          asset_id?: string
          created_at?: string
          error_message?: string | null
          finished_at?: string | null
          id?: string
          job_type?: string
          output_key?: string | null
          progress?: number
          provider_job_id?: string | null
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_processing_jobs_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      video_subtitles: {
        Row: {
          created_at: string
          episode_id: string | null
          file_size_bytes: number
          format: string
          id: string
          is_default: boolean
          label: string
          language_code: string
          original_filename: string
          provider_id: string | null
          show_id: string | null
          storage_key: string | null
          upload_status: string
        }
        Insert: {
          created_at?: string
          episode_id?: string | null
          file_size_bytes: number
          format: string
          id?: string
          is_default?: boolean
          label: string
          language_code: string
          original_filename: string
          provider_id?: string | null
          show_id?: string | null
          storage_key?: string | null
          upload_status?: string
        }
        Update: {
          created_at?: string
          episode_id?: string | null
          file_size_bytes?: number
          format?: string
          id?: string
          is_default?: boolean
          label?: string
          language_code?: string
          original_filename?: string
          provider_id?: string | null
          show_id?: string | null
          storage_key?: string | null
          upload_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_subtitles_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "episodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_subtitles_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "storage_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_subtitles_show_id_fkey"
            columns: ["show_id"]
            isOneToOne: false
            referencedRelation: "shows"
            referencedColumns: ["id"]
          },
        ]
      }
      watching_profiles: {
        Row: {
          avatar: string
          created_at: string
          id: string
          kid: boolean
          name: string
          user_id: string
        }
        Insert: {
          avatar?: string
          created_at?: string
          id?: string
          kid?: boolean
          name: string
          user_id: string
        }
        Update: {
          avatar?: string
          created_at?: string
          id?: string
          kid?: boolean
          name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "watching_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
    },
  },
} as const
