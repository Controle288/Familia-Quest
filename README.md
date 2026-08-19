<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# FamilyQuest

Gamificação de tarefas familiares — frontend React + Vite em TypeScript.

## Rodar localmente

Pré-requisitos: `Node.js` (recomendado >= 18) e `npm`.

1. Copie `.env.example` para `.env` e preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` se for usar Supabase.
2. Instale dependências:

```bash
npm install
```

3. Para desenvolvimento:

```bash
npm run dev
```

4. Para testar a build de produção localmente:

```bash
npm run build
node server.cjs
# abra http://localhost:4173
```

5. E2E (Playwright): instale navegadores e rode o script

```bash
npx playwright install --with-deps
E2E_URL=http://localhost:4173 BROWSER=chromium npm run test:e2e
```

## Deploy

Veja `DEPLOY.md` para instruções de deploy no Vercel/Netlify.

