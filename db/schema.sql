create extension if not exists "uuid-ossp";

create table if not exists public.users (
  id uuid primary key default uuid_generate_v4(),
  email text unique
);

create type public.company_type as enum ('MANUFACTURER','IMPORTER','EU_REP');
create type public.product_status as enum ('DRAFT','REVIEW','FINAL');
create type public.document_type as enum ('DOC','CHECKLIST','LABEL');

create table if not exists public.companies (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid references public.users(id),
  type public.company_type not null,
  legal_name text not null,
  address_json jsonb not null default '{}',
  vat text,
  eori text,
  signatories_json jsonb not null default '[]',
  logo_text varchar
);

create table if not exists public.products (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid references public.users(id),
  name text not null,
  model text not null,
  sku text,
  description text,
  photo_url text,
  markets text[],
  status public.product_status not null default 'DRAFT',
  version text not null default 'v1.0'
);

create table if not exists public.assessments (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid references public.products(id) on delete cascade,
  answers_json jsonb not null,
  applicable_acts text[] not null,
  suggested_standards text[] not null,
  route text,
  notified_body_json jsonb,
  warnings_json jsonb,
  rules_version text not null
);

create table if not exists public.documents (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid references public.products(id) on delete cascade,
  type public.document_type not null,
  lang text not null,
  version text not null,
  file_url text,
  hash text,
  created_by uuid references public.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.catalog_acts (
  id uuid primary key default uuid_generate_v4(),
  code text not null,
  title text not null,
  type text not null,
  eli_url text not null,
  summary_de text not null,
  summary_en text not null,
  summary_zh text not null
);

create table if not exists public.catalog_standards (
  code text primary key,
  title text not null,
  family text,
  relates_to_acts text[] not null
);

create table if not exists public.audit_logs (
  id uuid primary key default uuid_generate_v4(),
  actor_id uuid references public.users(id),
  action text not null,
  meta_json jsonb not null,
  created_at timestamptz not null default now()
);
