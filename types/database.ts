export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string | null;
        };
        Insert: {
          id: string;
          email?: string | null;
        };
        Update: {
          id?: string;
          email?: string | null;
        };
      };
      companies: {
        Row: {
          id: string;
          owner_id: string;
          type: 'MANUFACTURER' | 'IMPORTER' | 'EU_REP';
          legal_name: string;
          address_json: Json;
          vat: string | null;
          eori: string | null;
          signatories_json: Json;
          logo_text: string | null;
        };
        Insert: Omit<Database['public']['Tables']['companies']['Row'], 'id'> & { id?: string };
        Update: Partial<Database['public']['Tables']['companies']['Row']>;
      };
      products: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          model: string;
          sku: string | null;
          description: string | null;
          photo_url: string | null;
          markets: string[] | null;
          status: 'DRAFT' | 'REVIEW' | 'FINAL';
          version: string;
        };
        Insert: Omit<Database['public']['Tables']['products']['Row'], 'id' | 'version'> & { id?: string; version?: string };
        Update: Partial<Database['public']['Tables']['products']['Row']>;
      };
      assessments: {
        Row: {
          id: string;
          product_id: string;
          answers_json: Json;
          applicable_acts: string[];
          suggested_standards: string[];
          route: string;
          notified_body_json: Json | null;
          warnings_json: Json | null;
          rules_version: string;
        };
        Insert: Partial<Database['public']['Tables']['assessments']['Row']> & { id?: string };
        Update: Partial<Database['public']['Tables']['assessments']['Row']>;
      };
      documents: {
        Row: {
          id: string;
          product_id: string;
          type: 'DOC' | 'CHECKLIST' | 'LABEL';
          lang: string;
          version: string;
          file_url: string | null;
          hash: string | null;
          created_by: string;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['documents']['Row']> & { id?: string };
        Update: Partial<Database['public']['Tables']['documents']['Row']>;
      };
      catalog_acts: {
        Row: {
          id: string;
          code: string;
          title: string;
          type: 'DIRECTIVE' | 'REGULATION';
          eli_url: string;
          summary_de: string;
          summary_en: string;
          summary_zh: string;
        };
        Insert: Partial<Database['public']['Tables']['catalog_acts']['Row']> & { id?: string };
        Update: Partial<Database['public']['Tables']['catalog_acts']['Row']>;
      };
      catalog_standards: {
        Row: {
          code: string;
          title: string;
          family: string | null;
          relates_to_acts: string[];
        };
        Insert: Database['public']['Tables']['catalog_standards']['Row'];
        Update: Partial<Database['public']['Tables']['catalog_standards']['Row']>;
      };
      audit_logs: {
        Row: {
          id: string;
          actor_id: string;
          action: string;
          meta_json: Json;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['audit_logs']['Row']> & { id?: string };
        Update: Partial<Database['public']['Tables']['audit_logs']['Row']>;
      };
    };
  };
}
