# pulso — rede social estilo Instagram

MVP de rede social: cadastro/login, feed, criar post com imagem, seguir usuários, curtir e comentar.

Stack: **Next.js (App Router)** + **Supabase** (Auth, Postgres, Storage).

## Como rodar

### 1. Criar o projeto no Supabase

1. Crie um projeto em https://supabase.com
2. Vá em **SQL Editor** e rode o conteúdo de `supabase/schema.sql` — isso cria as tabelas, as políticas de RLS e o bucket de imagens
3. Vá em **Project Settings → API** e copie a **Project URL** e a **anon public key**

### 2. Configurar variáveis de ambiente

```bash
cp .env.local.example .env.local
```

Preencha `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` com os valores do passo anterior.

### 3. Instalar e rodar

```bash
npm install
npm run dev
```

Acesse http://localhost:3000

### 4. Confirmação de e-mail

Por padrão o Supabase exige confirmação de e-mail no cadastro. Para testar rápido em dev, você pode desativar em
**Authentication → Providers → Email → Confirm email** (desligar), ou usar e-mails reais e clicar no link de confirmação.

## Estrutura

```
src/
  app/
    login/                página de login
    signup/                página de cadastro
    feed/                  feed principal
    post/new/              criar publicação (upload de imagem)
    profile/[username]/    perfil público, posts, seguir
    profile/edit/          editar perfil (foto, nome de exibição, bio)
  components/         Navbar, PostCard, LikeButton, FollowButton, CommentSection
  lib/supabase/       clients (browser, server, middleware)
supabase/
  schema.sql          schema completo: tabelas, RLS, trigger de novo usuário, storage
```

## O que falta pro próximo passo (fora do MVP)

- Stories
- Mensagens diretas
- Notificações
- Feed "explorar" / descoberta de novos perfis
- Paginação infinita no feed (hoje limita a 30 posts)
