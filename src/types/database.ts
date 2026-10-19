export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type BusinessRole = "superadmin" | "business_admin" | "professional";

export type BusinessStatus = "active" | "suspended" | "trial" | "cancelled";

export type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "no_show";

export type AppointmentSource = "online" | "manual" | "phone" | "whatsapp";

export type WaitlistStatus = "waiting" | "notified" | "booked" | "cancelled";

export type NotificationChannel = "email" | "whatsapp_manual";

export type NotificationStatus = "pending" | "sent" | "failed";

export type DiscountType = "percentage" | "fixed_amount";

export type InventoryMovementType =
  | "in"
  | "out"
  | "adjustment"
  | "consumed_in_service";

export interface BookingRules {
  min_advance_hours: number; // Ej: 2 (mínimo 2 horas antes)
  max_advance_days: number; // Ej: 60 (hasta 60 días en el futuro)
  cancellation_limit_hours: number; // Ej: 24 (plazo límite para cancelar sin penalización)
  max_reschedules: number; // Ej: 2 (máximo de reprogramaciones permitidas)
  slot_interval_minutes: number; // Intervalo para mostrar slots (ej: 15 o 30)
  require_deposit: boolean; // Si requiere abono
  deposit_percentage: number; // % de abono si aplica
  no_show_policy: string; // Texto explicativo de la política de inasistencia
}

export interface AvailableSlot {
  starts_at: string; // ISO UTC string
  ends_at: string; // ISO UTC string
  professional_id: string;
  professional_name: string;
}

export interface Database {
  public: {
    Tables: {
      businesses: {
        Row: {
          id: string;
          slug: string;
          name: string;
          rubro: string;
          logo_url: string | null;
          brand_color: string;
          phone: string;
          whatsapp_number: string;
          email: string;
          address: string;
          city: string;
          booking_rules: BookingRules;
          plan: string;
          status: BusinessStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          rubro?: string;
          logo_url?: string | null;
          brand_color?: string;
          phone: string;
          whatsapp_number: string;
          email: string;
          address: string;
          city?: string;
          booking_rules?: Partial<BookingRules>;
          plan?: string;
          status?: BusinessStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          rubro?: string;
          logo_url?: string | null;
          brand_color?: string;
          phone?: string;
          whatsapp_number?: string;
          email?: string;
          address?: string;
          city?: string;
          booking_rules?: Partial<BookingRules>;
          plan?: string;
          status?: BusinessStatus;
          created_at?: string;
          updated_at?: string;
        };
      };
      branches: {
        Row: {
          id: string;
          business_id: string;
          name: string;
          address: string;
          phone: string | null;
          is_main: boolean;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          name: string;
          address: string;
          phone?: string | null;
          is_main?: boolean;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          name?: string;
          address?: string;
          phone?: string | null;
          is_main?: boolean;
          is_active?: boolean;
          created_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          full_name: string;
          email: string;
          phone: string | null;
          avatar_url: string | null;
          is_superadmin: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          email: string;
          phone?: string | null;
          avatar_url?: string | null;
          is_superadmin?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          email?: string;
          phone?: string | null;
          avatar_url?: string | null;
          is_superadmin?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      business_members: {
        Row: {
          id: string;
          business_id: string;
          user_id: string;
          role: BusinessRole;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          user_id: string;
          role: BusinessRole;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          user_id?: string;
          role?: BusinessRole;
          is_active?: boolean;
          created_at?: string;
        };
      };
      professionals: {
        Row: {
          id: string;
          business_id: string;
          user_id: string | null;
          branch_id: string | null;
          name: string;
          email: string | null;
          phone: string | null;
          photo_url: string | null;
          specialties: string[];
          bio: string | null;
          commission_percentage: number;
          is_active: boolean;
          display_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          user_id?: string | null;
          branch_id?: string | null;
          name: string;
          email?: string | null;
          phone?: string | null;
          photo_url?: string | null;
          specialties?: string[];
          bio?: string | null;
          commission_percentage?: number;
          is_active?: boolean;
          display_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          user_id?: string | null;
          branch_id?: string | null;
          name?: string;
          email?: string | null;
          phone?: string | null;
          photo_url?: string | null;
          specialties?: string[];
          bio?: string | null;
          commission_percentage?: number;
          is_active?: boolean;
          display_order?: number;
          created_at?: string;
        };
      };
      service_categories: {
        Row: {
          id: string;
          business_id: string;
          name: string;
          description: string | null;
          display_order: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          name: string;
          description?: string | null;
          display_order?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          name?: string;
          description?: string | null;
          display_order?: number;
          is_active?: boolean;
          created_at?: string;
        };
      };
      services: {
        Row: {
          id: string;
          business_id: string;
          category_id: string;
          name: string;
          description: string | null;
          is_active: boolean;
          display_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          category_id: string;
          name: string;
          description?: string | null;
          is_active?: boolean;
          display_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          category_id?: string;
          name?: string;
          description?: string | null;
          is_active?: boolean;
          display_order?: number;
          created_at?: string;
        };
      };
      service_variants: {
        Row: {
          id: string;
          business_id: string;
          service_id: string;
          name: string;
          duration_minutes: number;
          price_clp: number;
          is_active: boolean;
          display_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          service_id: string;
          name: string;
          duration_minutes: number;
          price_clp: number;
          is_active?: boolean;
          display_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          service_id?: string;
          name?: string;
          duration_minutes?: number;
          price_clp?: number;
          is_active?: boolean;
          display_order?: number;
          created_at?: string;
        };
      };
      professional_services: {
        Row: {
          id: string;
          business_id: string;
          professional_id: string;
          service_variant_id: string;
          custom_duration_minutes: number | null;
          custom_price_clp: number | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          professional_id: string;
          service_variant_id: string;
          custom_duration_minutes?: number | null;
          custom_price_clp?: number | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          professional_id?: string;
          service_variant_id?: string;
          custom_duration_minutes?: number | null;
          custom_price_clp?: number | null;
          is_active?: boolean;
          created_at?: string;
        };
      };
      working_hours: {
        Row: {
          id: string;
          business_id: string;
          professional_id: string;
          day_of_week: number; // 0: Dom, 1: Lun, ..., 6: Sab
          start_time: string; // HH:mm:ss
          end_time: string; // HH:mm:ss
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          professional_id: string;
          day_of_week: number;
          start_time: string;
          end_time: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          professional_id?: string;
          day_of_week?: number;
          start_time?: string;
          end_time?: string;
          is_active?: boolean;
          created_at?: string;
        };
      };
      breaks: {
        Row: {
          id: string;
          business_id: string;
          professional_id: string;
          day_of_week: number;
          start_time: string;
          end_time: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          professional_id: string;
          day_of_week: number;
          start_time: string;
          end_time: string;
          name?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          professional_id?: string;
          day_of_week?: number;
          start_time?: string;
          end_time?: string;
          name?: string;
          created_at?: string;
        };
      };
      time_off: {
        Row: {
          id: string;
          business_id: string;
          professional_id: string;
          start_date: string; // YYYY-MM-DD
          end_date: string; // YYYY-MM-DD
          reason: string | null;
          is_all_day: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          professional_id: string;
          start_date: string;
          end_date: string;
          reason?: string | null;
          is_all_day?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          professional_id?: string;
          start_date?: string;
          end_date?: string;
          reason?: string | null;
          is_all_day?: boolean;
          created_at?: string;
        };
      };
      schedule_blocks: {
        Row: {
          id: string;
          business_id: string;
          branch_id: string | null;
          professional_id: string | null; // null si bloquea todo el local
          starts_at: string; // ISO UTC
          ends_at: string; // ISO UTC
          reason: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          branch_id?: string | null;
          professional_id?: string | null;
          starts_at: string;
          ends_at: string;
          reason: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          branch_id?: string | null;
          professional_id?: string | null;
          starts_at?: string;
          ends_at?: string;
          reason?: string;
          created_at?: string;
        };
      };
      clients: {
        Row: {
          id: string;
          business_id: string;
          rut: string; // Formato limpio o estandarizado
          full_name: string;
          phone: string;
          email: string;
          notes: string | null;
          consent_given: boolean;
          consent_date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          rut: string;
          full_name: string;
          phone: string;
          email: string;
          notes?: string | null;
          consent_given?: boolean;
          consent_date?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          rut?: string;
          full_name?: string;
          phone?: string;
          email?: string;
          notes?: string | null;
          consent_given?: boolean;
          consent_date?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      client_records: {
        Row: {
          id: string;
          business_id: string;
          client_id: string;
          professional_id: string | null;
          notes: string;
          allergies: string | null;
          preferences: string | null;
          photos: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          client_id: string;
          professional_id?: string | null;
          notes: string;
          allergies?: string | null;
          preferences?: string | null;
          photos?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          client_id?: string;
          professional_id?: string | null;
          notes?: string;
          allergies?: string | null;
          preferences?: string | null;
          photos?: string[];
          created_at?: string;
          updated_at?: string;
        };
      };
      appointments: {
        Row: {
          id: string;
          business_id: string;
          branch_id: string | null;
          professional_id: string;
          service_variant_id: string;
          client_id: string;
          starts_at: string; // ISO UTC timestamptz
          ends_at: string; // ISO UTC timestamptz
          status: AppointmentStatus;
          total_price_clp: number;
          source: AppointmentSource;
          client_notes: string | null;
          admin_notes: string | null;
          cancel_token: string;
          cancelled_at: string | null;
          cancel_reason: string | null;
          reschedule_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          branch_id?: string | null;
          professional_id: string;
          service_variant_id: string;
          client_id: string;
          starts_at: string;
          ends_at: string;
          status?: AppointmentStatus;
          total_price_clp: number;
          source?: AppointmentSource;
          client_notes?: string | null;
          admin_notes?: string | null;
          cancel_token?: string;
          cancelled_at?: string | null;
          cancel_reason?: string | null;
          reschedule_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          branch_id?: string | null;
          professional_id?: string;
          service_variant_id?: string;
          client_id?: string;
          starts_at?: string;
          ends_at?: string;
          status?: AppointmentStatus;
          total_price_clp?: number;
          source?: AppointmentSource;
          client_notes?: string | null;
          admin_notes?: string | null;
          cancel_token?: string;
          cancelled_at?: string | null;
          cancel_reason?: string | null;
          reschedule_count?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      waitlist: {
        Row: {
          id: string;
          business_id: string;
          client_id: string;
          service_variant_id: string;
          professional_id: string | null;
          preferred_date_start: string;
          preferred_date_end: string;
          status: WaitlistStatus;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          client_id: string;
          service_variant_id: string;
          professional_id?: string | null;
          preferred_date_start: string;
          preferred_date_end: string;
          status?: WaitlistStatus;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          client_id?: string;
          service_variant_id?: string;
          professional_id?: string | null;
          preferred_date_start?: string;
          preferred_date_end?: string;
          status?: WaitlistStatus;
          notes?: string | null;
          created_at?: string;
        };
      };
      promotions: {
        Row: {
          id: string;
          business_id: string;
          name: string;
          description: string | null;
          discount_type: DiscountType;
          discount_value: number;
          start_date: string;
          end_date: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          name: string;
          description?: string | null;
          discount_type: DiscountType;
          discount_value: number;
          start_date: string;
          end_date: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          name?: string;
          description?: string | null;
          discount_type?: DiscountType;
          discount_value?: number;
          start_date?: string;
          end_date?: string;
          is_active?: boolean;
          created_at?: string;
        };
      };
      coupons: {
        Row: {
          id: string;
          business_id: string;
          code: string;
          discount_type: DiscountType;
          discount_value: number;
          max_uses: number | null;
          uses_count: number;
          valid_from: string;
          valid_until: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          code: string;
          discount_type: DiscountType;
          discount_value: number;
          max_uses?: number | null;
          uses_count?: number;
          valid_from: string;
          valid_until: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          code?: string;
          discount_type?: DiscountType;
          discount_value?: number;
          max_uses?: number | null;
          uses_count?: number;
          valid_from?: string;
          valid_until?: string;
          is_active?: boolean;
          created_at?: string;
        };
      };
      packs: {
        Row: {
          id: string;
          business_id: string;
          name: string;
          description: string | null;
          total_sessions: number;
          price_clp: number;
          validity_days: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          name: string;
          description?: string | null;
          total_sessions: number;
          price_clp: number;
          validity_days: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          name?: string;
          description?: string | null;
          total_sessions?: number;
          price_clp?: number;
          validity_days?: number;
          is_active?: boolean;
          created_at?: string;
        };
      };
      inventory_items: {
        Row: {
          id: string;
          business_id: string;
          name: string;
          sku: string | null;
          description: string | null;
          current_stock: number;
          min_stock_alert: number;
          unit_cost_clp: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          name: string;
          sku?: string | null;
          description?: string | null;
          current_stock?: number;
          min_stock_alert?: number;
          unit_cost_clp: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          name?: string;
          sku?: string | null;
          description?: string | null;
          current_stock?: number;
          min_stock_alert?: number;
          unit_cost_clp?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      inventory_movements: {
        Row: {
          id: string;
          business_id: string;
          item_id: string;
          movement_type: InventoryMovementType;
          quantity: number;
          unit_cost_clp: number;
          reason: string | null;
          performed_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          item_id: string;
          movement_type: InventoryMovementType;
          quantity: number;
          unit_cost_clp: number;
          reason?: string | null;
          performed_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          item_id?: string;
          movement_type?: InventoryMovementType;
          quantity?: number;
          unit_cost_clp?: number;
          reason?: string | null;
          performed_by?: string | null;
          created_at?: string;
        };
      };
      commissions: {
        Row: {
          id: string;
          business_id: string;
          professional_id: string;
          appointment_id: string;
          commission_percentage: number;
          total_amount_clp: number;
          commission_amount_clp: number;
          status: "pending" | "paid";
          paid_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          professional_id: string;
          appointment_id: string;
          commission_percentage: number;
          total_amount_clp: number;
          commission_amount_clp: number;
          status?: "pending" | "paid";
          paid_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          professional_id?: string;
          appointment_id?: string;
          commission_percentage?: number;
          total_amount_clp?: number;
          commission_amount_clp?: number;
          status?: "pending" | "paid";
          paid_at?: string | null;
          created_at?: string;
        };
      };
      reviews: {
        Row: {
          id: string;
          business_id: string;
          appointment_id: string;
          client_id: string;
          professional_id: string;
          rating: number; // 1 to 5
          comment: string | null;
          is_public: boolean;
          business_reply: string | null;
          reply_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          appointment_id: string;
          client_id: string;
          professional_id: string;
          rating: number;
          comment?: string | null;
          is_public?: boolean;
          business_reply?: string | null;
          reply_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          appointment_id?: string;
          client_id?: string;
          professional_id?: string;
          rating?: number;
          comment?: string | null;
          is_public?: boolean;
          business_reply?: string | null;
          reply_at?: string | null;
          created_at?: string;
        };
      };
      gallery_images: {
        Row: {
          id: string;
          business_id: string;
          professional_id: string | null;
          image_url: string;
          category: string | null;
          caption: string | null;
          display_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          professional_id?: string | null;
          image_url: string;
          category?: string | null;
          caption?: string | null;
          display_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          professional_id?: string | null;
          image_url?: string;
          category?: string | null;
          caption?: string | null;
          display_order?: number;
          created_at?: string;
        };
      };
      message_templates: {
        Row: {
          id: string;
          business_id: string;
          trigger_event: string;
          channel: NotificationChannel;
          subject: string | null;
          body: string;
          variables_hint: string[];
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          trigger_event: string;
          channel: NotificationChannel;
          subject?: string | null;
          body: string;
          variables_hint?: string[];
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          trigger_event?: string;
          channel?: NotificationChannel;
          subject?: string | null;
          body?: string;
          variables_hint?: string[];
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      notifications_log: {
        Row: {
          id: string;
          business_id: string;
          appointment_id: string | null;
          channel: NotificationChannel;
          recipient: string;
          subject: string | null;
          body: string;
          status: NotificationStatus;
          attempts: number;
          error_message: string | null;
          sent_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          appointment_id?: string | null;
          channel: NotificationChannel;
          recipient: string;
          subject?: string | null;
          body: string;
          status?: NotificationStatus;
          attempts?: number;
          error_message?: string | null;
          sent_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          appointment_id?: string | null;
          channel?: NotificationChannel;
          recipient?: string;
          subject?: string | null;
          body?: string;
          status?: NotificationStatus;
          attempts?: number;
          error_message?: string | null;
          sent_at?: string | null;
          created_at?: string;
        };
      };
    };
    Functions: {
      get_available_slots: {
        Args: {
          p_business_id: string;
          p_service_variant_id: string;
          p_professional_id?: string | null;
          p_date: string;
          p_timezone?: string;
        };
        Returns: AvailableSlot[];
      };
    };
  };
}
