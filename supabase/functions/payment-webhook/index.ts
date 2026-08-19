// Edge Function: payment-webhook
// Verifies the provider webhook and upgrades the family to premium. The family
// id travels in the checkout metadata (family_id).
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const upgradeFamily = async (familyId: string) => {
  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } }
  );
  await admin.from('family_settings').update({ plan: 'premium' }).eq('family_id', familyId);
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const { data: settings } = await createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false } }
    )
      .from('payment_settings')
      .select('*')
      .maybeSingle();

    const provider = settings?.provider ?? 'stripe';
    const rawBody = await req.text();

    if (provider === 'stripe') {
      const sig = req.headers.get('stripe-signature') ?? '';
      const secret = settings?.webhook_secret ?? '';
      // Lightweight signature verification (HMAC-SHA256).
      const parts = sig.split(',');
      const tsPart = parts.find((p) => p.startsWith('t='));
      const sigPart = parts.find((p) => p.startsWith('v1='));
      if (!tsPart || !sigPart || !secret) {
        return new Response(JSON.stringify({ error: 'bad signature' }), { status: 400, headers: corsHeaders });
      }
      const timestamp = tsPart.slice(2);
      const payload = `${timestamp}.${rawBody}`;
      const key = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );
      const sigBuf = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
      const expected = [...new Uint8Array(sigBuf)].map((b) => b.toString(16).padStart(2, '0')).join('');
      if (expected !== sigPart.slice(3)) {
        return new Response(JSON.stringify({ error: 'invalid signature' }), { status: 400, headers: corsHeaders });
      }
      const event = JSON.parse(rawBody);
      if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
        const familyId = event.data.object.metadata?.family_id ?? event.data.object.client_reference_id;
        if (familyId) await upgradeFamily(familyId);
      }
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Mercado Pago
    const data = JSON.parse(rawBody);
    const familyId = data?.data?.metadata?.family_id ?? data?.metadata?.family_id;
    if (data?.type === 'payment' && (data?.action === 'payment.updated' || data?.action === 'payment.created')) {
      const payment = data.data;
      if (payment?.status === 'approved' && familyId) await upgradeFamily(familyId);
    }
    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: corsHeaders });
  }
});
