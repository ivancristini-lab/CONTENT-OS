-- Install once as administrator after schema.sql. Invoke bootstrap_content_os()
-- through an authenticated user's JWT. It creates no auth accounts or fake stories.
create function public.bootstrap_content_os() returns uuid
language plpgsql security invoker set search_path = '' as $$
declare v_profile_id uuid; v_user_id uuid := auth.uid();
begin
  if v_user_id is null then raise exception 'Se requiere una sesión autenticada'; end if;
  insert into public.profiles(owner_user_id,name,slug,positioning,voice,audience,goals)
    values(v_user_id,'Iván Cristini','ivan-cristini',
      'Fundador que construye SØD diariamente y trabaja con IA aplicada, sistemas, proyectos y conexiones estratégicas.',
      'Directo, humano, concreto. Evidencia antes que opinión.',
      'Fundadores, profesionales y equipos que construyen con IA.',
      'Documentar la construcción diaria de SØD con continuidad.')
    on conflict(owner_user_id,slug) do nothing;
  select id into v_profile_id from public.profiles where owner_user_id = v_user_id and slug = 'ivan-cristini';

  insert into public.projects(profile_id,name,description,priority,type) values
    (v_profile_id,'SØD Ecosystem Global','Proyecto principal y construcción diaria de Iván.',100,'PRIMARY'),
    (v_profile_id,'Órbita','Proyecto independiente. No pertenece a SØD.',50,'SECONDARY'),
    (v_profile_id,'Kadmontech','Proyecto secundario con narrativa propia.',40,'SECONDARY')
    on conflict(profile_id,name) do nothing;

  insert into public.pillars(profile_id,name,priority) values
    (v_profile_id,'Construcción diaria de SØD',100),
    (v_profile_id,'IA aplicada',90),
    (v_profile_id,'Founder journey',80),
    (v_profile_id,'Personas, eventos y conexiones',70),
    (v_profile_id,'Proyectos y experimentos',60),
    (v_profile_id,'Ideas y criterio',50)
    on conflict(profile_id,name) do nothing;

  insert into public.social_accounts(profile_id,platform,handle,url,status) values
    (v_profile_id,'Instagram','@ivancristini14','https://www.instagram.com/ivancristini14/','NOT_CONNECTED'),
    (v_profile_id,'TikTok','@ivan.cristini','https://www.tiktok.com/@ivan.cristini','NOT_CONNECTED'),
    (v_profile_id,'Facebook','Iván Cristini','https://www.facebook.com/profile.php?id=61566999627436','NOT_CONNECTED'),
    (v_profile_id,'LinkedIn','ivancristini','https://www.linkedin.com/in/ivancristini/','NOT_CONNECTED'),
    (v_profile_id,'X','@IvanCristini','https://x.com/IvanCristini','NOT_CONNECTED'),
    (v_profile_id,'Threads','@ivancristini14','https://www.threads.com/@ivancristini14','NOT_CONNECTED'),
    (v_profile_id,'YouTube','@ivancristini3949','https://www.youtube.com/@ivancristini3949','NOT_CONNECTED')
    on conflict(profile_id,platform) do nothing;
  return v_profile_id;
end $$;
revoke all on function public.bootstrap_content_os() from public;
grant execute on function public.bootstrap_content_os() to authenticated;

