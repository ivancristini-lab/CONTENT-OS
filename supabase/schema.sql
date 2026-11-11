-- CONTENT OS: standalone Supabase schema. Not applied to any existing project.
-- All ownership is derived from auth.uid(), never editable user_metadata.
begin;

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  slug text not null,
  positioning text not null default '', voice text not null default '',
  audience text not null default '', goals text not null default '',
  status text not null default 'ACTIVE',
  created_at timestamptz not null default now(),
  unique (owner_user_id, slug)
);
create index profiles_owner_idx on public.profiles(owner_user_id);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  name text not null, description text not null default '', priority integer not null default 50,
  type text not null check (type in ('PRIMARY','SECONDARY')),
  status text not null default 'ACTIVE', unique(id,profile_id), unique(profile_id,name)
);
create unique index projects_one_primary on public.projects(profile_id) where type = 'PRIMARY';

create table public.pillars (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  name text not null, description text not null default '', priority integer not null default 50,
  status text not null default 'ACTIVE', unique(id,profile_id), unique(profile_id,name)
);

create table public.social_accounts (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  platform text not null check (platform in ('Instagram','TikTok','Facebook','LinkedIn','X','Threads','YouTube')),
  handle text not null, url text not null default '',
  status text not null default 'NOT_CONNECTED', unique(profile_id,platform)
);

create table public.sources (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  project_id uuid, pillar_id uuid,
  type text not null check (type in ('text','photo','video','audio','screenshot','document','url')),
  title text not null check (length(trim(title)) > 0), text_content text not null default '',
  file_url text, context text not null default '',
  captured_at timestamptz not null default now(),
  context_status text not null default 'CAPTURED' check (context_status in ('CAPTURED','NEEDS_CONTEXT','READY','ARCHIVED')),
  privacy text not null default 'PRIVATE' check (privacy in ('PRIVATE','REVIEW','PUBLIC')),
  is_relevant boolean not null default true, created_at timestamptz not null default now(),
  unique(id,profile_id),
  foreign key(project_id,profile_id) references public.projects(id,profile_id),
  foreign key(pillar_id,profile_id) references public.pillars(id,profile_id)
);

create table public.stories (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  project_id uuid, pillar_id uuid, source_id uuid,
  title text not null check(length(trim(title)) > 0), summary text not null default '',
  story_type text not null default 'scene' check(story_type in ('scene','decision','learning','failure','milestone','meeting','event','experiment','product_update','conversation','backstage')),
  importance text not null default 'MEDIUM' check(importance in ('LOW','MEDIUM','HIGH','CRITICAL')),
  event_date date not null default current_date, evidence text not null default '',
  status text not null default 'CAPTURED' check(status in ('CAPTURED','DEVELOPING','READY','USED','ARCHIVED')),
  created_at timestamptz not null default now(), unique(id,profile_id),
  foreign key(project_id,profile_id) references public.projects(id,profile_id),
  foreign key(pillar_id,profile_id) references public.pillars(id,profile_id),
  foreign key(source_id,profile_id) references public.sources(id,profile_id)
);

create table public.ideas (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  story_id uuid, pillar_id uuid, title text not null check(length(trim(title)) > 0),
  core_thesis text not null default '', angle text not null default '',
  potential text not null default 'MEDIUM' check(potential in ('LOW','MEDIUM','HIGH','CRITICAL')),
  status text not null default 'IDEA' check(status in ('IDEA','DEVELOPING','READY','USED','ARCHIVED')),
  created_at timestamptz not null default now(), unique(id,profile_id),
  foreign key(story_id,profile_id) references public.stories(id,profile_id),
  foreign key(pillar_id,profile_id) references public.pillars(id,profile_id)
);

create table public.mother_pieces (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  source_id uuid, idea_id uuid,
  title text not null, format text not null default 'text', summary text not null default '',
  status text not null default 'DRAFT', unique(id,profile_id),
  foreign key(source_id,profile_id) references public.sources(id,profile_id),
  foreign key(idea_id,profile_id) references public.ideas(id,profile_id)
);

create table public.content_items (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  idea_id uuid, mother_piece_id uuid,
  title text not null check(length(trim(title)) > 0), objective text not null default '',
  priority text not null default 'MEDIUM' check(priority in ('LOW','MEDIUM','HIGH','CRITICAL')),
  status text not null default 'DRAFT' check(status in ('DRAFT','READY','APPROVED','SCHEDULED','PUBLISHED','MEASURED','REUSABLE','ARCHIVED')),
  created_at timestamptz not null default now(), unique(id,profile_id),
  foreign key(idea_id,profile_id) references public.ideas(id,profile_id),
  foreign key(mother_piece_id,profile_id) references public.mother_pieces(id,profile_id)
);

create table public.content_variants (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  content_item_id uuid not null,
  platform text not null check(platform in ('Instagram','TikTok','Facebook','LinkedIn','X','Threads','YouTube')),
  format text not null default 'post', hook text not null default '', copy text not null default '',
  media_url text, cta text not null default '',
  status text not null default 'DRAFT' check(status in ('DRAFT','READY','APPROVED','SCHEDULED','PUBLISHED','MEASURED','REUSABLE','ARCHIVED')),
  scheduled_at timestamptz, published_at timestamptz, published_url text,
  unique(id,profile_id), unique(content_item_id,platform),
  foreign key(content_item_id,profile_id) references public.content_items(id,profile_id) on delete cascade,
  check(status <> 'SCHEDULED' or scheduled_at is not null),
  check(status not in ('APPROVED','SCHEDULED') or length(trim(copy)) > 0)
);

create table public.calendar_slots (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  content_variant_id uuid not null unique,
  platform text not null, scheduled_at timestamptz not null,
  status text not null default 'SCHEDULED' check(status in ('SCHEDULED','PUBLISHED','CANCELLED')),
  foreign key(content_variant_id,profile_id) references public.content_variants(id,profile_id) on delete cascade
);

create table public.learnings (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  platform text, pillar_id uuid,
  finding text not null, confidence numeric not null check(confidence between 0 and 1),
  evidence text not null default '', created_at timestamptz not null default now(),
  foreign key(pillar_id,profile_id) references public.pillars(id,profile_id)
);

-- Optional bridge for future device-to-cloud synchronization. No automatic upload.
create table public.workspace_snapshots (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles(id) on delete cascade,
  data jsonb not null, revision bigint not null default 1,
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
create policy own_profiles on public.profiles for all to authenticated
  using(owner_user_id = (select auth.uid()))
  with check(owner_user_id = (select auth.uid()));
grant select,insert,update,delete on public.profiles to authenticated;
revoke all on public.profiles from anon;

do $$
declare table_name text;
begin
  foreach table_name in array array['projects','pillars','social_accounts','sources','stories','ideas','mother_pieces','content_items','content_variants','calendar_slots','learnings','workspace_snapshots'] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('create policy owned_profile on public.%I for all to authenticated using (profile_id in (select id from public.profiles where owner_user_id = (select auth.uid()))) with check (profile_id in (select id from public.profiles where owner_user_id = (select auth.uid())))', table_name);
    execute format('grant select,insert,update,delete on public.%I to authenticated', table_name);
    execute format('revoke all on public.%I from anon', table_name);
    execute format('create index %I on public.%I(profile_id)', table_name || '_profile_idx', table_name);
  end loop;
end $$;
create index sources_captured_idx on public.sources(profile_id,captured_at desc);
create index stories_debt_idx on public.stories(profile_id,status,importance);
create index ideas_story_idx on public.ideas(story_id);
create index content_items_idea_idx on public.content_items(idea_id);
create index calendar_time_idx on public.calendar_slots(profile_id,scheduled_at);

create view public.story_debt with(security_invoker = true) as
  select s.* from public.stories s
  where s.status = 'READY' and not exists (
    select 1 from public.ideas i join public.content_items c on c.idea_id = i.id and c.profile_id = i.profile_id
    where i.story_id = s.id and i.profile_id = s.profile_id
  );
grant select on public.story_debt to authenticated;
revoke all on public.story_debt from anon;

-- Editing approved text invalidates approval and its schedule atomically.
create function public.invalidate_variant_approval() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if (new.copy,new.hook,new.cta,new.media_url,new.platform,new.format)
    is distinct from (old.copy,old.hook,old.cta,old.media_url,old.platform,old.format) then
    new.status := 'DRAFT'; new.scheduled_at := null;
    delete from public.calendar_slots where content_variant_id = old.id;
  end if;
  if old.status = 'SCHEDULED' and new.status in ('DRAFT','READY','ARCHIVED') then
    new.scheduled_at := null;
    delete from public.calendar_slots where content_variant_id = old.id;
  end if;
  return new;
end $$;
create trigger variant_edit_reapproval before update on public.content_variants
  for each row execute function public.invalidate_variant_approval();

create function public.schedule_content_variant(variant_id uuid, schedule_time timestamptz) returns uuid
language plpgsql security invoker set search_path = '' as $$
declare variant public.content_variants; slot_id uuid;
begin
  if schedule_time <= now() then raise exception 'La fecha debe ser futura'; end if;
  select * into variant from public.content_variants where id = variant_id for update;
  if not found then raise exception 'Variante no disponible'; end if;
  if variant.status not in ('APPROVED','SCHEDULED') then raise exception 'Aprobá la variante antes de programarla'; end if;
  update public.content_variants set status = 'SCHEDULED', scheduled_at = schedule_time where id = variant_id;
  insert into public.calendar_slots(profile_id,content_variant_id,platform,scheduled_at,status)
    values(variant.profile_id,variant.id,variant.platform,schedule_time,'SCHEDULED')
    on conflict(content_variant_id) do update set scheduled_at = excluded.scheduled_at,status = 'SCHEDULED'
    returning id into slot_id;
  return slot_id;
end $$;
revoke all on function public.invalidate_variant_approval() from public;
revoke all on function public.schedule_content_variant(uuid,timestamptz) from public;
grant execute on function public.schedule_content_variant(uuid,timestamptz) to authenticated;

create function public.validate_calendar_slot() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if new.status = 'SCHEDULED' and not exists (
    select 1 from public.content_variants v where v.id = new.content_variant_id
      and v.profile_id = new.profile_id and v.platform = new.platform
      and v.status = 'SCHEDULED' and v.scheduled_at = new.scheduled_at
  ) then
    raise exception 'El slot debe corresponder a una variante aprobada y programada';
  end if;
  return new;
end $$;
create trigger calendar_slot_consistency before insert or update on public.calendar_slots
  for each row execute function public.validate_calendar_slot();
revoke all on function public.validate_calendar_slot() from public;

insert into storage.buckets(id,name,public,file_size_limit)
  values('content-os','content-os',false,52428800) on conflict(id) do nothing;
create policy content_os_read on storage.objects for select to authenticated
  using(bucket_id = 'content-os' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy content_os_insert on storage.objects for insert to authenticated
  with check(bucket_id = 'content-os' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy content_os_update on storage.objects for update to authenticated
  using(bucket_id = 'content-os' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check(bucket_id = 'content-os' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy content_os_delete on storage.objects for delete to authenticated
  using(bucket_id = 'content-os' and (storage.foldername(name))[1] = (select auth.uid())::text);

commit;
