export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      bouquet_flowers: {
        Row: {
          color: string
          created_at: string | null
          entry_id: string | null
          flower_type: Database["public"]["Enums"]["flower_type"]
          generation_seed: number | null
          id: string
          note: string | null
          position_x: number | null
          position_y: number | null
          rotation: number | null
          scale: number | null
          sort_order: number | null
        }
        Insert: {
          color: string
          created_at?: string | null
          entry_id?: string | null
          flower_type: Database["public"]["Enums"]["flower_type"]
          generation_seed?: number | null
          id?: string
          note?: string | null
          position_x?: number | null
          position_y?: number | null
          rotation?: number | null
          scale?: number | null
          sort_order?: number | null
        }
        Update: {
          color?: string
          created_at?: string | null
          entry_id?: string | null
          flower_type?: Database["public"]["Enums"]["flower_type"]
          generation_seed?: number | null
          id?: string
          note?: string | null
          position_x?: number | null
          position_y?: number | null
          rotation?: number | null
          scale?: number | null
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bouquet_flowers_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "entries"
            referencedColumns: ["id"]
          },
        ]
      }
      coffee_dates: {
        Row: {
          animation_triggered: boolean | null
          created_at: string | null
          custom_name: string | null
          drink_types: Database["public"]["Enums"]["drink_type"][] | null
          entry_id: string | null
          gift_card_url: string | null
          id: string
          local_cafe_suggestion: string | null
          message: string | null
        }
        Insert: {
          animation_triggered?: boolean | null
          created_at?: string | null
          custom_name?: string | null
          drink_types?: Database["public"]["Enums"]["drink_type"][] | null
          entry_id?: string | null
          gift_card_url?: string | null
          id?: string
          local_cafe_suggestion?: string | null
          message?: string | null
        }
        Update: {
          animation_triggered?: boolean | null
          created_at?: string | null
          custom_name?: string | null
          drink_types?: Database["public"]["Enums"]["drink_type"][] | null
          entry_id?: string | null
          gift_card_url?: string | null
          id?: string
          local_cafe_suggestion?: string | null
          message?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coffee_dates_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "entries"
            referencedColumns: ["id"]
          },
        ]
      }
      entries: {
        Row: {
          content: Json
          created_at: string | null
          created_by: string | null
          id: string
          is_featured: boolean | null
          is_published: boolean | null
          publish_at: string
          slug: string
          title: string
          type: Database["public"]["Enums"]["entry_type"]
          unlock_at: string | null
          unlock_condition: string | null
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          content?: Json
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          publish_at?: string
          slug: string
          title: string
          type?: Database["public"]["Enums"]["entry_type"]
          unlock_at?: string | null
          unlock_condition?: string | null
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          content?: Json
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          publish_at?: string
          slug?: string
          title?: string
          type?: Database["public"]["Enums"]["entry_type"]
          unlock_at?: string | null
          unlock_condition?: string | null
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "entries_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      media: {
        Row: {
          created_at: string | null
          duration_seconds: number | null
          entry_id: string | null
          filename: string | null
          height: number | null
          id: string
          mime_type: string | null
          public_url: string | null
          size_bytes: number | null
          sort_order: number | null
          storage_path: string
          type: Database["public"]["Enums"]["media_type"]
          width: number | null
        }
        Insert: {
          created_at?: string | null
          duration_seconds?: number | null
          entry_id?: string | null
          filename?: string | null
          height?: number | null
          id?: string
          mime_type?: string | null
          public_url?: string | null
          size_bytes?: number | null
          sort_order?: number | null
          storage_path: string
          type: Database["public"]["Enums"]["media_type"]
          width?: number | null
        }
        Update: {
          created_at?: string | null
          duration_seconds?: number | null
          entry_id?: string | null
          filename?: string | null
          height?: number | null
          id?: string
          mime_type?: string | null
          public_url?: string | null
          size_bytes?: number | null
          sort_order?: number | null
          storage_path?: string
          type?: Database["public"]["Enums"]["media_type"]
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "media_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "entries"
            referencedColumns: ["id"]
          },
        ]
      }
      open_when_letters: {
        Row: {
          content: Json
          created_at: string | null
          entry_id: string | null
          envelope_color: string | null
          id: string
          is_unlocked: boolean | null
          seal_emoji: string | null
          sort_order: number | null
          trigger_label: string
          trigger_type: string
          trigger_value: string | null
          unlocked_at: string | null
        }
        Insert: {
          content: Json
          created_at?: string | null
          entry_id?: string | null
          envelope_color?: string | null
          id?: string
          is_unlocked?: boolean | null
          seal_emoji?: string | null
          sort_order?: string | null
          trigger_label: string
          trigger_type: string
          trigger_value?: string | null
          unlocked_at?: string | null
        }
        Update: {
          content?: Json
          created_at?: string | null
          entry_id?: string | null
          envelope_color?: string | null
          id?: string
          is_unlocked?: boolean | null
          seal_emoji?: string | null
          sort_order?: string | null
          trigger_label?: string
          trigger_type?: string
          trigger_value?: string | null
          unlocked_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "open_when_letters_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "entries"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_interactions: {
        Row: {
          created_at: string | null
          entry_id: string | null
          id: string
          interaction_type: string
          metadata: Json | null
        }
        Insert: {
          created_at?: string | null
          entry_id?: string | null
          id?: string
          interaction_type: string
          metadata?: Json | null
        }
        Update: {
          created_at?: string | null
          entry_id?: string | null
          id?: string
          interaction_type?: string
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_interactions_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "entries"
            referencedColumns: ["id"]
          },
        ]
      }
      polaroid_cards: {
        Row: {
          back_note: string | null
          caption: string | null
          created_at: string | null
          date_tag: string | null
          entry_id: string | null
          font_color: string | null
          font_family: string | null
          font_size: string | null
          hidden_message: string | null
          id: string
          image_url: string
          orientation: string | null
          sort_order: number | null
          stickers: string[] | null
          template: string | null
          text_alignment: string | null
          tilt_degrees: number | null
        }
        Insert: {
          back_note?: string | null
          caption?: string | null
          created_at?: string | null
          date_tag?: string | null
          entry_id?: string | null
          font_color?: string | null
          font_family?: string | null
          font_size?: string | null
          hidden_message?: string | null
          id?: string
          image_url: string
          orientation?: string | null
          sort_order?: number | null
          stickers?: string[] | null
          template?: string | null
          text_alignment?: string | null
          tilt_degrees?: number | null
        }
        Update: {
          back_note?: string | null
          caption?: string | null
          created_at?: string | null
          date_tag?: string | null
          entry_id?: string | null
          font_color?: string | null
          font_family?: string | null
          font_size?: string | null
          hidden_message?: string | null
          id?: string
          image_url?: string
          orientation?: string | null
          sort_order?: number | null
          stickers?: string[] | null
          template?: string | null
          text_alignment?: string | null
          tilt_degrees?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "polaroid_cards_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "entries"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          display_name: string
          id: string
          latitude: number | null
          location_name: string | null
          longitude: number | null
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          display_name: string
          id: string
          latitude?: number | null
          location_name?: string | null
          longitude?: number | null
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string
          id?: string
          latitude?: number | null
          location_name?: string | null
          longitude?: number | null
          timezone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      relationship_settings: {
        Row: {
          anniversary_date: string | null
          created_at: string | null
          distance_km: number | null
          id: string
          partner_one_id: string | null
          partner_one_location_name: string | null
          partner_one_timezone: string | null
          partner_two_id: string | null
          partner_two_location_name: string | null
          partner_two_timezone: string | null
          updated_at: string | null
        }
        Insert: {
          anniversary_date?: string | null
          created_at?: string | null
          distance_km?: number | null
          id?: string
          partner_one_id?: string | null
          partner_one_location_name?: string | null
          partner_one_timezone?: string | null
          partner_two_id?: string | null
          partner_two_location_name?: string | null
          partner_two_timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          anniversary_date?: string | null
          created_at?: string | null
          distance_km?: number | null
          id?: string
          partner_one_id?: string | null
          partner_one_location_name?: string | null
          partner_one_timezone?: string | null
          partner_two_id?: string | null
          partner_two_location_name?: string | null
          partner_two_timezone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "relationship_settings_partner_one_id_fkey"
            columns: ["partner_one_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "relationship_settings_partner_two_id_fkey"
            columns: ["partner_two_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      scratch_cards: {
        Row: {
          cover_color: string | null
          cover_image_url: string | null
          created_at: string | null
          entry_id: string | null
          id: string
          reveal_content: Json
          scratch_threshold: number | null
        }
        Insert: {
          cover_color?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          entry_id?: string | null
          id?: string
          reveal_content: Json
          scratch_threshold?: number | null
        }
        Update: {
          cover_color?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          entry_id?: string | null
          id?: string
          reveal_content?: Json
          scratch_threshold?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "scratch_cards_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "entries"
            referencedColumns: ["id"]
          },
        ]
      }
      voice_notes: {
        Row: {
          cassette_side: string | null
          created_at: string | null
          duration_seconds: number | null
          entry_id: string | null
          id: string
          media_id: string | null
          title: string | null
          transcript: string | null
          waveform_data: Json | null
        }
        Insert: {
          cassette_side?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          entry_id?: string | null
          id?: string
          media_id?: string | null
          title?: string | null
          transcript?: string | null
          waveform_data?: Json | null
        }
        Update: {
          cassette_side?: string | null
          created_at?: string | null
          duration_seconds?: string | null
          entry_id?: string | null
          id?: string
          media_id?: string | null
          title?: string | null
          transcript?: string | null
          waveform_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "voice_notes_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voice_notes_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_distance: {
        Args: { lat1: number; lat2: number; lon1: number; lon2: number }
        Returns: number
      }
      generate_slug: {
        Args: {
          base_text: string
          entry_type: Database["public"]["Enums"]["entry_type"]
        }
        Returns: string
      }
    }
    Enums: {
      drink_type:
        | "coffee"
        | "tea"
        | "hot_chocolate"
        | "latte"
        | "matcha"
        | "chai"
        | "cappuccino"
        | "espresso"
        | "americano"
        | "mocha"
        | "cold_brew"
      entry_type:
        | "letter"
        | "bouquet"
        | "polaroid"
        | "scratch_card"
        | "open_when"
        | "coffee_date"
        | "voice_note"
      flower_type:
        | "rose"
        | "sunflower"
        | "tulip"
        | "lily"
        | "orchid"
        | "peony"
        | "daisy"
        | "lavender"
      media_type: "image" | "audio" | "video"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof DatabaseWithoutInternals, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] & DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] & DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
      drink_type: [
        "coffee",
        "tea",
        "hot_chocolate",
        "latte",
        "matcha",
        "chai",
        "cappuccino",
        "espresso",
        "americano",
        "mocha",
        "cold_brew",
      ],
      entry_type: [
        "letter",
        "bouquet",
        "polaroid",
        "scratch_card",
        "open_when",
        "coffee_date",
        "voice_note",
      ],
      flower_type: [
        "rose",
        "sunflower",
        "tulip",
        "lily",
        "orchid",
        "peony",
        "daisy",
        "lavender",
      ],
      media_type: ["image", "audio", "video"],
    },
  },
} as const
