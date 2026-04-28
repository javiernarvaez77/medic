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
      allergies: {
        Row: {
          created_at: string
          id: string
          name: string
          notes: string | null
          severity: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          severity?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          severity?: string | null
          user_id?: string
        }
        Relationships: []
      }
      appointments: {
        Row: {
          appointment_date: string
          created_at: string
          doctor_name: string
          id: string
          ips: string | null
          location: string | null
          modality: string | null
          notes: string | null
          specialty: string | null
          status: Database["public"]["Enums"]["appointment_status"] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          appointment_date: string
          created_at?: string
          doctor_name: string
          id?: string
          ips?: string | null
          location?: string | null
          modality?: string | null
          notes?: string | null
          specialty?: string | null
          status?: Database["public"]["Enums"]["appointment_status"] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          appointment_date?: string
          created_at?: string
          doctor_name?: string
          id?: string
          ips?: string | null
          location?: string | null
          modality?: string | null
          notes?: string | null
          specialty?: string | null
          status?: Database["public"]["Enums"]["appointment_status"] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      blood_pressure_readings: {
        Row: {
          created_at: string
          diastolic: number
          id: string
          measurement_time: string
          notes: string | null
          pulse: number | null
          systolic: number
          user_id: string
        }
        Insert: {
          created_at?: string
          diastolic: number
          id?: string
          measurement_time?: string
          notes?: string | null
          pulse?: number | null
          systolic: number
          user_id: string
        }
        Update: {
          created_at?: string
          diastolic?: number
          id?: string
          measurement_time?: string
          notes?: string | null
          pulse?: number | null
          systolic?: number
          user_id?: string
        }
        Relationships: []
      }
      clinical_documents: {
        Row: {
          description: string | null
          doctor_id: string | null
          file_name: string
          file_url: string
          id: string
          read_by_patient: boolean
          uploaded_at: string
          user_id: string
        }
        Insert: {
          description?: string | null
          doctor_id?: string | null
          file_name: string
          file_url: string
          id?: string
          read_by_patient?: boolean
          uploaded_at?: string
          user_id: string
        }
        Update: {
          description?: string | null
          doctor_id?: string | null
          file_name?: string
          file_url?: string
          id?: string
          read_by_patient?: boolean
          uploaded_at?: string
          user_id?: string
        }
        Relationships: []
      }
      clinical_notes: {
        Row: {
          category: Database["public"]["Enums"]["clinical_note_category"]
          content: string
          created_at: string
          doctor_id: string
          id: string
          patient_id: string
        }
        Insert: {
          category?: Database["public"]["Enums"]["clinical_note_category"]
          content: string
          created_at?: string
          doctor_id: string
          id?: string
          patient_id: string
        }
        Update: {
          category?: Database["public"]["Enums"]["clinical_note_category"]
          content?: string
          created_at?: string
          doctor_id?: string
          id?: string
          patient_id?: string
        }
        Relationships: []
      }
      doctor_patients: {
        Row: {
          assigned_at: string
          doctor_id: string
          id: string
          patient_id: string
        }
        Insert: {
          assigned_at?: string
          doctor_id: string
          id?: string
          patient_id: string
        }
        Update: {
          assigned_at?: string
          doctor_id?: string
          id?: string
          patient_id?: string
        }
        Relationships: []
      }
      emergency_contacts: {
        Row: {
          created_at: string
          id: string
          is_primary: boolean | null
          name: string
          phone: string
          relationship: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_primary?: boolean | null
          name: string
          phone: string
          relationship?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_primary?: boolean | null
          name?: string
          phone?: string
          relationship?: string | null
          user_id?: string
        }
        Relationships: []
      }
      glucose_readings: {
        Row: {
          created_at: string
          id: string
          meal_context: string
          meal_type: string | null
          measurement_time: string
          notes: string | null
          user_id: string
          value: number
        }
        Insert: {
          created_at?: string
          id?: string
          meal_context: string
          meal_type?: string | null
          measurement_time?: string
          notes?: string | null
          user_id: string
          value: number
        }
        Update: {
          created_at?: string
          id?: string
          meal_context?: string
          meal_type?: string | null
          measurement_time?: string
          notes?: string | null
          user_id?: string
          value?: number
        }
        Relationships: []
      }
      home_visits: {
        Row: {
          created_at: string
          id: string
          observations: string | null
          reason: string | null
          user_id: string
          visit_date: string
          visitor_name: string
          vitals: Json | null
        }
        Insert: {
          created_at?: string
          id?: string
          observations?: string | null
          reason?: string | null
          user_id: string
          visit_date?: string
          visitor_name: string
          vitals?: Json | null
        }
        Update: {
          created_at?: string
          id?: string
          observations?: string | null
          reason?: string | null
          user_id?: string
          visit_date?: string
          visitor_name?: string
          vitals?: Json | null
        }
        Relationships: []
      }
      lab_results: {
        Row: {
          created_at: string
          file_url: string | null
          id: string
          name: string
          normal_range: string | null
          notes: string | null
          result_date: string
          unit: string | null
          user_id: string
          value: number | null
        }
        Insert: {
          created_at?: string
          file_url?: string | null
          id?: string
          name: string
          normal_range?: string | null
          notes?: string | null
          result_date: string
          unit?: string | null
          user_id: string
          value?: number | null
        }
        Update: {
          created_at?: string
          file_url?: string | null
          id?: string
          name?: string
          normal_range?: string | null
          notes?: string | null
          result_date?: string
          unit?: string | null
          user_id?: string
          value?: number | null
        }
        Relationships: []
      }
      medication_logs: {
        Row: {
          created_at: string
          id: string
          log_date: string
          medication_id: string
          scheduled_time: string
          skipped: boolean | null
          taken_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          log_date?: string
          medication_id: string
          scheduled_time: string
          skipped?: boolean | null
          taken_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          log_date?: string
          medication_id?: string
          scheduled_time?: string
          skipped?: boolean | null
          taken_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "medication_logs_medication_id_fkey"
            columns: ["medication_id"]
            isOneToOne: false
            referencedRelation: "medications"
            referencedColumns: ["id"]
          },
        ]
      }
      medications: {
        Row: {
          active: boolean | null
          condition: string | null
          created_at: string
          dose: string
          frequency: string
          id: string
          instructions: string | null
          name: string
          times: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean | null
          condition?: string | null
          created_at?: string
          dose: string
          frequency: string
          id?: string
          instructions?: string | null
          name: string
          times?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean | null
          condition?: string | null
          created_at?: string
          dose?: string
          frequency?: string
          id?: string
          instructions?: string | null
          name?: string
          times?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notification_logs: {
        Row: {
          created_at: string
          id: string
          medication_id: string | null
          message: string
          notification_type: string
          scheduled_time: string
          sent_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          medication_id?: string | null
          message: string
          notification_type?: string
          scheduled_time: string
          sent_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          medication_id?: string | null
          message?: string
          notification_type?: string
          scheduled_time?: string
          sent_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_logs_medication_id_fkey"
            columns: ["medication_id"]
            isOneToOne: false
            referencedRelation: "medications"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_conditions: {
        Row: {
          cie10_code: string | null
          created_at: string
          diagnosed_date: string | null
          id: string
          is_primary: boolean
          name: string
          notes: string | null
          user_id: string
        }
        Insert: {
          cie10_code?: string | null
          created_at?: string
          diagnosed_date?: string | null
          id?: string
          is_primary?: boolean
          name: string
          notes?: string | null
          user_id: string
        }
        Update: {
          cie10_code?: string | null
          created_at?: string
          diagnosed_date?: string | null
          id?: string
          is_primary?: boolean
          name?: string
          notes?: string | null
          user_id?: string
        }
        Relationships: []
      }
      pending_labs: {
        Row: {
          completed: boolean | null
          created_at: string
          due_date: string | null
          id: string
          name: string
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          created_at?: string
          due_date?: string | null
          id?: string
          name: string
          user_id: string
        }
        Update: {
          completed?: boolean | null
          created_at?: string
          due_date?: string | null
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          blood_type: string | null
          created_at: string
          date_of_birth: string | null
          document_id: string | null
          eps: string | null
          full_name: string
          gender: string | null
          id: string
          ips: string | null
          phone: string | null
          profession: string | null
          professional_id: string | null
          programs: string[] | null
          sede_id: string | null
          specialties: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          blood_type?: string | null
          created_at?: string
          date_of_birth?: string | null
          document_id?: string | null
          eps?: string | null
          full_name: string
          gender?: string | null
          id?: string
          ips?: string | null
          phone?: string | null
          profession?: string | null
          professional_id?: string | null
          programs?: string[] | null
          sede_id?: string | null
          specialties?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          blood_type?: string | null
          created_at?: string
          date_of_birth?: string | null
          document_id?: string | null
          eps?: string | null
          full_name?: string
          gender?: string | null
          id?: string
          ips?: string | null
          phone?: string | null
          profession?: string | null
          professional_id?: string | null
          programs?: string[] | null
          sede_id?: string | null
          specialties?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_sede_id_fkey"
            columns: ["sede_id"]
            isOneToOne: false
            referencedRelation: "sedes"
            referencedColumns: ["id"]
          },
        ]
      }
      sedes: {
        Row: {
          created_at: string
          departamento: string
          direccion: string | null
          id: string
          municipio: string
          nombre: string
          telefono: string | null
        }
        Insert: {
          created_at?: string
          departamento: string
          direccion?: string | null
          id?: string
          municipio: string
          nombre: string
          telefono?: string | null
        }
        Update: {
          created_at?: string
          departamento?: string
          direccion?: string | null
          id?: string
          municipio?: string
          nombre?: string
          telefono?: string | null
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
      weight_records: {
        Row: {
          bmi: number | null
          created_at: string
          height_cm: number
          id: string
          measurement_date: string
          notes: string | null
          user_id: string
          weight_kg: number
        }
        Insert: {
          bmi?: number | null
          created_at?: string
          height_cm: number
          id?: string
          measurement_date?: string
          notes?: string | null
          user_id: string
          weight_kg: number
        }
        Update: {
          bmi?: number | null
          created_at?: string
          height_cm?: number
          id?: string
          measurement_date?: string
          notes?: string | null
          user_id?: string
          weight_kg?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_doctor_kpis: { Args: { _doctor_id: string }; Returns: Json }
      get_doctor_reports: {
        Args: { _days?: number; _doctor_id: string }
        Returns: Json
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "patient" | "doctor" | "caregiver" | "admin"
      appointment_status:
        | "scheduled"
        | "completed"
        | "cancelled"
        | "rescheduled"
      chronic_program:
        | "riesgo_cardiovascular"
        | "diabetes"
        | "hipertension"
        | "enfermedad_renal"
        | "enfermedad_respiratoria"
        | "tiroides"
        | "otro"
      clinical_note_category:
        | "evolucion"
        | "interconsulta"
        | "plan_manejo"
        | "educacion"
        | "otro"
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
      app_role: ["patient", "doctor", "caregiver", "admin"],
      appointment_status: [
        "scheduled",
        "completed",
        "cancelled",
        "rescheduled",
      ],
      chronic_program: [
        "riesgo_cardiovascular",
        "diabetes",
        "hipertension",
        "enfermedad_renal",
        "enfermedad_respiratoria",
        "tiroides",
        "otro",
      ],
      clinical_note_category: [
        "evolucion",
        "interconsulta",
        "plan_manejo",
        "educacion",
        "otro",
      ],
    },
  },
} as const
