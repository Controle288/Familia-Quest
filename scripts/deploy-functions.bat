@echo off
REM ============================================================
REM FamiliaQuest — Deploy das Edge Functions no Supabase
REM Execute no terminal a partir da raiz do projeto.
REM
REM Pre-requisitos:
REM   1) Instalar Supabase CLI:  npm install -g supabase
REM   2) Login:                  supabase login
REM   3) Vincular o projeto:     supabase link --project-ref SEU_PROJECT_REF
REM      (SEU_PROJECT_REF esta na URL do dashboard:
REM       https://supabase.com/dashboard/project/<ref>)
REM
REM IMPORTANTE: as chaves Stripe/Mercado Pago NAO vao aqui.
REM Elas sao configuradas no painel admin (tabela payment_settings).
REM ============================================================

set REF=SEU_PROJECT_REF

echo Linkando projeto...
supabase link --project-ref %REF%

echo Deploy da funcao create-checkout...
supabase functions deploy create-checkout

echo Deploy da funcao payment-webhook...
supabase functions deploy payment-webhook

echo Deploy da funcao delete-account...
supabase functions deploy delete-account

echo.
echo ============================================================
echo Deploy concluido.
echo.
echo Webhook URL (configure no Stripe e no Mercado Pago):
echo   https://%REF%.supabase.co/functions/v1/payment-webhook
echo.
echo No Stripe: Dashboard -> Developers -> Webhooks -> aponte pra essa URL
echo e copie o "Signing secret" (whsec_...) -> cole no painel admin
echo (campo webhook_secret da configuracao de pagamento).
echo ============================================================
