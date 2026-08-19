Guia de Deploy - FamiliaQuest
===========================

Passos para deploy (Vercel / Netlify)

1. Pré-requisitos
   - Ter conta no Vercel ou Netlify
   - Variáveis de ambiente configuradas: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

2. Vercel
   - No painel do Vercel, crie um novo projeto a partir do repositório GitHub `Controle288/Familia-Quest`.
   - Ajuste as variáveis de ambiente citadas acima em Settings > Environment Variables.
   - Build Command: `npm run build`
   - Output Directory: `dist`

3. Netlify
   - No Netlify, registre um novo site a partir do repositório GitHub.
   - Defina as env vars em Site settings > Build & deploy > Environment.
   - Build command: `npm run build`
   - Publish directory: `dist`

4. Notas
   - O projeto usa Vite; o comando `npm run preview` serve a build localmente.
   - Para produção, verifique as políticas de e-mail do Supabase e as chaves de produção.
