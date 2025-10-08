alter table public.companies enable row level security;
alter table public.products enable row level security;
alter table public.assessments enable row level security;
alter table public.documents enable row level security;
alter table public.audit_logs enable row level security;

create policy "Companies are owner visible" on public.companies using (owner_id = auth.uid());
create policy "Products are owner visible" on public.products using (owner_id = auth.uid());
create policy "Assessments follow product" on public.assessments using (
  exists(select 1 from public.products p where p.id = product_id and p.owner_id = auth.uid())
);
create policy "Documents follow product" on public.documents using (
  exists(select 1 from public.products p where p.id = product_id and p.owner_id = auth.uid())
);
create policy "Audit logs owner view" on public.audit_logs using (actor_id = auth.uid());
