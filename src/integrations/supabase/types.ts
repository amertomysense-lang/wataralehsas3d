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
      cms_strings: {
        Row: {
          category: string | null
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          category?: string | null
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          category?: string | null
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      fashion_items: {
        Row: {
          created_at: string
          id: string
          image_url: string
          item_name: string
          mask_url: string | null
          price: number | null
          price_try: number | null
          price_usd: number | null
          vendor_id: string | null
          vendor_whatsapp: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          item_name: string
          mask_url?: string | null
          price?: number | null
          price_try?: number | null
          price_usd?: number | null
          vendor_id?: string | null
          vendor_whatsapp?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          item_name?: string
          mask_url?: string | null
          price?: number | null
          price_try?: number | null
          price_usd?: number | null
          vendor_id?: string | null
          vendor_whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fashion_items_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          customer_address: string | null
          customer_name: string | null
          customer_phone: string | null
          design_id: string | null
          design_name: string | null
          design_url: string | null
          embossed: boolean
          height: number
          id: string
          payment_method: string | null
          region_id: string | null
          region_name: string | null
          shipping_cost: number | null
          shipping_mode: string | null
          status: string
          surface_status: string | null
          total: number
          total_try: number | null
          total_usd: number | null
          vendor_id: string | null
          width: number
        }
        Insert: {
          created_at?: string
          customer_address?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          design_id?: string | null
          design_name?: string | null
          design_url?: string | null
          embossed?: boolean
          height?: number
          id?: string
          payment_method?: string | null
          region_id?: string | null
          region_name?: string | null
          shipping_cost?: number | null
          shipping_mode?: string | null
          status?: string
          surface_status?: string | null
          total?: number
          total_try?: number | null
          total_usd?: number | null
          vendor_id?: string | null
          width?: number
        }
        Update: {
          created_at?: string
          customer_address?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          design_id?: string | null
          design_name?: string | null
          design_url?: string | null
          embossed?: boolean
          height?: number
          id?: string
          payment_method?: string | null
          region_id?: string | null
          region_name?: string | null
          shipping_cost?: number | null
          shipping_mode?: string | null
          status?: string
          surface_status?: string | null
          total?: number
          total_try?: number | null
          total_usd?: number | null
          vendor_id?: string | null
          width?: number
        }
        Relationships: [
          {
            foreignKeyName: "orders_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_settings: {
        Row: {
          brand_name: string
          contact_email: string | null
          contact_whatsapp: string
          hero_subtitle: string | null
          hero_title: string | null
          id: number
          sham_cash_name: string | null
          sham_cash_notes: string | null
          sham_cash_number: string | null
          sham_cash_qr_url: string | null
          updated_at: string
        }
        Insert: {
          brand_name?: string
          contact_email?: string | null
          contact_whatsapp?: string
          hero_subtitle?: string | null
          hero_title?: string | null
          id?: number
          sham_cash_name?: string | null
          sham_cash_notes?: string | null
          sham_cash_number?: string | null
          sham_cash_qr_url?: string | null
          updated_at?: string
        }
        Update: {
          brand_name?: string
          contact_email?: string | null
          contact_whatsapp?: string
          hero_subtitle?: string | null
          hero_title?: string | null
          id?: number
          sham_cash_name?: string | null
          sham_cash_notes?: string | null
          sham_cash_number?: string | null
          sham_cash_qr_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      pricing_config: {
        Row: {
          currency: string
          embossed_premium_rate: number
          id: number
          price_per_meter: number
          updated_at: string
        }
        Insert: {
          currency?: string
          embossed_premium_rate?: number
          id?: number
          price_per_meter?: number
          updated_at?: string
        }
        Update: {
          currency?: string
          embossed_premium_rate?: number
          id?: number
          price_per_meter?: number
          updated_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string
          price: number | null
          price_try: number | null
          price_usd: number | null
          title: string
          type: string | null
          vendor_id: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url: string
          price?: number | null
          price_try?: number | null
          price_usd?: number | null
          title: string
          type?: string | null
          vendor_id?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string
          price?: number | null
          price_try?: number | null
          price_usd?: number | null
          title?: string
          type?: string | null
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      regions: {
        Row: {
          assistant_name: string | null
          created_at: string
          distance_km: number | null
          id: string
          is_active: boolean
          name: string
          whatsapp_number: string
        }
        Insert: {
          assistant_name?: string | null
          created_at?: string
          distance_km?: number | null
          id?: string
          is_active?: boolean
          name: string
          whatsapp_number?: string
        }
        Update: {
          assistant_name?: string | null
          created_at?: string
          distance_km?: number | null
          id?: string
          is_active?: boolean
          name?: string
          whatsapp_number?: string
        }
        Relationships: []
      }
      saved_projects: {
        Row: {
          box: Json
          created_at: string
          design_name: string | null
          design_url: string | null
          device_id: string
          height_m: number | null
          id: string
          is_public: boolean
          name: string
          room_url: string | null
          snapshot_url: string | null
          surface: string | null
          user_id: string | null
          wall_points: Json
          width_m: number | null
        }
        Insert: {
          box?: Json
          created_at?: string
          design_name?: string | null
          design_url?: string | null
          device_id: string
          height_m?: number | null
          id?: string
          is_public?: boolean
          name: string
          room_url?: string | null
          snapshot_url?: string | null
          surface?: string | null
          user_id?: string | null
          wall_points?: Json
          width_m?: number | null
        }
        Update: {
          box?: Json
          created_at?: string
          design_name?: string | null
          design_url?: string | null
          device_id?: string
          height_m?: number | null
          id?: string
          is_public?: boolean
          name?: string
          room_url?: string | null
          snapshot_url?: string | null
          surface?: string | null
          user_id?: string | null
          wall_points?: Json
          width_m?: number | null
        }
        Relationships: []
      }
      tryon_logs: {
        Row: {
          created_at: string
          garment_id: string | null
          id: string
          person_url: string | null
          result_url: string | null
          user_phone: string | null
        }
        Insert: {
          created_at?: string
          garment_id?: string | null
          id?: string
          person_url?: string | null
          result_url?: string | null
          user_phone?: string | null
        }
        Update: {
          created_at?: string
          garment_id?: string | null
          id?: string
          person_url?: string | null
          result_url?: string | null
          user_phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tryon_logs_garment_id_fkey"
            columns: ["garment_id"]
            isOneToOne: false
            referencedRelation: "fashion_items"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vendor_gallery: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          image_url: string
          sort_order: number | null
          vendor_id: string | null
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          image_url: string
          sort_order?: number | null
          vendor_id?: string | null
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          image_url?: string
          sort_order?: number | null
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendor_gallery_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendors: {
        Row: {
          bio: string | null
          business_name: string
          category: string
          cover_image: string | null
          created_at: string
          id: string
          is_premium: boolean | null
          login_token: string | null
          logo_url: string | null
          map_location: string | null
          name: string | null
          phone: string | null
          region_id: string | null
          subscription_expires_at: string | null
          subscription_status: string | null
          video_url: string | null
          whatsapp_number: string
        }
        Insert: {
          bio?: string | null
          business_name: string
          category?: string
          cover_image?: string | null
          created_at?: string
          id?: string
          is_premium?: boolean | null
          login_token?: string | null
          logo_url?: string | null
          map_location?: string | null
          name?: string | null
          phone?: string | null
          region_id?: string | null
          subscription_expires_at?: string | null
          subscription_status?: string | null
          video_url?: string | null
          whatsapp_number?: string
        }
        Update: {
          bio?: string | null
          business_name?: string
          category?: string
          cover_image?: string | null
          created_at?: string
          id?: string
          is_premium?: boolean | null
          login_token?: string | null
          logo_url?: string | null
          map_location?: string | null
          name?: string | null
          phone?: string | null
          region_id?: string | null
          subscription_expires_at?: string | null
          subscription_status?: string | null
          video_url?: string | null
          whatsapp_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendors_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
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
    },
  },
} as const
