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
      customers: {
        Row: {
          account_type: string
          balance: number
          binance_uid: string | null
          binance_wallet_address: string | null
          country: string | null
          created_at: string
          demo_balance: number
          email: string
          email_verified_at: string | null
          full_name: string
          id: string
          last_sender_address: string | null
          last_sender_network: string | null
          notes: string | null
          phone: string | null
          phone_verified_at: string | null
          preferred_coin: string | null
          referred_by: string | null
          status: string
          total_deposited: number
          total_withdrawn: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          account_type?: string
          balance?: number
          binance_uid?: string | null
          binance_wallet_address?: string | null
          country?: string | null
          created_at?: string
          demo_balance?: number
          email: string
          email_verified_at?: string | null
          full_name: string
          id?: string
          last_sender_address?: string | null
          last_sender_network?: string | null
          notes?: string | null
          phone?: string | null
          phone_verified_at?: string | null
          preferred_coin?: string | null
          referred_by?: string | null
          status?: string
          total_deposited?: number
          total_withdrawn?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          account_type?: string
          balance?: number
          binance_uid?: string | null
          binance_wallet_address?: string | null
          country?: string | null
          created_at?: string
          demo_balance?: number
          email?: string
          email_verified_at?: string | null
          full_name?: string
          id?: string
          last_sender_address?: string | null
          last_sender_network?: string | null
          notes?: string | null
          phone?: string | null
          phone_verified_at?: string | null
          preferred_coin?: string | null
          referred_by?: string | null
          status?: string
          total_deposited?: number
          total_withdrawn?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      deposits: {
        Row: {
          admin_notes: string | null
          amount: number
          approved_at: string | null
          created_at: string
          currency: string
          from_address: string | null
          id: string
          method: string
          network: string | null
          provider_ref: string | null
          screenshot_url: string | null
          status: Database["public"]["Enums"]["deposit_status"]
          transaction_id: string | null
          tx_hash: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          amount: number
          approved_at?: string | null
          created_at?: string
          currency?: string
          from_address?: string | null
          id?: string
          method?: string
          network?: string | null
          provider_ref?: string | null
          screenshot_url?: string | null
          status?: Database["public"]["Enums"]["deposit_status"]
          transaction_id?: string | null
          tx_hash?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          approved_at?: string | null
          created_at?: string
          currency?: string
          from_address?: string | null
          id?: string
          method?: string
          network?: string | null
          provider_ref?: string | null
          screenshot_url?: string | null
          status?: Database["public"]["Enums"]["deposit_status"]
          transaction_id?: string | null
          tx_hash?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deposits_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "wallet_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      investment_earnings: {
        Row: {
          amount: number
          created_at: string
          id: string
          investment_id: string
          note: string | null
          transaction_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          investment_id: string
          note?: string | null
          transaction_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          investment_id?: string
          note?: string | null
          transaction_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "investment_earnings_investment_id_fkey"
            columns: ["investment_id"]
            isOneToOne: false
            referencedRelation: "investments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investment_earnings_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "wallet_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      investment_plans: {
        Row: {
          apy_pct: number | null
          badge: string | null
          created_at: string
          daily_rate_pct: number | null
          duration_days: number | null
          flex: string | null
          id: string
          is_active: boolean
          is_popular: boolean
          max_amount: number | null
          min_amount: number
          name: string
          service: string
          sort_order: number
          total_roi_pct: number | null
          updated_at: string
        }
        Insert: {
          apy_pct?: number | null
          badge?: string | null
          created_at?: string
          daily_rate_pct?: number | null
          duration_days?: number | null
          flex?: string | null
          id?: string
          is_active?: boolean
          is_popular?: boolean
          max_amount?: number | null
          min_amount?: number
          name: string
          service: string
          sort_order?: number
          total_roi_pct?: number | null
          updated_at?: string
        }
        Update: {
          apy_pct?: number | null
          badge?: string | null
          created_at?: string
          daily_rate_pct?: number | null
          duration_days?: number | null
          flex?: string | null
          id?: string
          is_active?: boolean
          is_popular?: boolean
          max_amount?: number | null
          min_amount?: number
          name?: string
          service?: string
          sort_order?: number
          total_roi_pct?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      investments: {
        Row: {
          admin_notes: string | null
          amount: number
          created_at: string
          currency: string
          ends_at: string | null
          external_provider: string | null
          external_ref: string | null
          id: string
          plan_name: string
          service: Database["public"]["Enums"]["invest_service"]
          started_at: string | null
          status: Database["public"]["Enums"]["invest_status"]
          transaction_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          amount: number
          created_at?: string
          currency?: string
          ends_at?: string | null
          external_provider?: string | null
          external_ref?: string | null
          id?: string
          plan_name: string
          service: Database["public"]["Enums"]["invest_service"]
          started_at?: string | null
          status?: Database["public"]["Enums"]["invest_status"]
          transaction_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          created_at?: string
          currency?: string
          ends_at?: string | null
          external_provider?: string | null
          external_ref?: string | null
          id?: string
          plan_name?: string
          service?: Database["public"]["Enums"]["invest_service"]
          started_at?: string | null
          status?: Database["public"]["Enums"]["invest_status"]
          transaction_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "investments_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "wallet_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      offers: {
        Row: {
          badge: string | null
          created_at: string
          cta_label: string
          description: string
          duration_days: number | null
          effect: Json
          ends_at: string | null
          id: string
          is_active: boolean
          min_amount: number | null
          slug: string
          sort_order: number
          starts_at: string | null
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          badge?: string | null
          created_at?: string
          cta_label?: string
          description: string
          duration_days?: number | null
          effect?: Json
          ends_at?: string | null
          id?: string
          is_active?: boolean
          min_amount?: number | null
          slug: string
          sort_order?: number
          starts_at?: string | null
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          badge?: string | null
          created_at?: string
          cta_label?: string
          description?: string
          duration_days?: number | null
          effect?: Json
          ends_at?: string | null
          id?: string
          is_active?: boolean
          min_amount?: number | null
          slug?: string
          sort_order?: number
          starts_at?: string | null
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      payment_providers: {
        Row: {
          api_key: string | null
          callback_secret: string | null
          config: Json
          created_at: string
          enabled: boolean
          id: string
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          api_key?: string | null
          callback_secret?: string | null
          config?: Json
          created_at?: string
          enabled?: boolean
          id?: string
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          api_key?: string | null
          callback_secret?: string | null
          config?: Json
          created_at?: string
          enabled?: boolean
          id?: string
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      payout_config: {
        Row: {
          cadence_hours: number
          id: number
          method: string
          min_amount: number
          payout_hour_utc: number
          updated_at: string
        }
        Insert: {
          cadence_hours?: number
          id?: number
          method?: string
          min_amount?: number
          payout_hour_utc?: number
          updated_at?: string
        }
        Update: {
          cadence_hours?: number
          id?: number
          method?: string
          min_amount?: number
          payout_hour_utc?: number
          updated_at?: string
        }
        Relationships: []
      }
      payout_runs: {
        Row: {
          amount: number
          id: string
          method: string
          ran_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          id?: string
          method?: string
          ran_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          id?: string
          method?: string
          ran_at?: string
          user_id?: string
        }
        Relationships: []
      }
      phone_otp_codes: {
        Row: {
          attempts: number
          code_hash: string
          consumed_at: string | null
          created_at: string
          expires_at: string
          id: string
          phone: string
          user_id: string
        }
        Insert: {
          attempts?: number
          code_hash: string
          consumed_at?: string | null
          created_at?: string
          expires_at: string
          id?: string
          phone: string
          user_id: string
        }
        Update: {
          attempts?: number
          code_hash?: string
          consumed_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          phone?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      referral_bonuses: {
        Row: {
          admin_notes: string | null
          amount: number
          approved_at: string | null
          approved_by: string | null
          created_at: string
          currency: string
          id: string
          paid_at: string | null
          referred_handle: string | null
          referred_user_id: string | null
          referrer_id: string
          status: string
          transaction_id: string | null
          trigger_investment_id: string | null
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          currency?: string
          id?: string
          paid_at?: string | null
          referred_handle?: string | null
          referred_user_id?: string | null
          referrer_id: string
          status?: string
          transaction_id?: string | null
          trigger_investment_id?: string | null
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          currency?: string
          id?: string
          paid_at?: string | null
          referred_handle?: string | null
          referred_user_id?: string | null
          referrer_id?: string
          status?: string
          transaction_id?: string | null
          trigger_investment_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      referral_earnings: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          level: number
          referral_id: string | null
          service: string
          source_handle: string | null
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          level?: number
          referral_id?: string | null
          service: string
          source_handle?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          level?: number
          referral_id?: string | null
          service?: string
          source_handle?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_earnings_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "referrals"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          created_at: string
          id: string
          level: number
          referred_handle: string | null
          referred_user_id: string | null
          referrer_id: string
          service: string
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          level?: number
          referred_handle?: string | null
          referred_user_id?: string | null
          referrer_id: string
          service: string
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          level?: number
          referred_handle?: string | null
          referred_user_id?: string | null
          referrer_id?: string
          service?: string
          status?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          binance_pay_id: string | null
          id: number
          live_chat_enabled: boolean
          updated_at: string
          usdt_bep20_address: string | null
          usdt_erc20_address: string | null
          usdt_trc20_address: string | null
          whatsapp_enabled: boolean
          whatsapp_number: string
        }
        Insert: {
          binance_pay_id?: string | null
          id?: number
          live_chat_enabled?: boolean
          updated_at?: string
          usdt_bep20_address?: string | null
          usdt_erc20_address?: string | null
          usdt_trc20_address?: string | null
          whatsapp_enabled?: boolean
          whatsapp_number?: string
        }
        Update: {
          binance_pay_id?: string | null
          id?: number
          live_chat_enabled?: boolean
          updated_at?: string
          usdt_bep20_address?: string | null
          usdt_erc20_address?: string | null
          usdt_trc20_address?: string | null
          whatsapp_enabled?: boolean
          whatsapp_number?: string
        }
        Relationships: []
      }
      support_bot_replies: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          is_fallback: boolean
          keywords: string[]
          reply: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          is_fallback?: boolean
          keywords?: string[]
          reply: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          is_fallback?: boolean
          keywords?: string[]
          reply?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      support_conversations: {
        Row: {
          created_at: string
          guest_email: string | null
          guest_name: string
          id: string
          last_message_at: string
          status: string
          ticket_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          guest_email?: string | null
          guest_name: string
          id?: string
          last_message_at?: string
          status?: string
          ticket_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          guest_email?: string | null
          guest_name?: string
          id?: string
          last_message_at?: string
          status?: string
          ticket_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_conversations_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_messages: {
        Row: {
          author_name: string
          body: string
          conversation_id: string
          created_at: string
          id: string
          sender: string
        }
        Insert: {
          author_name: string
          body: string
          conversation_id: string
          created_at?: string
          id?: string
          sender: string
        }
        Update: {
          author_name?: string
          body?: string
          conversation_id?: string
          created_at?: string
          id?: string
          sender?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "support_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_messages: {
        Row: {
          author_id: string | null
          author_name: string
          body: string
          created_at: string
          id: string
          is_staff: boolean
          ticket_id: string
        }
        Insert: {
          author_id?: string | null
          author_name: string
          body: string
          created_at?: string
          id?: string
          is_staff?: boolean
          ticket_id: string
        }
        Update: {
          author_id?: string | null
          author_name?: string
          body?: string
          created_at?: string
          id?: string
          is_staff?: boolean
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          assigned_to: string | null
          binance_uid: string | null
          category: string
          created_at: string
          email: string
          full_name: string
          id: string
          message: string
          priority: Database["public"]["Enums"]["ticket_priority"]
          resolved_at: string | null
          source: string
          source_conversation_id: string | null
          status: Database["public"]["Enums"]["ticket_status"]
          subject: string
          ticket_number: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          assigned_to?: string | null
          binance_uid?: string | null
          category?: string
          created_at?: string
          email: string
          full_name: string
          id?: string
          message: string
          priority?: Database["public"]["Enums"]["ticket_priority"]
          resolved_at?: string | null
          source?: string
          source_conversation_id?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          subject: string
          ticket_number?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          assigned_to?: string | null
          binance_uid?: string | null
          category?: string
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          message?: string
          priority?: Database["public"]["Enums"]["ticket_priority"]
          resolved_at?: string | null
          source?: string
          source_conversation_id?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          subject?: string
          ticket_number?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tickets_source_conversation_id_fkey"
            columns: ["source_conversation_id"]
            isOneToOne: false
            referencedRelation: "support_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_offers: {
        Row: {
          applied_to_investment_id: string | null
          claimed_at: string
          created_at: string
          expires_at: string | null
          id: string
          offer_slug: string
          payload: Json
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          applied_to_investment_id?: string | null
          claimed_at?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          offer_slug: string
          payload?: Json
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          applied_to_investment_id?: string | null
          claimed_at?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          offer_slug?: string
          payload?: Json
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_offers_offer_slug_fkey"
            columns: ["offer_slug"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["slug"]
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
          role?: Database["public"]["Enums"]["app_role"]
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
      wallet_transactions: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          kind: Database["public"]["Enums"]["txn_kind"]
          method: string | null
          notes: string | null
          reference_id: string | null
          status: Database["public"]["Enums"]["txn_status"]
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          kind: Database["public"]["Enums"]["txn_kind"]
          method?: string | null
          notes?: string | null
          reference_id?: string | null
          status?: Database["public"]["Enums"]["txn_status"]
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          kind?: Database["public"]["Enums"]["txn_kind"]
          method?: string | null
          notes?: string | null
          reference_id?: string | null
          status?: Database["public"]["Enums"]["txn_status"]
          user_id?: string
        }
        Relationships: []
      }
      welcome_bonuses: {
        Row: {
          amount: number
          granted_at: string
          id: string
          source_deposit_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          granted_at?: string
          id?: string
          source_deposit_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          granted_at?: string
          id?: string
          source_deposit_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      withdrawals: {
        Row: {
          admin_notes: string | null
          amount: number
          created_at: string
          currency: string
          destination: string
          destination_type: string
          id: string
          paid_at: string | null
          status: Database["public"]["Enums"]["withdrawal_status"]
          transaction_id: string | null
          tx_hash: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          amount: number
          created_at?: string
          currency?: string
          destination: string
          destination_type?: string
          id?: string
          paid_at?: string | null
          status?: Database["public"]["Enums"]["withdrawal_status"]
          transaction_id?: string | null
          tx_hash?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          created_at?: string
          currency?: string
          destination?: string
          destination_type?: string
          id?: string
          paid_at?: string | null
          status?: Database["public"]["Enums"]["withdrawal_status"]
          transaction_id?: string | null
          tx_hash?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "withdrawals_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "wallet_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_admin_overview: {
        Args: never
        Returns: {
          customers_active: number
          customers_pending: number
          customers_suspended: number
          customers_total: number
          open_tickets: number
          paid_last_24h: number
          payouts_total: number
          total_balances: number
          total_deposited: number
          total_withdrawn: number
        }[]
      }
      get_next_payout: {
        Args: { _user_id: string }
        Returns: {
          cadence_hours: number
          last_paid_at: string
          method: string
          min_amount: number
          next_payout_at: string
          pending_amount: number
        }[]
      }
      get_referral_summary: {
        Args: { _user_id: string }
        Returns: {
          direct_count: number
          earned_last_24h: number
          lifetime_earned: number
          network_count: number
          service: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      lookup_ticket: {
        Args: { _email: string; _ticket_number: string }
        Returns: {
          category: string
          created_at: string
          priority: Database["public"]["Enums"]["ticket_priority"]
          resolved_at: string
          status: Database["public"]["Enums"]["ticket_status"]
          subject: string
          ticket_number: string
          updated_at: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "user"
      deposit_status: "pending" | "approved" | "rejected"
      invest_service: "ai_trading" | "mining" | "staking"
      invest_status: "pending" | "active" | "completed" | "cancelled"
      ticket_priority: "low" | "normal" | "high" | "urgent"
      ticket_status:
        | "open"
        | "in_progress"
        | "awaiting_customer"
        | "resolved"
        | "closed"
      txn_kind:
        | "deposit"
        | "withdrawal"
        | "earning"
        | "investment"
        | "refund"
        | "adjustment"
      txn_status: "pending" | "approved" | "rejected" | "completed" | "failed"
      withdrawal_status: "pending" | "approved" | "rejected" | "paid"
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
      app_role: ["admin", "user"],
      deposit_status: ["pending", "approved", "rejected"],
      invest_service: ["ai_trading", "mining", "staking"],
      invest_status: ["pending", "active", "completed", "cancelled"],
      ticket_priority: ["low", "normal", "high", "urgent"],
      ticket_status: [
        "open",
        "in_progress",
        "awaiting_customer",
        "resolved",
        "closed",
      ],
      txn_kind: [
        "deposit",
        "withdrawal",
        "earning",
        "investment",
        "refund",
        "adjustment",
      ],
      txn_status: ["pending", "approved", "rejected", "completed", "failed"],
      withdrawal_status: ["pending", "approved", "rejected", "paid"],
    },
  },
} as const
