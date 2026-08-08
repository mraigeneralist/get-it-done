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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          coin_reward: number
          condition_type: Database["public"]["Enums"]["achievement_condition"]
          description: string
          icon: string
          key: string
          name: string
          sort_order: number
          threshold: number
          tier: number
          xp_reward: number
        }
        Insert: {
          coin_reward?: number
          condition_type: Database["public"]["Enums"]["achievement_condition"]
          description: string
          icon?: string
          key: string
          name: string
          sort_order?: number
          threshold: number
          tier?: number
          xp_reward?: number
        }
        Update: {
          coin_reward?: number
          condition_type?: Database["public"]["Enums"]["achievement_condition"]
          description?: string
          icon?: string
          key?: string
          name?: string
          sort_order?: number
          threshold?: number
          tier?: number
          xp_reward?: number
        }
        Relationships: []
      }
      alarms: {
        Row: {
          created_at: string
          enabled: boolean
          id: string
          label: string
          repeat_days: number[]
          snooze_minutes: number
          sound_key: string
          time_of_day: string
          user_id: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          id?: string
          label?: string
          repeat_days?: number[]
          snooze_minutes?: number
          sound_key?: string
          time_of_day: string
          user_id: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          id?: string
          label?: string
          repeat_days?: number[]
          snooze_minutes?: number
          sound_key?: string
          time_of_day?: string
          user_id?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          color: string
          created_at: string
          icon: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          icon?: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          icon?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_quests: {
        Row: {
          claimed: boolean
          coin_reward: number
          completed: boolean
          created_at: string
          id: string
          progress: number
          quest_date: string
          quest_key: string
          target: number
          user_id: string
          xp_reward: number
        }
        Insert: {
          claimed?: boolean
          coin_reward?: number
          completed?: boolean
          created_at?: string
          id?: string
          progress?: number
          quest_date: string
          quest_key: string
          target: number
          user_id: string
          xp_reward?: number
        }
        Update: {
          claimed?: boolean
          coin_reward?: number
          completed?: boolean
          created_at?: string
          id?: string
          progress?: number
          quest_date?: string
          quest_key?: string
          target?: number
          user_id?: string
          xp_reward?: number
        }
        Relationships: []
      }
      focus_sessions: {
        Row: {
          actual_minutes: number | null
          completed: boolean
          created_at: string
          ends_at: string
          id: string
          kind: Database["public"]["Enums"]["focus_kind"]
          planned_minutes: number
          started_at: string
          task_id: string | null
          user_id: string
        }
        Insert: {
          actual_minutes?: number | null
          completed?: boolean
          created_at?: string
          ends_at: string
          id?: string
          kind?: Database["public"]["Enums"]["focus_kind"]
          planned_minutes: number
          started_at?: string
          task_id?: string | null
          user_id: string
        }
        Update: {
          actual_minutes?: number | null
          completed?: boolean
          created_at?: string
          ends_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["focus_kind"]
          planned_minutes?: number
          started_at?: string
          task_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "focus_sessions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_key: string
          coins: number
          created_at: string
          current_streak: number
          display_name: string
          equipped_theme: string
          id: string
          last_completed_date: string | null
          level: number
          longest_streak: number
          streak_freezes: number
          timezone: string
          updated_at: string
          xp: number
        }
        Insert: {
          avatar_key?: string
          coins?: number
          created_at?: string
          current_streak?: number
          display_name?: string
          equipped_theme?: string
          id: string
          last_completed_date?: string | null
          level?: number
          longest_streak?: number
          streak_freezes?: number
          timezone?: string
          updated_at?: string
          xp?: number
        }
        Update: {
          avatar_key?: string
          coins?: number
          created_at?: string
          current_streak?: number
          display_name?: string
          equipped_theme?: string
          id?: string
          last_completed_date?: string | null
          level?: number
          longest_streak?: number
          streak_freezes?: number
          timezone?: string
          updated_at?: string
          xp?: number
        }
        Relationships: []
      }
      shop_items: {
        Row: {
          cost: number
          description: string
          key: string
          name: string
          payload: Json
          sort_order: number
          type: Database["public"]["Enums"]["shop_item_type"]
        }
        Insert: {
          cost: number
          description?: string
          key: string
          name: string
          payload?: Json
          sort_order?: number
          type: Database["public"]["Enums"]["shop_item_type"]
        }
        Update: {
          cost?: number
          description?: string
          key?: string
          name?: string
          payload?: Json
          sort_order?: number
          type?: Database["public"]["Enums"]["shop_item_type"]
        }
        Relationships: []
      }
      tasks: {
        Row: {
          category_id: string | null
          completed_at: string | null
          created_at: string
          difficulty: Database["public"]["Enums"]["task_difficulty"]
          due_at: string | null
          id: string
          notes: string | null
          parent_task_id: string | null
          recurrence: Database["public"]["Enums"]["task_recurrence"]
          reminder_at: string | null
          sort_order: number
          status: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category_id?: string | null
          completed_at?: string | null
          created_at?: string
          difficulty?: Database["public"]["Enums"]["task_difficulty"]
          due_at?: string | null
          id?: string
          notes?: string | null
          parent_task_id?: string | null
          recurrence?: Database["public"]["Enums"]["task_recurrence"]
          reminder_at?: string | null
          sort_order?: number
          status?: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category_id?: string | null
          completed_at?: string | null
          created_at?: string
          difficulty?: Database["public"]["Enums"]["task_difficulty"]
          due_at?: string | null
          id?: string
          notes?: string | null
          parent_task_id?: string | null
          recurrence?: Database["public"]["Enums"]["task_recurrence"]
          reminder_at?: string | null
          sort_order?: number
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_parent_task_id_fkey"
            columns: ["parent_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achievement_key: string
          progress: number
          unlocked_at: string | null
          user_id: string
        }
        Insert: {
          achievement_key: string
          progress?: number
          unlocked_at?: string | null
          user_id: string
        }
        Update: {
          achievement_key?: string
          progress?: number
          unlocked_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_key_fkey"
            columns: ["achievement_key"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["key"]
          },
        ]
      }
      user_inventory: {
        Row: {
          acquired_at: string
          equipped: boolean
          item_key: string
          user_id: string
        }
        Insert: {
          acquired_at?: string
          equipped?: boolean
          item_key: string
          user_id: string
        }
        Update: {
          acquired_at?: string
          equipped?: boolean
          item_key?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_inventory_item_key_fkey"
            columns: ["item_key"]
            isOneToOne: false
            referencedRelation: "shop_items"
            referencedColumns: ["key"]
          },
        ]
      }
      xp_events: {
        Row: {
          coins: number
          created_at: string
          id: string
          source_id: string
          source_type: Database["public"]["Enums"]["xp_source"]
          user_id: string
          xp: number
        }
        Insert: {
          coins?: number
          created_at?: string
          id?: string
          source_id: string
          source_type: Database["public"]["Enums"]["xp_source"]
          user_id: string
          xp?: number
        }
        Update: {
          coins?: number
          created_at?: string
          id?: string
          source_id?: string
          source_type?: Database["public"]["Enums"]["xp_source"]
          user_id?: string
          xp?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      claim_quest: { Args: { p_quest_id: string }; Returns: Json }
      complete_focus_session: { Args: { p_session_id: string }; Returns: Json }
      complete_task: { Args: { p_task_id: string }; Returns: Json }
      ensure_daily_quests: { Args: never; Returns: Json }
      gid_level_for_xp: { Args: { p_xp: number }; Returns: number }
      gid_profile_snapshot: { Args: { p_user_id: string }; Returns: Json }
      gid_rank_for_level: { Args: { p_level: number }; Returns: string }
      gid_sync_achievements: { Args: { p_user_id: string }; Returns: Json }
      gid_xp_for_level: { Args: { p_level: number }; Returns: number }
      purchase_item: { Args: { p_item_key: string }; Returns: Json }
      uncomplete_task: { Args: { p_task_id: string }; Returns: Json }
    }
    Enums: {
      achievement_condition:
        | "tasks_completed"
        | "streak_days"
        | "focus_minutes"
        | "level_reached"
        | "sessions_completed"
      focus_kind: "focus" | "short_break" | "long_break"
      shop_item_type: "theme" | "app_icon" | "avatar" | "consumable"
      task_difficulty: "easy" | "medium" | "hard"
      task_recurrence: "none" | "daily" | "weekdays" | "weekly" | "monthly"
      task_status: "pending" | "completed" | "archived"
      xp_source: "task" | "focus_session" | "quest" | "achievement" | "purchase"
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
      achievement_condition: [
        "tasks_completed",
        "streak_days",
        "focus_minutes",
        "level_reached",
        "sessions_completed",
      ],
      focus_kind: ["focus", "short_break", "long_break"],
      shop_item_type: ["theme", "app_icon", "avatar", "consumable"],
      task_difficulty: ["easy", "medium", "hard"],
      task_recurrence: ["none", "daily", "weekdays", "weekly", "monthly"],
      task_status: ["pending", "completed", "archived"],
      xp_source: ["task", "focus_session", "quest", "achievement", "purchase"],
    },
  },
} as const
