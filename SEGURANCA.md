# 🔐 Guia de Configuração de Segurança

## 📋 Resumo das Melhorias Implementadas

Este guia documenta as melhorias de segurança implementadas no Sistema de Atas.

### ✅ Recursos de Segurança

1. **Variáveis de Ambiente**
   - PINs não estão mais expostos no código-fonte
   - Credenciais do Firebase protegidas
   - Configuração separada para desenvolvimento e produção

2. **Rate Limiting**
   - Máximo de 5 tentativas de login incorretas
   - Bloqueio de 15 minutos após exceder o limite
   - Contador de tentativas restantes visível

3. **Timeout de Sessão**
   - Sessões expiram automaticamente após 8 horas de inatividade
   - Renovação automática de sessão ao usar o app
   - Proteção contra sessões esquecidas

4. **Feedback de Segurança**
   - Avisos de tentativas restantes
   - Mensagem de bloqueio temporário
   - Indicador de expiração de sessão

---

## 🚀 Configuração para Desenvolvimento Local

### 1. Criar arquivo `.env`

O arquivo `.env.example` já está incluído no projeto. Para configurar:

```bash
# Copiar o exemplo
cp .env.example .env
```

### 2. Editar `.env` com suas credenciais

```env
# PINs de Acesso
VITE_SACRAMENTAL_PIN=2026
VITE_BAPTISMAL_PIN=2025

# Firebase (obtenha em: https://console.firebase.google.com)
VITE_FIREBASE_API_KEY=sua-api-key-aqui
VITE_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=seu-projeto-id
VITE_FIREBASE_STORAGE_BUCKET=seu-projeto.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

### 3. ⚠️ IMPORTANTE: Segurança do `.env`

```bash
# NUNCA faça commit do arquivo .env
# Ele já está no .gitignore
git status  # Verifique que .env não aparece
```

---

## ☁️ Configuração no Vercel (Produção)

### Passo 1: Acessar Dashboard do Vercel

1. Faça login em [vercel.com](https://vercel.com)
2. Selecione seu projeto
3. Vá em **Settings** (Configurações)

### Passo 2: Configurar Environment Variables

1. No menu lateral, clique em **Environment Variables**
2. Adicione cada variável individualmente:

| Nome da Variável | Valor | Ambiente |
|-----------------|-------|----------|
| `VITE_SACRAMENTAL_PIN` | `2026` | Production, Preview, Development |
| `VITE_BAPTISMAL_PIN` | `2025` | Production, Preview, Development |
| `VITE_FIREBASE_API_KEY` | `sua-api-key` | Production, Preview, Development |
| `VITE_FIREBASE_AUTH_DOMAIN` | `seu-projeto.firebaseapp.com` | Production, Preview, Development |
| `VITE_FIREBASE_PROJECT_ID` | `seu-projeto-id` | Production, Preview, Development |
| `VITE_FIREBASE_STORAGE_BUCKET` | `seu-projeto.firebasestorage.app` | Production, Preview, Development |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `123456789` | Production, Preview, Development |
| `VITE_FIREBASE_APP_ID` | `1:123456789:web:abc123` | Production, Preview, Development |

### Passo 3: Redeploy

Após adicionar as variáveis:

1. Vá em **Deployments**
2. Clique nos três pontos do último deployment
3. Selecione **Redeploy**
4. Confirme o redeploy

✅ As novas variáveis estarão ativas!

---

## 🔄 Como Alterar os PINs

### Em Desenvolvimento:

1. Edite o arquivo `.env`
2. Altere `VITE_SACRAMENTAL_PIN` ou `VITE_BAPTISMAL_PIN`
3. Reinicie o servidor de desenvolvimento:
```bash
npm run dev
```

### Em Produção (Vercel):

1. Acesse **Vercel Dashboard** > **Settings** > **Environment Variables**
2. Clique em **Edit** na variável desejada
3. Digite o novo PIN
4. Salve e faça **Redeploy**

---

## 🛡️ Recursos de Segurança Detalhados

### Rate Limiting

**Como funciona:**
- Após 5 tentativas incorretas, o usuário é bloqueado por 15 minutos
- O contador é reiniciado após login bem-sucedido
- O bloqueio usa `localStorage` (persiste mesmo fechando o navegador)

**Limpar manualmente (para testes):**
```javascript
// No Console do navegador (F12)
localStorage.removeItem('auth_attempts');
localStorage.removeItem('auth_lockout');
```

### Timeout de Sessão

**Como funciona:**
- Sessão expira após 8 horas sem atividade
- Cada ação no app renova automaticamente a sessão
- Usa `sessionStorage` (expira ao fechar aba)

**Tempo de expiração atual:** 8 horas
**Modificar em:** `src/lib/auth.ts` → `SESSION_TIMEOUT`

### Validação de PIN

**Características:**
- PINs devem ter exatamente 4 dígitos
- Apenas números são aceitos
- Validação em tempo real
- Feedback imediato de erro

---

## 🔍 Troubleshooting

### Problema: "PIN incorreto" mesmo com PIN correto

**Solução:**
1. Verifique se as variáveis de ambiente estão configuradas:
```bash
# Em desenvolvimento
cat .env

# No Vercel
# Vá em Settings > Environment Variables
```

2. Limpe o cache do navegador (Ctrl+Shift+Del)

3. No Vercel, faça um novo deploy:
```bash
git commit --allow-empty -m "Trigger redeploy"
git push
```

### Problema: Bloqueado por muitas tentativas

**Solução rápida:**
```javascript
// Console do navegador (F12)
localStorage.removeItem('auth_attempts');
localStorage.removeItem('auth_lockout');
location.reload();
```

### Problema: Variáveis não carregam no Vercel

**Verificar:**
1. Variáveis devem começar com `VITE_` (obrigatório para Vite)
2. Todas as variáveis devem estar em **Production**
3. Fazer **Redeploy** após adicionar variáveis

---

## 📊 Estatísticas de Segurança

| Recurso | Status | Descrição |
|---------|--------|-----------|
| 🔐 PINs em Variáveis de Ambiente | ✅ | PINs não expostos no código |
| 🚫 Rate Limiting | ✅ | 5 tentativas / 15 min bloqueio |
| ⏱️ Timeout de Sessão | ✅ | 8 horas de inatividade |
| 🔄 Renovação Automática | ✅ | Sessão renovada ao usar app |
| 📱 Feedback Visual | ✅ | Contador e avisos |
| 🔒 Firebase Seguro | ✅ | Credenciais em env vars |

---

## 🎯 Melhores Práticas

### ✅ Faça

- Altere os PINs regularmente (a cada 3-6 meses)
- Use PINs diferentes para Sacramental e Batismal
- Mantenha o `.env` fora do Git
- Configure todas as variáveis no Vercel antes do deploy
- Verifique logs do Vercel para erros de configuração

### ❌ Não Faça

- Não compartilhe PINs publicamente
- Não faça commit do arquivo `.env`
- Não use PINs óbvios (1234, 0000, etc.)
- Não desabilite o rate limiting
- Não exponha credenciais do Firebase

---

## 📚 Referências

- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Firebase Security Rules](https://firebase.google.com/docs/rules)

---

## 🆘 Suporte

Se encontrar problemas:

1. Verifique este guia
2. Consulte os logs do Vercel
3. Teste em ambiente local primeiro
4. Limpe cache e cookies do navegador

---

**Última atualização:** Dezembro 2025
**Versão do Sistema:** 2.0 (com melhorias de segurança)
