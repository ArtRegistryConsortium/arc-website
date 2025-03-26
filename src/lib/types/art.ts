import type { Json } from '@supabase/supabase-js';

export interface ArtToken {
  artist_statement: string | null;
  bibliography: Json | null;
  catalogue_inventory: string | null;
  certification_method: string | null;
  chain_id: number;
  condition_reports: Json | null;
  contract_address: string;
  created_at: string | null;
  description: string;
  dimensions: string | null;
  edition: string | null;
  exhibition_history: Json | null;
  image_url: string | null;
  keywords: string[] | null;
  location_collection: Json | null;
  manual_sales_info: Json | null;
  medium: string;
  note: string | null;
  royalties: number | null;
  series: string | null;
  status: string | null;
  title: string;
  token_id: number;
  updated_at: string | null;
  year: number;
}

export interface ArtContract {
  contract_address: string;
  identity_id: number;
  chain_id: number;
  created_at: string | null;
  identities?: {
    id: number;
    name: string | null;
    description: string | null;
    identity_image: string | null;
    type: number | null;
  };
  symbol?: string;
}
