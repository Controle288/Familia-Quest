// Edge Function: payment-webhook
// Verifies the provider webhook and upgrades/downgrades the family plan.
// The family id travels in the checkout metadata (Stripe: session/subscription
// metadata; Mercado Pago: external_reference / metadata).
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const adminClient = () =>
  createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false },
  });

// Aplica o plano (upgrade ou downgrade) na family_settings.
const applyPlan = async (
  familyId: string,
  patch: {
    plan: 'free' | 'premium';
    plan_provider?: string | null;
    plan_interval?: string | null;
    subscription_id?: string | null;
    plan_expires_at?: string | null;
  }
) => {
  await adminClient()
    .from('family_settings')
    .update({
      plan: patch.plan,
      plan_provider: patch.plan_provider ?? null,
      plan_interval: patch.plan_interval ?? null,
      subscription_id: patch.subscription_id ?? null,
      plan_expires_at: patch.plan_expires_at ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('family_id', familyId);
};

const upgrade = (familyId: string, extra: Partial<Parameters<typeof applyPlan>[1]> = {}) =>
  applyPlan(familyId, { plan: 'premium', ...extra });

const downgrade = (familyId: string) => applyPlan(familyId, { plan: 'free' });

// Busca uma assinatura Stripe para obter family_id (metadata) e período.
const getStripeSubscription = async (subId: string, secret: string) => {
  const res = await fetch(`https://api.stripe.com/v1/subscriptions/${subId}`, {
    headers: { Authorization: `Bearer ${secret}` },
  });
  if (!res.ok) return null;
  return await res.json();
};

const isoFromUnix = (secs?: number) => (secs ? new Date(secs * 1000).toISOString() : null);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const client = adminClient();
    const { data: settings } = await client.from('payment_settings').select('*').maybeSingle();

    const provider = settings?.provider ?? 'stripe';
    const rawBody = await req.text();

    if (provider === 'stripe') {
      const sig = req.headers.get('stripe-signature') ?? '';
      const secret = settings?.webhook_secret ?? '';
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
      const obj = event.data?.object ?? {};

      if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
        const familyId = obj.metadata?.family_id ?? obj.client_reference_id;
        const subId = obj.subscription;
        if (familyId) {
          let extra: Record<string, unknown> = { plan_provider: 'stripe' };
          if (subId) {
            const sub = await getStripeSubscription(subId, secret);
            if (sub) {
              extra = {
                plan_provider: 'stripe',
                subscription_id: sub.id,
                plan_interval: sub.items?.data?.[0]?.plan?.interval ?? null,
                plan_expires_at: isoFromUnix(sub.current_period_end),
              };
            }
          }
          await upgrade(familyId, extra);
        }
      } else if (event.type === 'invoice.paid') {
        // Renovação recorrente.
        const subId = obj.subscription;
        if (subId) {
          const sub = await getStripeSubscription(subId, secret);
          const familyId = sub?.metadata?.family_id;
          if (familyId) {
            await upgrade(familyId, {
              plan_provider: 'stripe',
              subscription_id: sub.id,
              plan_interval: sub.items?.data?.[0]?.plan?.interval ?? null,
              plan_expires_at: isoFromUnix(sub.current_period_end),
            });
          }
        }
      } else if (event.type === 'customer.subscription.deleted') {
        const familyId = obj.metadata?.family_id;
        if (familyId) await downgrade(familyId);
      } else if (event.type === 'customer.subscription.updated') {
        const familyId = obj.metadata?.family_id;
        if (familyId) {
          const active = obj.status === 'active' || obj.status === 'trialing';
          if (active) {
            await upgrade(familyId, {
              plan_provider: 'stripe',
              subscription_id: obj.id,
              plan_interval: obj.items?.data?.[0]?.plan?.interval ?? null,
              plan_expires_at: isoFromUnix(obj.current_period_end),
            });
          } else {
            await downgrade(familyId);
          }
        }
      }

      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Mercado Pago
    const data = JSON.parse(rawBody);
    const familyId =
      data?.data?.metadata?.family_id ?? data?.metadata?.family_id ?? data?.data?.external_reference;

    if (data?.type === 'preapproval' || data?.topic === 'preapproval') {
      // Busca a assinatura para obter external_reference (family_id) e status.
      const preId = data?.data?.id ?? data?.id;
      const res = await fetch(`https://api.mercadopago.com/preapproval/${preId}`, {
        headers: { Authorization: `Bearer ${settings?.secret_key ?? ''}` },
      });
      const pre = res.ok ? await res.json() : null;
      const fid = pre?.external_reference ?? familyId;
      const status = pre?.status;
      if (fid) {
        if (status === 'authorized' || status === 'enabled') {
          await upgrade(fid, { plan_provider: 'mercadopago', subscription_id: preId });
        } else if (status === 'cancelled' || status === 'disabled' || status === 'paused') {
          await downgrade(fid);
        }
      }
    } else if (data?.type === 'payment') {
      const payment = data.data;
      const fid = payment?.external_reference ?? payment?.metadata?.family_id ?? familyId;
      if (data?.action === 'payment.updated' || data?.action === 'payment.created') {
        if (payment?.status === 'approved' && fid) {
          await upgrade(fid, { plan_provider: 'mercadopago' });
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: corsHeaders });
  }
});
