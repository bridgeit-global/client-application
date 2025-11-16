export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      blog_posts: {
        Row: {
          content: string
          created_at: string | null
          discom: string | null
          excerpt: string
          id: string
          published: boolean
          slug: string
          state: string
          title: string
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          discom?: string | null
          excerpt: string
          id?: string
          published?: boolean
          slug: string
          state: string
          title: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          discom?: string | null
          excerpt?: string
          id?: string
          published?: boolean
          slug?: string
          state?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      contact_requests: {
        Row: {
          average_monthly_bill: string | null
          business_type: string | null
          cin: string | null
          company_name: string
          created_at: string
          designation: string
          email: string
          gst: string | null
          id: string
          name: string
          number_of_locations: string | null
          pan: string
          phone: string
          status: string | null
          step_completed: number | null
          updated_at: string | null
        }
        Insert: {
          average_monthly_bill?: string | null
          business_type?: string | null
          cin?: string | null
          company_name: string
          created_at?: string
          designation: string
          email: string
          gst?: string | null
          id?: string
          name: string
          number_of_locations?: string | null
          pan: string
          phone: string
          status?: string | null
          step_completed?: number | null
          updated_at?: string | null
        }
        Update: {
          average_monthly_bill?: string | null
          business_type?: string | null
          cin?: string | null
          company_name?: string
          created_at?: string
          designation?: string
          email?: string
          gst?: string | null
          id?: string
          name?: string
          number_of_locations?: string | null
          pan?: string
          phone?: string
          status?: string | null
          step_completed?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_requests: {
        Row: {
          company_name: string
          created_at: string
          document_number: string
          document_type: string
          email: string
          first_name: string
          id: string
          last_name: string | null
          org_id: string | null
          phone: string
          request_type: string | null
          role: string | null
          updated_at: string
        }
        Insert: {
          company_name: string
          created_at?: string
          document_number: string
          document_type: string
          email: string
          first_name: string
          id?: string
          last_name?: string | null
          org_id?: string | null
          phone: string
          request_type?: string | null
          role?: string | null
          updated_at?: string
        }
        Update: {
          company_name?: string
          created_at?: string
          document_number?: string
          document_type?: string
          email?: string
          first_name?: string
          id?: string
          last_name?: string | null
          org_id?: string | null
          phone?: string
          request_type?: string | null
          role?: string | null
          updated_at?: string
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
      station_type: "COCO" | "POCO" | "COPO" | "POPO" | "Warehouse" | "Trial"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

