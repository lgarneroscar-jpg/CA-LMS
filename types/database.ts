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
      diagnostic_responses: {
        Row: {
          id: string;
          question_key: string;
          response: string | null;
          student_id: string;
          submitted_at: string;
        };
        Insert: {
          id?: string;
          question_key: string;
          response?: string | null;
          student_id: string;
          submitted_at?: string;
        };
        Update: {
          id?: string;
          question_key?: string;
          response?: string | null;
          student_id?: string;
          submitted_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "diagnostic_responses_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      exercise_responses: {
        Row: {
          exercise_key: string;
          id: string;
          module_id: string;
          response: string | null;
          student_id: string;
          submitted_at: string;
        };
        Insert: {
          exercise_key: string;
          id?: string;
          module_id: string;
          response?: string | null;
          student_id: string;
          submitted_at?: string;
        };
        Update: {
          exercise_key?: string;
          id?: string;
          module_id?: string;
          response?: string | null;
          student_id?: string;
          submitted_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "exercise_responses_module_id_fkey";
            columns: ["module_id"];
            isOneToOne: false;
            referencedRelation: "modules";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "exercise_responses_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      flags: {
        Row: {
          created_at: string;
          flagged_by: string;
          id: string;
          note: string | null;
          student_id: string;
        };
        Insert: {
          created_at?: string;
          flagged_by: string;
          id?: string;
          note?: string | null;
          student_id: string;
        };
        Update: {
          created_at?: string;
          flagged_by?: string;
          id?: string;
          note?: string | null;
          student_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "flags_flagged_by_fkey";
            columns: ["flagged_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "flags_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      institutions: {
        Row: {
          admin_can_manage_students: boolean;
          cohort_start_date: string | null;
          created_at: string;
          drip_type: string;
          id: string;
          is_pilot: boolean;
          is_fully_unlocked: boolean;
          logo_url: string | null;
          name: string;
          notes: string | null;
          primary_color: string | null;
          reporting_cadence: string;
        };
        Insert: {
          admin_can_manage_students?: boolean;
          cohort_start_date?: string | null;
          created_at?: string;
          drip_type?: string;
          id?: string;
          is_pilot?: boolean;
          is_fully_unlocked?: boolean;
          logo_url?: string | null;
          name: string;
          notes?: string | null;
          primary_color?: string | null;
          reporting_cadence?: string;
        };
        Update: {
          admin_can_manage_students?: boolean;
          cohort_start_date?: string | null;
          created_at?: string;
          drip_type?: string;
          id?: string;
          is_pilot?: boolean;
          is_fully_unlocked?: boolean;
          logo_url?: string | null;
          name?: string;
          notes?: string | null;
          primary_color?: string | null;
          reporting_cadence?: string;
        };
        Relationships: [];
      };
      login_events: {
        Row: {
          id: string;
          logged_in_at: string;
          user_id: string;
        };
        Insert: {
          id?: string;
          logged_in_at?: string;
          user_id: string;
        };
        Update: {
          id?: string;
          logged_in_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "login_events_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      modules: {
        Row: {
          created_at: string;
          description: string | null;
          exercises: Json | null;
          id: string;
          is_live_session: boolean;
          module_code: string;
          order_index: number;
          pillar: number;
          slug: string;
          title: string;
          unlock_week: number;
          video_url: string | null;
          stream_url: string | null;
          recording_url: string | null;
          workbook_content: Json | null;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          exercises?: Json | null;
          id?: string;
          is_live_session?: boolean;
          module_code: string;
          order_index?: number;
          pillar: number;
          slug: string;
          title: string;
          unlock_week?: number;
          video_url?: string | null;
          stream_url?: string | null;
          recording_url?: string | null;
          workbook_content?: Json | null;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          exercises?: Json | null;
          id?: string;
          is_live_session?: boolean;
          module_code?: string;
          order_index?: number;
          pillar?: number;
          slug?: string;
          title?: string;
          unlock_week?: number;
          video_url?: string | null;
          stream_url?: string | null;
          recording_url?: string | null;
          workbook_content?: Json | null;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          created_at: string;
          id: string;
          is_read: boolean;
          message: string;
          type: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          is_read?: boolean;
          message: string;
          type: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_read?: boolean;
          message?: string;
          type?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          bio: string | null;
          created_at: string;
          diagnostic_complete: boolean;
          earned_badges: Json;
          full_name: string | null;
          grad_year: number | null;
          id: string;
          institution_id: string | null;
          last_active_date: string | null;
          last_active_week: number | null;
          last_login: string | null;
          linkedin_url: string | null;
          onboarding_complete: boolean;
          is_demo: boolean;
          profile_picture_url: string | null;
          program_completed_at: string | null;
          program_started_at: string | null;
          rank: number | null;
          role: string;
          streak_days: number;
          streak_milestones_awarded: Json;
          xp: number;
        };
        Insert: {
          bio?: string | null;
          created_at?: string;
          diagnostic_complete?: boolean;
          earned_badges?: Json;
          full_name?: string | null;
          grad_year?: number | null;
          id: string;
          institution_id?: string | null;
          last_active_date?: string | null;
          last_active_week?: number | null;
          last_login?: string | null;
          linkedin_url?: string | null;
          onboarding_complete?: boolean;
          is_demo?: boolean;
          profile_picture_url?: string | null;
          program_completed_at?: string | null;
          program_started_at?: string | null;
          rank?: number | null;
          role: string;
          streak_days?: number;
          streak_milestones_awarded?: Json;
          xp?: number;
        };
        Update: {
          bio?: string | null;
          created_at?: string;
          diagnostic_complete?: boolean;
          earned_badges?: Json;
          full_name?: string | null;
          grad_year?: number | null;
          id?: string;
          institution_id?: string | null;
          last_active_date?: string | null;
          last_active_week?: number | null;
          last_login?: string | null;
          linkedin_url?: string | null;
          onboarding_complete?: boolean;
          is_demo?: boolean;
          profile_picture_url?: string | null;
          program_completed_at?: string | null;
          program_started_at?: string | null;
          rank?: number | null;
          role?: string;
          streak_days?: number;
          streak_milestones_awarded?: Json;
          xp?: number;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_institution_id_fkey";
            columns: ["institution_id"];
            isOneToOne: false;
            referencedRelation: "institutions";
            referencedColumns: ["id"];
          },
        ];
      };
      quiz_questions: {
        Row: {
          correct_answer: string;
          id: string;
          module_id: string;
          options: Json;
          order_index: number;
          question: string;
        };
        Insert: {
          correct_answer: string;
          id?: string;
          module_id: string;
          options?: Json;
          order_index?: number;
          question: string;
        };
        Update: {
          correct_answer?: string;
          id?: string;
          module_id?: string;
          options?: Json;
          order_index?: number;
          question?: string;
        };
        Relationships: [
          {
            foreignKeyName: "quiz_questions_module_id_fkey";
            columns: ["module_id"];
            isOneToOne: false;
            referencedRelation: "modules";
            referencedColumns: ["id"];
          },
        ];
      };
      student_progress: {
        Row: {
          completed_at: string | null;
          created_at: string;
          exercises_submitted: boolean;
          id: string;
          is_complete: boolean;
          module_id: string;
          quiz_completed: boolean;
          quiz_score: number | null;
          student_id: string;
          video_watched: boolean;
          xp_earned: number;
        };
        Insert: {
          completed_at?: string | null;
          created_at?: string;
          exercises_submitted?: boolean;
          id?: string;
          is_complete?: boolean;
          module_id: string;
          quiz_completed?: boolean;
          quiz_score?: number | null;
          student_id: string;
          video_watched?: boolean;
          xp_earned?: number;
        };
        Update: {
          completed_at?: string | null;
          created_at?: string;
          exercises_submitted?: boolean;
          id?: string;
          is_complete?: boolean;
          module_id?: string;
          quiz_completed?: boolean;
          quiz_score?: number | null;
          student_id?: string;
          video_watched?: boolean;
          xp_earned?: number;
        };
        Relationships: [
          {
            foreignKeyName: "student_progress_module_id_fkey";
            columns: ["module_id"];
            isOneToOne: false;
            referencedRelation: "modules";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "student_progress_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      reports: {
        Row: {
          created_at: string;
          id: string;
          institution_id: string;
          period_end: string;
          period_start: string;
          snapshot: Json;
        };
        Insert: {
          created_at?: string;
          id?: string;
          institution_id: string;
          period_end: string;
          period_start: string;
          snapshot: Json;
        };
        Update: {
          created_at?: string;
          id?: string;
          institution_id?: string;
          period_end?: string;
          period_start?: string;
          snapshot?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "reports_institution_id_fkey";
            columns: ["institution_id"];
            isOneToOne: false;
            referencedRelation: "institutions";
            referencedColumns: ["id"];
          },
        ];
      };
      institution_unlocked_weeks: {
        Row: {
          created_at: string;
          id: string;
          institution_id: string;
          week_number: number;
        };
        Insert: {
          created_at?: string;
          id?: string;
          institution_id: string;
          week_number: number;
        };
        Update: {
          created_at?: string;
          id?: string;
          institution_id?: string;
          week_number?: number;
        };
        Relationships: [
          {
            foreignKeyName: "institution_unlocked_weeks_institution_id_fkey";
            columns: ["institution_id"];
            isOneToOne: false;
            referencedRelation: "institutions";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      current_user_institution_id: { Args: Record<string, never>; Returns: string };
      current_user_role: { Args: Record<string, never>; Returns: string };
      recalculate_cohort_ranks: {
        Args: { p_institution_id: string };
        Returns: undefined;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

type DefaultSchema = Database["public"];

export type Tables<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T]["Row"];

export type TablesInsert<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T]["Insert"];

export type TablesUpdate<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T]["Update"];
