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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          achievement_key: string
          id: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          achievement_key: string
          id?: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          achievement_key?: string
          id?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: []
      }
      api_usage: {
        Row: {
          call_count: number
          created_at: string
          function_name: string | null
          hour_window: string
          id: string
          key_name: string
          success: boolean | null
        }
        Insert: {
          call_count?: number
          created_at?: string
          function_name?: string | null
          hour_window: string
          id?: string
          key_name: string
          success?: boolean | null
        }
        Update: {
          call_count?: number
          created_at?: string
          function_name?: string | null
          hour_window?: string
          id?: string
          key_name?: string
          success?: boolean | null
        }
        Relationships: []
      }
      feedback: {
        Row: {
          created_at: string
          id: string
          message: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          user_id?: string
        }
        Relationships: []
      }
      quiz_history: {
        Row: {
          completed_at: string
          difficulty: string
          id: string
          quiz_type: string
          score: number
          time_taken_seconds: number | null
          total_questions: number
          user_id: string
        }
        Insert: {
          completed_at?: string
          difficulty: string
          id?: string
          quiz_type: string
          score?: number
          time_taken_seconds?: number | null
          total_questions?: number
          user_id: string
        }
        Update: {
          completed_at?: string
          difficulty?: string
          id?: string
          quiz_type?: string
          score?: number
          time_taken_seconds?: number | null
          total_questions?: number
          user_id?: string
        }
        Relationships: []
      }
      sentence_attempts: {
        Row: {
          created_at: string
          id: string
          improvement_suggestion: string | null
          quiz_id: string | null
          rating: number
          sentence_written: string
          user_id: string
          word: string
        }
        Insert: {
          created_at?: string
          id?: string
          improvement_suggestion?: string | null
          quiz_id?: string | null
          rating?: number
          sentence_written: string
          user_id: string
          word: string
        }
        Update: {
          created_at?: string
          id?: string
          improvement_suggestion?: string | null
          quiz_id?: string | null
          rating?: number
          sentence_written?: string
          user_id?: string
          word?: string
        }
        Relationships: [
          {
            foreignKeyName: "sentence_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quiz_history"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          completed_at: string
          difficulty: string | null
          id: string
          topic: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string
          difficulty?: string | null
          id?: string
          topic?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string
          difficulty?: string | null
          id?: string
          topic?: string | null
          user_id?: string
        }
        Relationships: []
      }
      streaks: {
        Row: {
          current_streak: number
          id: string
          last_session_date: string | null
          longest_streak: number
          user_id: string
        }
        Insert: {
          current_streak?: number
          id?: string
          last_session_date?: string | null
          longest_streak?: number
          user_id: string
        }
        Update: {
          current_streak?: number
          id?: string
          last_session_date?: string | null
          longest_streak?: number
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string
          daily_goal: number
          email: string | null
          id: string
          is_premium: boolean
          name: string | null
          reminder_enabled: boolean
          reminder_time: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          daily_goal?: number
          email?: string | null
          id: string
          is_premium?: boolean
          name?: string | null
          reminder_enabled?: boolean
          reminder_time?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          daily_goal?: number
          email?: string | null
          id?: string
          is_premium?: boolean
          name?: string | null
          reminder_enabled?: boolean
          reminder_time?: string
        }
        Relationships: []
      }
      word_history: {
        Row: {
          antonyms: string | null
          casual_use: string | null
          created_at: string
          definition: string | null
          difficulty: string | null
          etymology: string | null
          id: string
          part_of_speech: string | null
          professional_use: string | null
          session_id: string | null
          status: string
          synonyms: string | null
          topic: string | null
          user_id: string
          word: string
        }
        Insert: {
          antonyms?: string | null
          casual_use?: string | null
          created_at?: string
          definition?: string | null
          difficulty?: string | null
          etymology?: string | null
          id?: string
          part_of_speech?: string | null
          professional_use?: string | null
          session_id?: string | null
          status: string
          synonyms?: string | null
          topic?: string | null
          user_id: string
          word: string
        }
        Update: {
          antonyms?: string | null
          casual_use?: string | null
          created_at?: string
          definition?: string | null
          difficulty?: string | null
          etymology?: string | null
          id?: string
          part_of_speech?: string | null
          professional_use?: string | null
          session_id?: string | null
          status?: string
          synonyms?: string | null
          topic?: string | null
          user_id?: string
          word?: string
        }
        Relationships: [
          {
            foreignKeyName: "word_history_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      word_of_the_day: {
        Row: {
          antonyms: string | null
          casual_use: string | null
          created_at: string
          date: string
          definition: string | null
          etymology: string | null
          id: string
          part_of_speech: string | null
          professional_use: string | null
          synonyms: string | null
          word: string
        }
        Insert: {
          antonyms?: string | null
          casual_use?: string | null
          created_at?: string
          date: string
          definition?: string | null
          etymology?: string | null
          id?: string
          part_of_speech?: string | null
          professional_use?: string | null
          synonyms?: string | null
          word: string
        }
        Update: {
          antonyms?: string | null
          casual_use?: string | null
          created_at?: string
          date?: string
          definition?: string | null
          etymology?: string | null
          id?: string
          part_of_speech?: string | null
          professional_use?: string | null
          synonyms?: string | null
          word?: string
        }
        Relationships: []
      }
      xp: {
        Row: {
          id: string
          level: number
          total_xp: number
          user_id: string
        }
        Insert: {
          id?: string
          level?: number
          total_xp?: number
          user_id: string
        }
        Update: {
          id?: string
          level?: number
          total_xp?: number
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
