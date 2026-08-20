// Edge Function: create-checkout
// Reads the admin-configured payment gateway (Stripe or Mercado Pago) and
// returns a hosted checkout URL for the selected plan. Family id is passed
// through the provider metadata so the webhook can upgrade the family.
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
    const { plan_id } = await req.json();

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false } }
    );

    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: corsHeaders });
    }

    const { data: profile } = await admin
      .from('profiles')
      .select('family_id')
      .eq('user_id', userData.user.id)
      .single();
    const familyId = profile?.family_id;
    if (!familyId) {
      return new Response(JSON.stringify({ error: 'family not found' }), { status: 400, headers: corsHeaders });
    }

    const { data: plan } = await admin.from('plans').select('*').eq('id', plan_id).single();
    if (!plan) {
      return new Response(JSON.stringify({ error: 'plan not found' }), { status: 400, headers: corsHeaders });
    }

    const { data: settings } = await admin.from('payment_settings').select('*').maybeSingle();
    if (!settings || !settings.secret_key) {
      return new Response(JSON.stringify({ error: 'gateway not configured' }), { status: 400, headers: corsHeaders });
    }

    const origin = new URL(req.url).origin;

    if (settings.provider === 'stripe') {
      const body = new URLSearchParams();
      body.set('mode', plan.interval === 'once' ? 'payment' : 'subscription');
      body.set('success_url', `${origin}/?upgrade=success`);
      body.set('cancel_url', `${origin}/?upgrade=cancel`);
      body.set('client_reference_id', familyId);
      body.set('metadata[family_id]', familyId);
      body.set('line_items[0][quantity]', '1');
      body.set('line_items[0][price_data][currency]', 'brl');
      body.set('line_items[0][price_data][product_data][name]', plan.name);
      body.set('line_items[0][price_data][unit_amount]', String(Math.round(Number(plan.price) * 100)));
      if (plan.interval !== 'once') {
        body.set('subscription_data[interval]', plan.interval === 'year' ? 'year' : 'month');
        body.set('subscription_data[metadata][family_id]', familyId);
      }

      const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${settings.secret_key}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body,
      });
      const data = await res.json();
      if (!res.ok) {
        return new Response(JSON.stringify({ error: data.error?.message ?? 'stripe error' }), { status: 400, headers: corsHeaders });
      }
      return new Response(JSON.stringify({ url: data.url }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Mercado Pago
    // Planos recorrentes (month/year) usam a API de Assinaturas (Preapproval),
    // para que o admin receba as renovações automaticamente. 'once' é avulso.
    if (plan.interval !== 'once') {
      const frequency = plan.interval === 'year' ? 12 : 1;
      const res = await fetch('https://api.mercadopago.com/preapproval', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${settings.secret_key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: plan.name,
          external_reference: familyId,
          currency_id: 'BRL',
          transaction_amount: Number(plan.price),
          frequency,
          frequency_type: 'months',
          back_url: `${origin}/?upgrade=success`,
          auto_recurring: {
            frequency,
            frequency_type: 'months',
            transaction_amount: Number(plan.price),
            currency_id: 'BRL',
            repetitions: undefined,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        return new Response(JSON.stringify({ error: data.message ?? 'mercadopago error' }), { status: 400, headers: corsHeaders });
      }
      return new Response(JSON.stringify({ url: data.init_point }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const res = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${settings.secret_key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: [
          {
            title: plan.name,
            quantity: 1,
            currency_id: 'BRL',
            unit_price: Number(plan.price),
          },
        ],
        back_urls: {
          success: `${origin}/?upgrade=success`,
          failure: `${origin}/?upgrade=cancel`,
        },
        auto_return: 'approved',
        external_reference: familyId,
        metadata: { family_id: familyId },
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      return new Response(JSON.stringify({ error: data.message ?? 'mercadopago error' }), { status: 400, headers: corsHeaders });
    }
    return new Response(JSON.stringify({ url: data.init_point }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: corsHeaders });
  }
});
