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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  portal: {
    Tables: {
      additional_charges: {
        Row: {
          additional_security_deposit: number
          adjustment: number
          arrears: number
          created_at: string
          id: string
          interest_on_sd: number
          other_charges: number
          rebate_subsidy: number
          round_off_amount: number
          updated_at: string
          wheeling_charges: number
        }
        Insert: {
          additional_security_deposit?: number
          adjustment?: number
          arrears?: number
          created_at?: string
          id: string
          interest_on_sd?: number
          other_charges?: number
          rebate_subsidy?: number
          round_off_amount?: number
          updated_at?: string
          wheeling_charges?: number
        }
        Update: {
          additional_security_deposit?: number
          adjustment?: number
          arrears?: number
          created_at?: string
          id?: string
          interest_on_sd?: number
          other_charges?: number
          rebate_subsidy?: number
          round_off_amount?: number
          updated_at?: string
          wheeling_charges?: number
        }
        Relationships: [
          {
            foreignKeyName: "additional_charges_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "bills"
            referencedColumns: ["id"]
          },
        ]
      }
      adherence_charges: {
        Row: {
          capacitor_surcharge: number
          created_at: string
          id: string
          low_pf_surcharge: number
          lpsc: number
          misuse_surcharge: number
          power_factor_incentive: number
          power_factor_penalty: number
          sanctioned_load_penalty: number
          tod_rebate: number
          tod_surcharge: number
          updated_at: string
        }
        Insert: {
          capacitor_surcharge?: number
          created_at?: string
          id: string
          low_pf_surcharge?: number
          lpsc?: number
          misuse_surcharge?: number
          power_factor_incentive?: number
          power_factor_penalty?: number
          sanctioned_load_penalty?: number
          tod_rebate?: number
          tod_surcharge?: number
          updated_at?: string
        }
        Update: {
          capacitor_surcharge?: number
          created_at?: string
          id?: string
          low_pf_surcharge?: number
          lpsc?: number
          misuse_surcharge?: number
          power_factor_incentive?: number
          power_factor_penalty?: number
          sanctioned_load_penalty?: number
          tod_rebate?: number
          tod_surcharge?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "adherence_charges_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "bills"
            referencedColumns: ["id"]
          },
        ]
      }
      api_clients: {
        Row: {
          client_secret: string
          created_at: string | null
          id: string
          is_active: boolean | null
          org_id: string
          role: string | null
          scopes: string[] | null
        }
        Insert: {
          client_secret: string
          created_at?: string | null
          id: string
          is_active?: boolean | null
          org_id: string
          role?: string | null
          scopes?: string[] | null
        }
        Update: {
          client_secret?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          org_id?: string
          role?: string | null
          scopes?: string[] | null
        }
        Relationships: []
      }
      batches: {
        Row: {
          batch_advice_url: string | null
          batch_amount: number
          batch_create_url: string | null
          batch_id: string
          batch_name: string | null
          batch_receipt_url: string | null
          batch_status: string
          created_at: string
          created_by: string | null
          org_id: string | null
          remark: string | null
          updated_at: string | null
          updated_by: string | null
          user_actions: Json | null
          validate_at: string | null
        }
        Insert: {
          batch_advice_url?: string | null
          batch_amount?: number
          batch_create_url?: string | null
          batch_id: string
          batch_name?: string | null
          batch_receipt_url?: string | null
          batch_status?: string
          created_at?: string
          created_by?: string | null
          org_id?: string | null
          remark?: string | null
          updated_at?: string | null
          updated_by?: string | null
          user_actions?: Json | null
          validate_at?: string | null
        }
        Update: {
          batch_advice_url?: string | null
          batch_amount?: number
          batch_create_url?: string | null
          batch_id?: string
          batch_name?: string | null
          batch_receipt_url?: string | null
          batch_status?: string
          created_at?: string
          created_by?: string | null
          org_id?: string | null
          remark?: string | null
          updated_at?: string | null
          updated_by?: string | null
          user_actions?: Json | null
          validate_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "batches_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "batches_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      bill_level_connection_info: {
        Row: {
          connection_date: string | null
          connection_type: string | null
          created_at: string
          id: string
          latitude: number | null
          longitude: number | null
          sanction_load: number | null
          sanction_type: string | null
          security_deposit: number | null
          tariff: string | null
          updated_at: string | null
        }
        Insert: {
          connection_date?: string | null
          connection_type?: string | null
          created_at?: string
          id: string
          latitude?: number | null
          longitude?: number | null
          sanction_load?: number | null
          sanction_type?: string | null
          security_deposit?: number | null
          tariff?: string | null
          updated_at?: string | null
        }
        Update: {
          connection_date?: string | null
          connection_type?: string | null
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          sanction_load?: number | null
          sanction_type?: string | null
          security_deposit?: number | null
          tariff?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bill_level_connection_info_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "bills"
            referencedColumns: ["id"]
          },
        ]
      }
      biller_board_summary: {
        Row: {
          biller_id: string
          board_name: string
          created_at: string
          ev_swap_cost: number | null
          ev_unit_cost: number | null
          fetch_date: string
          non_ev_swap_cost: number | null
          non_unit_cost: number | null
          org_id: string
        }
        Insert: {
          biller_id: string
          board_name?: string
          created_at?: string
          ev_swap_cost?: number | null
          ev_unit_cost?: number | null
          fetch_date: string
          non_ev_swap_cost?: number | null
          non_unit_cost?: number | null
          org_id: string
        }
        Update: {
          biller_id?: string
          board_name?: string
          created_at?: string
          ev_swap_cost?: number | null
          ev_unit_cost?: number | null
          fetch_date?: string
          non_ev_swap_cost?: number | null
          non_unit_cost?: number | null
          org_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "biller_board_summary_biller_id_fkey"
            columns: ["biller_id"]
            isOneToOne: false
            referencedRelation: "biller_list"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "biller_board_summary_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      biller_list: {
        Row: {
          alias: string
          board_name: string
          created_at: string
          id: string
          parameters: Json[]
          state: string
          status: boolean
          updated_at: string
        }
        Insert: {
          alias: string
          board_name: string
          created_at?: string
          id: string
          parameters?: Json[]
          state: string
          status?: boolean
          updated_at?: string
        }
        Update: {
          alias?: string
          board_name?: string
          created_at?: string
          id?: string
          parameters?: Json[]
          state?: string
          status?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      biller_payment_transactions: {
        Row: {
          amount_paid: number
          bill_id: string | null
          created_at: string
          created_by: string | null
          payment_method: string | null
          receipt_url: string | null
          recharge_id: string | null
          transaction_date: string
          transaction_reference: string
          transaction_remarks: string | null
          transaction_status: string | null
        }
        Insert: {
          amount_paid: number
          bill_id?: string | null
          created_at?: string
          created_by?: string | null
          payment_method?: string | null
          receipt_url?: string | null
          recharge_id?: string | null
          transaction_date: string
          transaction_reference: string
          transaction_remarks?: string | null
          transaction_status?: string | null
        }
        Update: {
          amount_paid?: number
          bill_id?: string | null
          created_at?: string
          created_by?: string | null
          payment_method?: string | null
          receipt_url?: string | null
          recharge_id?: string | null
          transaction_date?: string
          transaction_reference?: string
          transaction_remarks?: string | null
          transaction_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "biller_payment_transactions_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "bills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "biller_payment_transactions_recharge_id_fkey"
            columns: ["recharge_id"]
            isOneToOne: false
            referencedRelation: "prepaid_recharge"
            referencedColumns: ["id"]
          },
        ]
      }
      bills: {
        Row: {
          approved_amount: number | null
          batch_id: string | null
          bill_amount: number
          bill_date: string
          bill_number: string
          bill_status: string
          bill_type: string
          bill_type_reason: Json | null
          billed_unit: number
          connection_id: string
          content: string
          content_type: string
          created_at: string
          days_created_vs_bill_date: number | null
          days_due_vs_bill_date: number | null
          disconnection_date: string | null
          discount_date: string | null
          discount_date_rebate: number | null
          due_date: string
          due_date_rebate: number
          end_date: string | null
          id: string
          is_active: boolean
          is_deleted: boolean | null
          is_overload: boolean | null
          is_valid: boolean | null
          next_bill_date: string | null
          paid_status: string | null
          payment_status: boolean
          penalty_amount: number
          projected_units: number | null
          rebate_accrued: number | null
          rebate_potential: number | null
          receipt_content_type: string | null
          receipt_url: string | null
          sanction_load: number | null
          sanction_type: string | null
          start_date: string | null
          site_type: string | null
          swap_cost: number | null
          swap_count: number | null
          unit_cost: number | null
          updated_at: string | null
          validation_reason: Json | null
        }
        Insert: {
          approved_amount?: number | null
          batch_id?: string | null
          bill_amount: number
          bill_date: string
          bill_number: string
          bill_status?: string
          bill_type: string
          bill_type_reason?: Json | null
          billed_unit: number
          connection_id: string
          content: string
          content_type: string
          created_at?: string
          days_created_vs_bill_date?: number | null
          days_due_vs_bill_date?: number | null
          disconnection_date?: string | null
          discount_date?: string | null
          discount_date_rebate?: number | null
          due_date: string
          due_date_rebate?: number
          end_date?: string | null
          id: string
          is_active?: boolean
          is_deleted?: boolean | null
          is_overload?: boolean | null
          is_valid?: boolean | null
          next_bill_date?: string | null
          paid_status?: string | null
          payment_status?: boolean
          penalty_amount?: number
          projected_units?: number | null
          rebate_accrued?: number | null
          rebate_potential?: number | null
          receipt_content_type?: string | null
          receipt_url?: string | null
          sanction_load?: number | null
          sanction_type?: string | null
          start_date?: string | null
          site_type?: string | null
          swap_cost?: number | null
          swap_count?: number | null
          unit_cost?: number | null
          updated_at?: string | null
          validation_reason?: Json | null
        }
        Update: {
          approved_amount?: number | null
          batch_id?: string | null
          bill_amount?: number
          bill_date?: string
          bill_number?: string
          bill_status?: string
          bill_type?: string
          bill_type_reason?: Json | null
          billed_unit?: number
          connection_id?: string
          content?: string
          content_type?: string
          created_at?: string
          days_created_vs_bill_date?: number | null
          days_due_vs_bill_date?: number | null
          disconnection_date?: string | null
          discount_date?: string | null
          discount_date_rebate?: number | null
          due_date?: string
          due_date_rebate?: number
          end_date?: string | null
          id?: string
          is_active?: boolean
          is_deleted?: boolean | null
          is_overload?: boolean | null
          is_valid?: boolean | null
          next_bill_date?: string | null
          paid_status?: string | null
          payment_status?: boolean
          penalty_amount?: number
          projected_units?: number | null
          rebate_accrued?: number | null
          rebate_potential?: number | null
          receipt_content_type?: string | null
          receipt_url?: string | null
          sanction_load?: number | null
          sanction_type?: string | null
          start_date?: string | null
          site_type?: string | null
          swap_cost?: number | null
          swap_count?: number | null
          unit_cost?: number | null
          updated_at?: string | null
          validation_reason?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "bill_fetch_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bill_fetch_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "low_balance_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bills_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["batch_id"]
          },
        ]
      }
      bills_approved_logs: {
        Row: {
          approved_logs: Json | null
          id: string
        }
        Insert: {
          approved_logs?: Json | null
          id: string
        }
        Update: {
          approved_logs?: Json | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bills_approved_logs_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "bills"
            referencedColumns: ["id"]
          },
        ]
      }
      client_payments: {
        Row: {
          approval_status: string
          approved_amount: number | null
          approved_by: string | null
          batch_id: string
          bill_amount: number | null
          bill_id: string | null
          client_paid_amount: number | null
          client_paid_date: string | null
          created_at: string
          id: string
          is_locked: boolean
          paid_amount: number | null
          paid_date: string | null
          recharge_id: string | null
          ref_id: string | null
          remarks: string | null
          status: string | null
          updated_at: string | null
          updated_by: string | null
          user_actions: Json
        }
        Insert: {
          approval_status?: string
          approved_amount?: number | null
          approved_by?: string | null
          batch_id: string
          bill_amount?: number | null
          bill_id?: string | null
          client_paid_amount?: number | null
          client_paid_date?: string | null
          created_at?: string
          id?: string
          is_locked?: boolean
          paid_amount?: number | null
          paid_date?: string | null
          recharge_id?: string | null
          ref_id?: string | null
          remarks?: string | null
          status?: string | null
          updated_at?: string | null
          updated_by?: string | null
          user_actions?: Json
        }
        Update: {
          approval_status?: string
          approved_amount?: number | null
          approved_by?: string | null
          batch_id?: string
          bill_amount?: number | null
          bill_id?: string | null
          client_paid_amount?: number | null
          client_paid_date?: string | null
          created_at?: string
          id?: string
          is_locked?: boolean
          paid_amount?: number | null
          paid_date?: string | null
          recharge_id?: string | null
          ref_id?: string | null
          remarks?: string | null
          status?: string | null
          updated_at?: string | null
          updated_by?: string | null
          user_actions?: Json
        }
        Relationships: [
          {
            foreignKeyName: "bill_payments_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "bills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_payments_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["batch_id"]
          },
          {
            foreignKeyName: "client_payments_recharge_id_fkey"
            columns: ["recharge_id"]
            isOneToOne: false
            referencedRelation: "prepaid_recharge"
            referencedColumns: ["id"]
          },
        ]
      }
      client_wallet_ledgers: {
        Row: {
          amount: number
          batch_id: string | null
          bill_id: string | null
          created_at: string
          id: string
          recharge_id: string | null
          remarks: string | null
          source: string
          transaction_id: string | null
          transaction_type: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          batch_id?: string | null
          bill_id?: string | null
          created_at?: string
          id?: string
          recharge_id?: string | null
          remarks?: string | null
          source: string
          transaction_id?: string | null
          transaction_type: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          batch_id?: string | null
          bill_id?: string | null
          created_at?: string
          id?: string
          recharge_id?: string | null
          remarks?: string | null
          source?: string
          transaction_id?: string | null
          transaction_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_wallet_ledgers_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["batch_id"]
          },
          {
            foreignKeyName: "client_wallet_ledgers_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "bills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_wallet_ledgers_recharge_id_fkey"
            columns: ["recharge_id"]
            isOneToOne: false
            referencedRelation: "prepaid_recharge"
            referencedColumns: ["id"]
          },
        ]
      }
      connection_metrics: {
        Row: {
          billed_unit: number | null
          charges: number | null
          created_at: string
          id: string
          swap_cost: number | null
          swapped_unit: number | null
          unit_cost: number | null
          updated_at: string
        }
        Insert: {
          billed_unit?: number | null
          charges?: number | null
          created_at?: string
          id: string
          swap_cost?: number | null
          swapped_unit?: number | null
          unit_cost?: number | null
          updated_at?: string
        }
        Update: {
          billed_unit?: number | null
          charges?: number | null
          created_at?: string
          id?: string
          swap_cost?: number | null
          swapped_unit?: number | null
          unit_cost?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "connection_metrics_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "connection_metrics_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "low_balance_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      connections: {
        Row: {
          account_number: string
          address: string | null
          approved: boolean | null
          billed_demand: number | null
          biller_id: string
          connection_date: string | null
          connection_details: Json | null
          connection_type: string | null
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          is_bulk: boolean | null
          is_deleted: boolean
          latitude: number | null
          longitude: number | null
          name: string | null
          next_bill_date: string | null
          parameters: Json[]
          paytype: number
          remarks: string | null
          sanction_load: number | null
          sanction_type: string | null
          security_deposit: number | null
          site_id: string | null
          submeter_info: Json | null
          tariff: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          account_number: string
          address?: string | null
          approved?: boolean | null
          billed_demand?: number | null
          biller_id: string
          connection_date?: string | null
          connection_details?: Json | null
          connection_type?: string | null
          created_at?: string
          created_by?: string | null
          id: string
          is_active?: boolean
          is_bulk?: boolean | null
          is_deleted?: boolean
          latitude?: number | null
          longitude?: number | null
          name?: string | null
          next_bill_date?: string | null
          parameters: Json[]
          paytype: number
          remarks?: string | null
          sanction_load?: number | null
          sanction_type?: string | null
          security_deposit?: number | null
          site_id?: string | null
          submeter_info?: Json | null
          tariff?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          account_number?: string
          address?: string | null
          approved?: boolean | null
          billed_demand?: number | null
          biller_id?: string
          connection_date?: string | null
          connection_details?: Json | null
          connection_type?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          is_bulk?: boolean | null
          is_deleted?: boolean
          latitude?: number | null
          longitude?: number | null
          name?: string | null
          next_bill_date?: string | null
          parameters?: Json[]
          paytype?: number
          remarks?: string | null
          sanction_load?: number | null
          sanction_type?: string | null
          security_deposit?: number | null
          site_id?: string | null
          submeter_info?: Json | null
          tariff?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "connection_biller_id_fkey"
            columns: ["biller_id"]
            isOneToOne: false
            referencedRelation: "biller_list"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "connections_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      core_charges: {
        Row: {
          created_at: string
          demand_charges: number
          energy_charges: number
          fixed_charges: number
          fppac_charges: number
          id: string
          minimum_charges: number
          surcharge: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          demand_charges?: number
          energy_charges?: number
          fixed_charges?: number
          fppac_charges?: number
          id: string
          minimum_charges?: number
          surcharge?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          demand_charges?: number
          energy_charges?: number
          fixed_charges?: number
          fppac_charges?: number
          id?: string
          minimum_charges?: number
          surcharge?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "core_charges_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "bills"
            referencedColumns: ["id"]
          },
        ]
      }
      dashboard_data: {
        Row: {
          change: string | null
          icon: string | null
          index: number
          page: string | null
          path: string | null
          status: number
          title: string
          value: string
          value_type: number | null
        }
        Insert: {
          change?: string | null
          icon?: string | null
          index: number
          page?: string | null
          path?: string | null
          status?: number
          title: string
          value: string
          value_type?: number | null
        }
        Update: {
          change?: string | null
          icon?: string | null
          index?: number
          page?: string | null
          path?: string | null
          status?: number
          title?: string
          value?: string
          value_type?: number | null
        }
        Relationships: []
      }
      dashboard_summary: {
        Row: {
          icon: string | null
          index: number
          org_id: string
          path: string | null
          status: number
          title: string
          value: string
          value_type: number | null
        }
        Insert: {
          icon?: string | null
          index: number
          org_id: string
          path?: string | null
          status?: number
          title: string
          value: string
          value_type?: number | null
        }
        Update: {
          icon?: string | null
          index?: number
          org_id?: string
          path?: string | null
          status?: number
          title?: string
          value?: string
          value_type?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "dashboard_summary_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      dashboard_support_data: {
        Row: {
          change: string | null
          icon: string | null
          index: number
          path: string | null
          status: number
          title: string
          value: string
          value_type: number | null
        }
        Insert: {
          change?: string | null
          icon?: string | null
          index: number
          path?: string | null
          status?: number
          title: string
          value: string
          value_type?: number | null
        }
        Update: {
          change?: string | null
          icon?: string | null
          index?: number
          path?: string | null
          status?: number
          title?: string
          value?: string
          value_type?: number | null
        }
        Relationships: []
      }
      dlq_messages: {
        Row: {
          account_number: string
          biller_id: string
          created_at: string
          description: string | null
          dlq_type: string
          message_data: Json
          message_id: string
          reason: string | null
          status: string | null
        }
        Insert: {
          account_number: string
          biller_id: string
          created_at?: string
          description?: string | null
          dlq_type: string
          message_data: Json
          message_id: string
          reason?: string | null
          status?: string | null
        }
        Update: {
          account_number?: string
          biller_id?: string
          created_at?: string
          description?: string | null
          dlq_type?: string
          message_data?: Json
          message_id?: string
          reason?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dlq_messages_biller_id_fkey"
            columns: ["biller_id"]
            isOneToOne: false
            referencedRelation: "biller_list"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          content: string
          id: number
          link: string | null
          metadata: Json | null
          table_name: string
          title: string | null
        }
        Insert: {
          content: string
          id?: number
          link?: string | null
          metadata?: Json | null
          table_name: string
          title?: string | null
        }
        Update: {
          content?: string
          id?: number
          link?: string | null
          metadata?: Json | null
          table_name?: string
          title?: string | null
        }
        Relationships: []
      }
      due_summary: {
        Row: {
          created_at: string
          fetch_date: string
          index: number | null
          label: string
          path: string | null
          total_amount: number | null
          total_count: number | null
          type: string
          week_range: string
        }
        Insert: {
          created_at?: string
          fetch_date: string
          index?: number | null
          label: string
          path?: string | null
          total_amount?: number | null
          total_count?: number | null
          type: string
          week_range: string
        }
        Update: {
          created_at?: string
          fetch_date?: string
          index?: number | null
          label?: string
          path?: string | null
          total_amount?: number | null
          total_count?: number | null
          type?: string
          week_range?: string
        }
        Relationships: []
      }
      issues: {
        Row: {
          category: string
          created_at: string
          created_by: string
          description: string
          id: string
          org_id: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          created_by: string
          description: string
          id?: string
          org_id: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string
          description?: string
          id?: string
          org_id?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      kpi_metrics: {
        Row: {
          calculation_month: string
          created_at: string | null
          current_value: number
          id: string
          kpi_category: string
          kpi_name: string
          last_month_value: number | null
          metadata: Json | null
          org_id: string
          trend_direction: string | null
          trend_percentage: number | null
          unit: string
          updated_at: string | null
        }
        Insert: {
          calculation_month: string
          created_at?: string | null
          current_value: number
          id?: string
          kpi_category: string
          kpi_name: string
          last_month_value?: number | null
          metadata?: Json | null
          org_id: string
          trend_direction?: string | null
          trend_percentage?: number | null
          unit: string
          updated_at?: string | null
        }
        Update: {
          calculation_month?: string
          created_at?: string | null
          current_value?: number
          id?: string
          kpi_category?: string
          kpi_name?: string
          last_month_value?: number | null
          metadata?: Json | null
          org_id?: string
          trend_direction?: string | null
          trend_percentage?: number | null
          unit?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kpi_metrics_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      master: {
        Row: {
          created_at: string
          name: string
          type: string
          value: string
        }
        Insert: {
          created_at?: string
          name: string
          type: string
          value: string
        }
        Update: {
          created_at?: string
          name?: string
          type?: string
          value?: string
        }
        Relationships: []
      }
      meter_readings: {
        Row: {
          bill_id: string
          billed_demand: number | null
          created_at: string
          end_date: string
          end_reading: number
          meter_no: string
          multiplication_factor: number
          start_date: string
          start_reading: number
          type: string
          updated_at: string
        }
        Insert: {
          bill_id: string
          billed_demand?: number | null
          created_at?: string
          end_date: string
          end_reading: number
          meter_no: string
          multiplication_factor: number
          start_date: string
          start_reading: number
          type: string
          updated_at?: string
        }
        Update: {
          bill_id?: string
          billed_demand?: number | null
          created_at?: string
          end_date?: string
          end_reading?: number
          meter_no?: string
          multiplication_factor?: number
          start_date?: string
          start_reading?: number
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meter_readings_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "bills"
            referencedColumns: ["id"]
          },
        ]
      }
      org_master: {
        Row: {
          created_at: string
          name: string | null
          org_id: string
          type: string
          updated_at: string | null
          value: string
        }
        Insert: {
          created_at?: string
          name?: string | null
          org_id: string
          type: string
          updated_at?: string | null
          value: string
        }
        Update: {
          created_at?: string
          name?: string | null
          org_id?: string
          type?: string
          updated_at?: string | null
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_master_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          batch_threshold_amount: number
          cin: string | null
          company_address: string | null
          company_email: string | null
          company_name: string | null
          email: Json | null
          gst: string | null
          id: string
          logo_url: string | null
          name: string
          pan: string | null
          site_name: string
          webhook_config: Json | null
        }
        Insert: {
          batch_threshold_amount?: number
          cin?: string | null
          company_address?: string | null
          company_email?: string | null
          company_name?: string | null
          email?: Json | null
          gst?: string | null
          id?: string
          logo_url?: string | null
          name: string
          pan?: string | null
          site_name?: string
          webhook_config?: Json | null
        }
        Update: {
          batch_threshold_amount?: number
          cin?: string | null
          company_address?: string | null
          company_email?: string | null
          company_name?: string | null
          email?: Json | null
          gst?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          pan?: string | null
          site_name?: string
          webhook_config?: Json | null
        }
        Relationships: []
      }
      payment_gateway_transactions: {
        Row: {
          amount: number
          batch_id: string
          created_at: string
          created_by: string | null
          is_locked: boolean
          payment_method: string
          payment_remarks: string | null
          payment_status: string | null
          transaction_date: string
          transaction_pay_type: string
          transaction_reference: string
          updated_by: string | null
        }
        Insert: {
          amount: number
          batch_id: string
          created_at?: string
          created_by?: string | null
          is_locked?: boolean
          payment_method: string
          payment_remarks?: string | null
          payment_status?: string | null
          transaction_date: string
          transaction_pay_type?: string
          transaction_reference: string
          updated_by?: string | null
        }
        Update: {
          amount?: number
          batch_id?: string
          created_at?: string
          created_by?: string | null
          is_locked?: boolean
          payment_method?: string
          payment_remarks?: string | null
          payment_status?: string | null
          transaction_date?: string
          transaction_pay_type?: string
          transaction_reference?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_gateway_transactions_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["batch_id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          collection_date: string
          connection_id: string
          content: string | null
          content_type: string | null
          created_at: string
          created_by: string | null
          id: string
          reference_id: string | null
          site_type: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          amount: number
          collection_date: string
          connection_id: string
          content?: string | null
          content_type?: string | null
          created_at?: string
          created_by?: string | null
          id: string
          reference_id?: string | null
          site_type?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          amount?: number
          collection_date?: string
          connection_id?: string
          content?: string | null
          content_type?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          reference_id?: string | null
          site_type?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_connection_id_fkey1"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_connection_id_fkey1"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "low_balance_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      prepaid_balances: {
        Row: {
          balance_amount: number
          created_at: string
          fetch_date: string
          id: string
          updated_at: string
        }
        Insert: {
          balance_amount: number
          created_at?: string
          fetch_date: string
          id: string
          updated_at?: string
        }
        Update: {
          balance_amount?: number
          created_at?: string
          fetch_date?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "prepaid_balances_id_fkey"
            columns: ["id"]
            isOneToOne: false
            referencedRelation: "connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prepaid_balances_id_fkey"
            columns: ["id"]
            isOneToOne: false
            referencedRelation: "low_balance_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      prepaid_info: {
        Row: {
          id: string
          percentage_monthly_consumption: number
          threshold_amount: number
        }
        Insert: {
          id: string
          percentage_monthly_consumption?: number
          threshold_amount?: number
        }
        Update: {
          id?: string
          percentage_monthly_consumption?: number
          threshold_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "prepaid_info_id_fkey1"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prepaid_info_id_fkey1"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "low_balance_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      prepaid_recharge: {
        Row: {
          approved_log: Json | null
          batch_id: string | null
          connection_id: string
          created_at: string
          id: string
          is_active: boolean | null
          is_deleted: boolean | null
          recharge_amount: number | null
          recharge_date: string
          recharge_status: string
          updated_at: string | null
        }
        Insert: {
          approved_log?: Json | null
          batch_id?: string | null
          connection_id: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          is_deleted?: boolean | null
          recharge_amount?: number | null
          recharge_date: string
          recharge_status?: string
          updated_at?: string | null
        }
        Update: {
          approved_log?: Json | null
          batch_id?: string | null
          connection_id?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          is_deleted?: boolean | null
          recharge_amount?: number | null
          recharge_date?: string
          recharge_status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prepaid_recharge_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["batch_id"]
          },
          {
            foreignKeyName: "prepaid_recharge_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prepaid_recharge_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "low_balance_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      refund_payment_transactions: {
        Row: {
          amount: number
          batch_id: string | null
          bill_id: string | null
          created_at: string
          created_by: string | null
          date: string | null
          id: string
          payment_method: string | null
          recharge_id: string | null
          reference_id: string | null
          remarks: string | null
          status: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          amount: number
          batch_id?: string | null
          bill_id?: string | null
          created_at?: string
          created_by?: string | null
          date?: string | null
          id?: string
          payment_method?: string | null
          recharge_id?: string | null
          reference_id?: string | null
          remarks?: string | null
          status?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          amount?: number
          batch_id?: string | null
          bill_id?: string | null
          created_at?: string
          created_by?: string | null
          date?: string | null
          id?: string
          payment_method?: string | null
          recharge_id?: string | null
          reference_id?: string | null
          remarks?: string | null
          status?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "refund_payment_transactions_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["batch_id"]
          },
          {
            foreignKeyName: "refund_payment_transactions_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "bills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refund_payment_transactions_recharge_id_fkey"
            columns: ["recharge_id"]
            isOneToOne: false
            referencedRelation: "prepaid_recharge"
            referencedColumns: ["id"]
          },
        ]
      }
      registrations: {
        Row: {
          approved: boolean
          created_at: string
          created_by: string
          data: Json
          id: string
          is_bulk: boolean
          parent_id: string | null
          remarks: string | null
        }
        Insert: {
          approved?: boolean
          created_at?: string
          created_by: string
          data: Json
          id?: string
          is_bulk?: boolean
          parent_id?: string | null
          remarks?: string | null
        }
        Update: {
          approved?: boolean
          created_at?: string
          created_by?: string
          data?: Json
          id?: string
          is_bulk?: boolean
          parent_id?: string | null
          remarks?: string | null
        }
        Relationships: []
      }
      regulatory_charges: {
        Row: {
          cgst: number
          created_at: string
          electricity_duty: number
          id: string
          municipal_tax: number
          sgst: number
          tax_at_source: number
          updated_at: string
        }
        Insert: {
          cgst?: number
          created_at?: string
          electricity_duty?: number
          id: string
          municipal_tax?: number
          sgst?: number
          tax_at_source?: number
          updated_at?: string
        }
        Update: {
          cgst?: number
          created_at?: string
          electricity_duty?: number
          id?: string
          municipal_tax?: number
          sgst?: number
          tax_at_source?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "regulatory_charges_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "bills"
            referencedColumns: ["id"]
          },
        ]
      }
      sites: {
        Row: {
          created_at: string
          created_by: string
          id: string
          is_active: boolean
          latitude: number | null
          longitude: number | null
          name: string | null
          org_id: string
          type: string
          updated_at: string
          zone_id: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          id: string
          is_active?: boolean
          latitude?: number | null
          longitude?: number | null
          name?: string | null
          org_id: string
          type: string
          updated_at?: string
          zone_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          is_active?: boolean
          latitude?: number | null
          longitude?: number | null
          name?: string | null
          org_id?: string
          type?: string
          updated_at?: string
          zone_id?: string | null
        }
        Relationships: []
      }
      sites_swap_counts_history: {
        Row: {
          created_at: string
          fetch_date: string
          site_id: string
          swap_count: number
          updated_at: string | null
          zoneid: string | null
        }
        Insert: {
          created_at?: string
          fetch_date: string
          site_id: string
          swap_count: number
          updated_at?: string | null
          zoneid?: string | null
        }
        Update: {
          created_at?: string
          fetch_date?: string
          site_id?: string
          swap_count?: number
          updated_at?: string | null
          zoneid?: string | null
        }
        Relationships: []
      }
      submeter_readings: {
        Row: {
          connection_id: string
          created_at: string
          created_by: string | null
          end_reading: number
          operator_info: Json | null
          per_day_unit: number | null
          reading_date: string
          snapshot_urls: Json | null
          start_reading: number
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          connection_id: string
          created_at?: string
          created_by?: string | null
          end_reading?: number
          operator_info?: Json | null
          per_day_unit?: number | null
          reading_date: string
          snapshot_urls?: Json | null
          start_reading?: number
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          connection_id?: string
          created_at?: string
          created_by?: string | null
          end_reading?: number
          operator_info?: Json | null
          per_day_unit?: number | null
          reading_date?: string
          snapshot_urls?: Json | null
          start_reading?: number
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "submeter_readings_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submeter_readings_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "low_balance_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string | null
          email: string | null
          email_confirmed_at: string | null
          first_name: string | null
          id: string
          last_name: string | null
          org_id: string | null
          phone_confirmed_at: string | null
          phone_no: string | null
          role: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          email_confirmed_at?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          org_id?: string | null
          phone_confirmed_at?: string | null
          phone_no?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          email_confirmed_at?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          org_id?: string | null
          phone_confirmed_at?: string | null
          phone_no?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      arrear_amount: {
        Row: {
          bill_amount: number | null
          bill_count: number | null
          biller_id: string | null
          negative_arrear_bill_count: number | null
          negative_arrears: number | null
          positive_arrear_bill_count: number | null
          positive_arrears: number | null
        }
        Relationships: [
          {
            foreignKeyName: "connection_biller_id_fkey"
            columns: ["biller_id"]
            isOneToOne: false
            referencedRelation: "biller_list"
            referencedColumns: ["id"]
          },
        ]
      }
      cost: {
        Row: {
          bill_amount: number | null
          bill_type: string | null
          billed_unit: number | null
          biller_id: string | null
          charge_swap_cost: number | null
          charge_unit_cost: number | null
          connection_type: string | null
          id: string | null
          swap_cost: number | null
          swap_count: number | null
          total_charge: number | null
          unit_cost: number | null
        }
        Relationships: [
          {
            foreignKeyName: "connection_biller_id_fkey"
            columns: ["biller_id"]
            isOneToOne: false
            referencedRelation: "biller_list"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "core_charges_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "bills"
            referencedColumns: ["id"]
          },
        ]
      }
      low_balance_connections: {
        Row: {
          account_number: string | null
          address: string | null
          approved: boolean | null
          balance_amount: number | null
          billed_demand: number | null
          biller_id: string | null
          connection_date: string | null
          connection_details: Json | null
          connection_type: string | null
          created_at: string | null
          created_by: string | null
          current_status: boolean | null
          fetch_date: string | null
          id: string | null
          is_active: boolean | null
          is_bulk: boolean | null
          is_deleted: boolean | null
          latitude: number | null
          longitude: number | null
          name: string | null
          next_bill_date: string | null
          parameters: Json[] | null
          paytype: number | null
          remarks: string | null
          sanction_load: number | null
          sanction_type: string | null
          security_deposit: number | null
          site_id: string | null
          tariff: string | null
          threshold_amount: number | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "connection_biller_id_fkey"
            columns: ["biller_id"]
            isOneToOne: false
            referencedRelation: "biller_list"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "connections_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      penalties: {
        Row: {
          bill_count: number | null
          biller_id: string | null
          capacitor_surcharge: number | null
          low_pf_surcharge: number | null
          lpsc: number | null
          misuse_surcharge: number | null
          power_factor_penalty: number | null
          sanctioned_load_penalty: number | null
          tod_surcharge: number | null
        }
        Relationships: [
          {
            foreignKeyName: "connection_biller_id_fkey"
            columns: ["biller_id"]
            isOneToOne: false
            referencedRelation: "biller_list"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      compute_bill_swap_count: { Args: { p_bill_id: string }; Returns: number }
      get_active_connections_by_board: {
        Args: never
        Returns: {
          active_count: number
          board_name: string
          state: string
        }[]
      }
      get_all_users_with_email: {
        Args: never
        Returns: {
          created_at: string
          email: string
          id: string
          role: string
          updated_at: string
        }[]
      }
      get_benefits_kpis: {
        Args: { p_end_date?: string; p_org_id: string; p_start_date?: string }
        Returns: {
          benefit_description: string
          current_value: number
          kpi_name: string
          last_month_value: number
          trend_direction: string
          trend_percentage: number
          unit: string
        }[]
      }
      get_bill_summary_last_12_months: {
        Args: { p_biller_id: string; p_site_id: string; p_site_type: string }
        Returns: {
          average_rate: number
          bill_count: number
          bill_month: string
          site_type: string
          total_bill_amount: number
          total_billed_unit: number
        }[]
      }
      get_bill_swap_count: { Args: { p_bill_id: string }; Returns: number }
      get_connection_paytype_summary: {
        Args: never
        Returns: {
          active_count: number
          inactive_count: number
          paytype: number
          total_count: number
        }[]
      }
      get_connection_summary_by_biller: {
        Args: never
        Returns: {
          avg_billed_demand: number
          avg_sanction_load: number
          biller_id: string
          total_billed_demand: number
          total_connections: number
          total_sanction_load: number
        }[]
      }
      get_connection_type_summary: {
        Args: never
        Returns: {
          active_count: number
          connection_type: string
          inactive_count: number
          total_count: number
        }[]
      }
      get_connections_summary: {
        Args: never
        Returns: {
          active_connections: number
          avg_sanction_load: number
          total_connections: number
          total_sanction_load: number
        }[]
      }
      get_day_suffix: { Args: { day: number }; Returns: string }
      get_need_attention_kpis: {
        Args: { p_end_date?: string; p_org_id: string; p_start_date?: string }
        Returns: {
          current_value: number
          kpi_name: string
          severity: string
          unit: string
        }[]
      }
      get_paid_bill_summary: {
        Args: never
        Returns: {
          id: string
          status: string
        }[]
      }
      get_payment_savings_kpis: {
        Args: { p_end_date?: string; p_org_id: string; p_start_date?: string }
        Returns: {
          accrued_value: number
          kpi_name: string
          potential_value: number
          savings_percentage: number
          unit: string
        }[]
      }
      get_request_user_org_id: { Args: never; Returns: string }
      get_site_type_summary: {
        Args: never
        Returns: {
          active_count: number
          inactive_count: number
          total_count: number
          type: string
        }[]
      }
      get_wallet_balances: {
        Args: never
        Returns: {
          balance: number
          count: number
          credits: number
          debits: number
        }[]
      }
      get_yearly_billing_summary: {
        Args: never
        Returns: {
          financial_year: string
          rate_per_unit: number
          site_type: string
          total_amount: number
          total_bills: number
          total_unit: number
        }[]
      }
      get_zone_site_summary: {
        Args: never
        Returns: {
          active_count: number
          inactive_count: number
          total_count: number
          zone_id: string
        }[]
      }
      group_bills_by_biller: { Args: never; Returns: undefined }
      group_bills_by_weeks: { Args: never; Returns: undefined }
      is_approved_amount_within_threshold: {
        Args: never
        Returns: {
          pending_amount: number
          threshold: number
          total_approved: number
        }[]
      }
      recalc_active_bill: {
        Args: { p_connection_id: string }
        Returns: undefined
      }
      refresh_report_tables: { Args: never; Returns: undefined }
      store_kpi_metrics: {
        Args: { p_calculation_month?: string; p_org_id: string }
        Returns: undefined
      }
      store_kpi_metrics_for_year: {
        Args: { p_org_id: string; p_year: number }
        Returns: undefined
      }
      update_approved_bills:
        | { Args: { bill_ids: string[] }; Returns: undefined }
        | {
            Args: { approver_email: string; bill_ids: string[] }
            Returns: undefined
          }
      update_bill_report_fields: { Args: never; Returns: undefined }
      update_dashboard_data: { Args: never; Returns: undefined }
      update_dashboard_summary: { Args: never; Returns: undefined }
      update_dashboard_support_data: { Args: never; Returns: undefined }
    }
    Enums: {
      site_type: "COCO" | "POCO" | "COPO" | "POPO"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      auth_logs: {
        Row: {
          created_at: string
          error_message: string | null
          event_type: string
          id: string
          ip_address: string | null
          metadata: Json | null
          server_id: string | null
          success: boolean
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          event_type: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          server_id?: string | null
          success?: boolean
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          event_type?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          server_id?: string | null
          success?: boolean
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_auth_logs_server_id"
            columns: ["server_id"]
            isOneToOne: false
            referencedRelation: "third_party_servers"
            referencedColumns: ["server_id"]
          },
        ]
      }
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
      pending_refund_count: {
        Row: {
          count: number | null
        }
        Insert: {
          count?: number | null
        }
        Update: {
          count?: number | null
        }
        Relationships: []
      }
      third_party_servers: {
        Row: {
          allowed_scopes: string[] | null
          created_at: string
          is_active: boolean | null
          metadata: Json | null
          public_key: string | null
          server_id: string
          server_name: string
          shared_secret: string
          updated_at: string
        }
        Insert: {
          allowed_scopes?: string[] | null
          created_at?: string
          is_active?: boolean | null
          metadata?: Json | null
          public_key?: string | null
          server_id: string
          server_name: string
          shared_secret: string
          updated_at?: string
        }
        Update: {
          allowed_scopes?: string[] | null
          created_at?: string
          is_active?: boolean | null
          metadata?: Json | null
          public_key?: string | null
          server_id?: string
          server_name?: string
          shared_secret?: string
          updated_at?: string
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
      cleanup_old_auth_logs: {
        Args: { days_to_keep?: number }
        Returns: number
      }
    }
    Enums: {
      site_type: "COCO" | "POCO" | "COPO" | "POPO"
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
  portal: {
    Enums: {
      site_type: ["COCO", "POCO", "COPO", "POPO"],
    },
  },
  public: {
    Enums: {
      site_type: ["COCO", "POCO", "COPO", "POPO"],
    },
  },
} as const
