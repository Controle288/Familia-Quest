// Edge Function: delete-account
// Hard-deletes the authenticated user and all of their data so the e-mail can
// be reused. Relies on the database ON DELETE CASCADE rules (profiles ->
// families -> tasks/rewards/redemptions/activity_logs/settings/tickets) and
// additionally cleans up rows that reference profiles without a FK cascade.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const token = (req.headers.get('Authorization') ?? '').replace('Bearer ', '');
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false } }
    );

    // Autentica o chamador e obtém o id do usuário a ser removido.
    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: corsHeaders });
    }
    const userId = userData.user.id;

    // Busca TODOS os perfis do usuário (pode pertencer a mais de uma família).
    const { data: profilesData } = await admin
      .from('profiles')
      .select('id, family_id')
      .eq('user_id', userId);
    const profiles = (profilesData ?? []) as { id: string; family_id?: string | null }[];

    const profileIds: string[] = profiles.map((p) => p.id);
    const familyIds: string[] = [
      ...new Set(profiles.map((p) => p.family_id).filter((fid): fid is string => Boolean(fid))),
    ];

    // Remove os perfis do usuário. As tabelas com FK em cascata (support_tickets,
    // profile_locations) são limpas automaticamente pelo Postgres.
    if (profileIds.length) {
      await admin.from('profiles').delete().in('id', profileIds);
    }

    // Para cada família que ficar vazia, apaga a família — o que em cascata
    // remove tasks, rewards, redemptions, activity_logs, family_settings etc.
    for (const familyId of familyIds) {
      const { count } = await admin
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('family_id', familyId);
      if (!count) {
        await admin.from('families').delete().eq('id', familyId);
      }
    }

    // Limpeza de registros órfãos em famílias que permanecem (essas tabelas
    // referenciam profile_id mas NÃO possuem FK em cascata para profiles).
    if (profileIds.length) {
      await admin.from('redemptions').delete().in('profile_id', profileIds);
      await admin.from('activity_logs').delete().in('profile_id', profileIds);
    }

    // Hard delete do usuário em auth.users (softDelete=false) — libera o e-mail
    // para ser reutilizado em novos cadastros.
    const { error: delErr } = await admin.auth.admin.deleteUser(userId, false);
    if (delErr) {
      return new Response(JSON.stringify({ error: delErr.message }), { status: 400, headers: corsHeaders });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: corsHeaders });
  }
});
