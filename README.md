## EUCertify Wizard v2 (October 2025 Update)
✅ Implemented new question flow with 5-step user-friendly design  
✅ Added icons, tooltips, and grouped logic  
✅ Fixed navigation & validation bugs  
✅ Added unit tests for flow consistency  
✅ Ready for integration with rulesEngine  

### To-Do Next
- [ ] Add multi-language (EN/DE/FR) question text support
- [ ] Connect to compliance output generator page
- [ ] Implement “Save progress” feature
- [ ] Style Step headers with category icons

### Fixes (Oct 2025)
✅ TypeScript LegislationType mismatch resolved  
✅ All rule objects use literal assertions (`as const`)  
✅ CI typecheck now passes  

## Answer Examples
All questionnaire options now include short **examples** to guide non-experts (shown via an inline “Examples” toggle).
- Improves accuracy of product classification
- Reduces backtracking and support questions

### Authoring rules
- Add examples with `examples: [...]` and optional `exampleTitle`.
- Keep examples short (≤ 8 words) and concrete (“Bluetooth speaker”, not “portable audio apparatus”).

## Results Page v2
- Summarizes product type/role/markets and detected features.
- Groups required documents with explanations and indicates whether they’re exportable in-app, require upload, or must be obtained externally (lab/Notified Body/authority).
- Country obligations are grouped per selected market (DE/FR/ES/IT included).
- Confidence %, “why it applies”, and “what to do” shown per rule.
- One-click PDF export of the report.

### Authoring Notes
- Add new documents in `src/data/documentCatalog.ts`.
- Add/extend country obligations in `src/data/countryObligations.ts`.
- Explainers live in `eucertify.v1.json` → `explainers` block.

## Document Generation
EUCertify can now generate and export:
- EU Declaration of Conformity (PDF/DOCX)
- Risk Assessment register (PDF/DOCX)
- Technical File checklist (PDF)
- Labels & Markings checklist (PDF)
- EPR Registration Info sheets (PDF)
- User Manual starter (PDF/DOCX)

**Statuses**
- 🟢 Exportable in EUCertify (Generate)
- 🟡 Upload your evidence (we supply a checklist/template)
- 🔴 External – obtain from lab/Notified Body/authority

**How it works**
- Documents auto-fill from your wizard answers and the Results report.
- You can edit fields before exporting.
- Drafts are stored locally and can be re-exported.

## One-Click Compliance Pack
After completing the wizard, EUCertify can automatically generate editable, prefilled compliance documents:

| Document | Auto-filled fields |
|-----------|-------------------|
| DoC | Manufacturer, product, model, applicable directives, EN standards |
| Risk Register | Product, placeholder hazard table |
| Tech File Checklist | Default evidence list |
| Labels Checklist | CE/WEEE/Battery/Triman based on results |
| EPR Info Sheet | Country registrations |
| Manual Starter | Product name/model & recycling note |

Button: **“Generate My Compliance Pack”** on the results page creates these drafts instantly.

## Selectable Legislation & EN Standards
- EUCertify now stores a library of **Applicable EU Legislation** and **EN Standards** with short explanations and groups.
- In the **DoC editor**, click **“Choose legislation & standards”** to pick which items to include.
- Selections are saved per document and used in PDF/DOCX export.
- Defaults are suggested from your results (you can override them).

## Adaptive Questionnaire
- Questions adapt to previous answers.
- Each answer emits tags (e.g., EEE, Battery, Radio, Toy, Machinery, FoodContact).
- Tags feed the rule/standards resolver so EUCertify can auto-pick applicable legislation, EN standards, and documents. No external services required.

## Database schema (Supabase)

Run the following SQL in your Supabase project to provision the required tables:

```sql
create extension if not exists "pgcrypto";

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create or replace function public.touch_updated() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
drop trigger if exists trg_projects_u on projects;
create trigger trg_projects_u before update on projects
for each row execute procedure public.touch_updated();

alter table projects enable row level security;
drop policy if exists "projects_owner" on projects;
create policy "projects_owner" on projects for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.project_answers (
  project_id uuid primary key references projects(id) on delete cascade,
  answers jsonb not null default '{}'::jsonb,
  tags text[] not null default '{}',
  is_complete boolean not null default false,
  updated_at timestamptz not null default now()
);
drop trigger if exists trg_pans_u on project_answers;
create trigger trg_pans_u before update on project_answers
for each row execute procedure public.touch_updated();

alter table project_answers enable row level security;
drop policy if exists "pans_owner" on project_answers;
create policy "pans_owner" on project_answers for all to authenticated
  using (exists (select 1 from projects p where p.id=project_id and p.user_id=auth.uid()))
  with check (exists (select 1 from projects p where p.id=project_id and p.user_id=auth.uid()));

create table if not exists public.project_settings (
  project_id uuid primary key references projects(id) on delete cascade,
  legislation_ids text[] not null default '{}',
  standard_codes text[] not null default '{}',
  updated_at timestamptz not null default now()
);
drop trigger if exists trg_pset_u on project_settings;
create trigger trg_pset_u before update on project_settings
for each row execute procedure public.touch_updated();

alter table project_settings enable row level security;
drop policy if exists "pset_owner" on project_settings;
create policy "pset_owner" on project_settings for all to authenticated
  using (exists (select 1 from projects p where p.id=project_id and p.user_id=auth.uid()))
  with check (exists (select 1 from projects p where p.id=project_id and p.user_id=auth.uid()));

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  kind text not null,
  title text not null,
  status text not null default 'draft',
  payload jsonb not null default '{}'::jsonb,
  file_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
drop trigger if exists trg_docs_u on documents;
create trigger trg_docs_u before update on documents
for each row execute procedure public.touch_updated();

alter table documents enable row level security;
drop policy if exists "docs_owner" on documents;
create policy "docs_owner" on documents for all to authenticated
  using (exists (select 1 from projects p where p.id=project_id and p.user_id=auth.uid()))
  with check (exists (select 1 from projects p where p.id=project_id and p.user_id=auth.uid()));

create index if not exists idx_docs_project on documents(project_id, created_at desc);
```
