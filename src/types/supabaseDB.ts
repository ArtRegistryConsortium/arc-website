export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      arc_wallets: {
        Row: {
          chain_id: number
          created_at: string | null
          id: number
          updated_at: string | null
          wallet_address: string
        }
        Insert: {
          chain_id: number
          created_at?: string | null
          id?: number
          updated_at?: string | null
          wallet_address: string
        }
        Update: {
          chain_id?: number
          created_at?: string | null
          id?: number
          updated_at?: string | null
          wallet_address?: string
        }
        Relationships: [
          {
            foreignKeyName: "arc_wallets_chain_id_fkey"
            columns: ["chain_id"]
            isOneToOne: false
            referencedRelation: "chains"
            referencedColumns: ["chain_id"]
          },
        ]
      }
      art_contracts: {
        Row: {
          chain_id: number
          contract_address: string
          created_at: string | null
          id: number
          identity_id: number | null
        }
        Insert: {
          chain_id: number
          contract_address: string
          created_at?: string | null
          id?: number
          identity_id?: number | null
        }
        Update: {
          chain_id?: number
          contract_address?: string
          created_at?: string | null
          id?: number
          identity_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "art_contracts_chain_id_fkey"
            columns: ["chain_id"]
            isOneToOne: false
            referencedRelation: "chains"
            referencedColumns: ["chain_id"]
          },
          {
            foreignKeyName: "art_contracts_identity_id_chain_id_fkey"
            columns: ["identity_id", "chain_id"]
            isOneToOne: false
            referencedRelation: "identities"
            referencedColumns: ["id", "chain_id"]
          },
        ]
      }
      art_tokens: {
        Row: {
          bibliography: Json | null
          catalogue_inventory: string | null
          chain_id: number
          condition_reports: Json | null
          contract_address: string
          created_at: string | null
          description: string
          dimensions: string | null
          edition: string | null
          exhibition_history: Json | null
          image_url: string | null
          keywords: string | null
          location_collection: Json | null
          medium: string
          note: string | null
          royalties: number | null
          series: string | null
          title: string
          token_id: number
          token_uri: string | null
          updated_at: string | null
          year: number
        }
        Insert: {
          bibliography?: Json | null
          catalogue_inventory?: string | null
          chain_id: number
          condition_reports?: Json | null
          contract_address: string
          created_at?: string | null
          description: string
          dimensions?: string | null
          edition?: string | null
          exhibition_history?: Json | null
          image_url?: string | null
          keywords?: string | null
          location_collection?: Json | null
          medium: string
          note?: string | null
          royalties?: number | null
          series?: string | null
          title: string
          token_id: number
          token_uri?: string | null
          updated_at?: string | null
          year: number
        }
        Update: {
          bibliography?: Json | null
          catalogue_inventory?: string | null
          chain_id?: number
          condition_reports?: Json | null
          contract_address?: string
          created_at?: string | null
          description?: string
          dimensions?: string | null
          edition?: string | null
          exhibition_history?: Json | null
          image_url?: string | null
          keywords?: string | null
          location_collection?: Json | null
          medium?: string
          note?: string | null
          royalties?: number | null
          series?: string | null
          title?: string
          token_id?: number
          token_uri?: string | null
          updated_at?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "art_tokens_address_contract_chain_id_fkey"
            columns: ["contract_address", "chain_id"]
            isOneToOne: false
            referencedRelation: "art_contracts"
            referencedColumns: ["contract_address", "chain_id"]
          },
        ]
      }
      arweave_uploads: {
        Row: {
          created_at: string
          id: number
          url: string | null
          wallet_address: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          url?: string | null
          wallet_address?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          url?: string | null
          wallet_address?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "arweave_uploads_wallet_address_fkey"
            columns: ["wallet_address"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["wallet_address"]
          },
        ]
      }
      chains: {
        Row: {
          chain_id: number
          explorer_url: string | null
          icon_url: string | null
          is_active: boolean | null
          is_testnet: boolean | null
          name: string
          rpc_url: string | null
          symbol: string | null
        }
        Insert: {
          chain_id: number
          explorer_url?: string | null
          icon_url?: string | null
          is_active?: boolean | null
          is_testnet?: boolean | null
          name: string
          rpc_url?: string | null
          symbol?: string | null
        }
        Update: {
          chain_id?: number
          explorer_url?: string | null
          icon_url?: string | null
          is_active?: boolean | null
          is_testnet?: boolean | null
          name?: string
          rpc_url?: string | null
          symbol?: string | null
        }
        Relationships: []
      }
      contracts: {
        Row: {
          art_contract_address: string
          art_factory_contract_address: string
          chain_id: number
          deployed_at: string | null
          environment: string
          id: number
          identity_contract_address: string
          updated_at: string | null
        }
        Insert: {
          art_contract_address: string
          art_factory_contract_address: string
          chain_id: number
          deployed_at?: string | null
          environment: string
          id?: number
          identity_contract_address: string
          updated_at?: string | null
        }
        Update: {
          art_contract_address?: string
          art_factory_contract_address?: string
          chain_id?: number
          deployed_at?: string | null
          environment?: string
          id?: number
          identity_contract_address?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contracts_chain_id_fkey"
            columns: ["chain_id"]
            isOneToOne: false
            referencedRelation: "chains"
            referencedColumns: ["chain_id"]
          },
        ]
      }
      identities: {
        Row: {
          addresses: Json | null
          chain_id: number
          created_at: string | null
          description: string | null
          dob: number | null
          dod: number | null
          exhibition_history: Json | null
          id: number
          identity_image: string | null
          links: Json | null
          location: string | null
          name: string
          represented_artists: Json | null
          represented_by: Json | null
          tags: string[] | null
          type: string
          updated_at: string | null
          wallet_address: string
        }
        Insert: {
          addresses?: Json | null
          chain_id: number
          created_at?: string | null
          description?: string | null
          dob?: number | null
          dod?: number | null
          exhibition_history?: Json | null
          id: number
          identity_image?: string | null
          links?: Json | null
          location?: string | null
          name: string
          represented_artists?: Json | null
          represented_by?: Json | null
          tags?: string[] | null
          type: string
          updated_at?: string | null
          wallet_address: string
        }
        Update: {
          addresses?: Json | null
          chain_id?: number
          created_at?: string | null
          description?: string | null
          dob?: number | null
          dod?: number | null
          exhibition_history?: Json | null
          id?: number
          identity_image?: string | null
          links?: Json | null
          location?: string | null
          name?: string
          represented_artists?: Json | null
          represented_by?: Json | null
          tags?: string[] | null
          type?: string
          updated_at?: string | null
          wallet_address?: string
        }
        Relationships: [
          {
            foreignKeyName: "identities_chain_id_fkey"
            columns: ["chain_id"]
            isOneToOne: false
            referencedRelation: "chains"
            referencedColumns: ["chain_id"]
          },
          {
            foreignKeyName: "identities_wallet_address_fkey"
            columns: ["wallet_address"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["wallet_address"]
          },
        ]
      }
      pending_actions: {
        Row: {
          action_type: string
          chain_id: number
          created_at: string | null
          data: Json
          id: number
          status: string
          updated_at: string | null
          wallet_address: string
        }
        Insert: {
          action_type: string
          chain_id: number
          created_at?: string | null
          data: Json
          id?: number
          status?: string
          updated_at?: string | null
          wallet_address: string
        }
        Update: {
          action_type?: string
          chain_id?: number
          created_at?: string | null
          data?: Json
          id?: number
          status?: string
          updated_at?: string | null
          wallet_address?: string
        }
        Relationships: [
          {
            foreignKeyName: "pending_actions_chain_id_fkey"
            columns: ["chain_id"]
            isOneToOne: false
            referencedRelation: "chains"
            referencedColumns: ["chain_id"]
          },
          {
            foreignKeyName: "pending_actions_wallet_address_fkey"
            columns: ["wallet_address"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["wallet_address"]
          },
        ]
      }
      roles: {
        Row: {
          art_contract_id: number | null
          assigned_by: string
          chain_id: number | null
          context: string
          created_at: string | null
          id: number
          identity_id: number
          role: string
          specific_art_id: number | null
        }
        Insert: {
          art_contract_id?: number | null
          assigned_by: string
          chain_id?: number | null
          context: string
          created_at?: string | null
          id?: number
          identity_id: number
          role: string
          specific_art_id?: number | null
        }
        Update: {
          art_contract_id?: number | null
          assigned_by?: string
          chain_id?: number | null
          context?: string
          created_at?: string | null
          id?: number
          identity_id?: number
          role?: string
          specific_art_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "roles_art_contract_id_fkey"
            columns: ["art_contract_id"]
            isOneToOne: false
            referencedRelation: "art_contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roles_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["wallet_address"]
          },
          {
            foreignKeyName: "roles_identity_id_chain_id_fkey"
            columns: ["identity_id", "chain_id"]
            isOneToOne: false
            referencedRelation: "identities"
            referencedColumns: ["id", "chain_id"]
          },
        ]
      }
      user_wallet_registrations: {
        Row: {
          chain_id: number
          confirmed: boolean
          created_at: string | null
          crypto_amount: number
          id: number
          tx_hash: string | null
          updated_at: string | null
          valid_to: string
          wallet_address: string
        }
        Insert: {
          chain_id: number
          confirmed?: boolean
          created_at?: string | null
          crypto_amount: number
          id?: number
          tx_hash?: string | null
          updated_at?: string | null
          valid_to: string
          wallet_address: string
        }
        Update: {
          chain_id?: number
          confirmed?: boolean
          created_at?: string | null
          crypto_amount?: number
          id?: number
          tx_hash?: string | null
          updated_at?: string | null
          valid_to?: string
          wallet_address?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_wallet_registrations_wallet_address_fkey"
            columns: ["wallet_address"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["wallet_address"]
          },
        ]
      }
      wallets: {
        Row: {
          created_at: string | null
          fee_paid: boolean
          last_login: string | null
          setup_completed: boolean
          setup_step: number
          updated_at: string | null
          wallet_address: string
        }
        Insert: {
          created_at?: string | null
          fee_paid?: boolean
          last_login?: string | null
          setup_completed?: boolean
          setup_step?: number
          updated_at?: string | null
          wallet_address: string
        }
        Update: {
          created_at?: string | null
          fee_paid?: boolean
          last_login?: string | null
          setup_completed?: boolean
          setup_step?: number
          updated_at?: string | null
          wallet_address?: string
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
