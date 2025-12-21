# 🔧 Guia de Troubleshooting - Senhas do Vercel

## ⚠️ Problema: "Senha não está funcionando"

Se você configurou uma senha personalizada no Vercel e ela não está funcionando, siga este checklist:

---

## ✅ Checklist de Verificação

### 1. **Verificar Variáveis no Vercel**

1. Acesse: [Vercel Dashboard](https://vercel.com)
2. Selecione seu projeto: **Ata Sacramental App**
3. Vá em: **Settings** > **Environment Variables**
4. Verifique se existem:
   - ✅ `VITE_SACRAMENTAL_PIN` = sua senha de 4 dígitos
   - ✅ `VITE_BAPTISMAL_PIN` = sua senha de 4 dígitos

### 2. **Verificar Ambientes Selecionados**

Para cada variável, certifique-se que estão marcados:
- ✅ Production
- ✅ Preview  
- ✅ Development

### 3. **Verificar Formato da Senha**

❌ **ERRADO:**
- Senhas com letras: `abc1`, `2a26`
- Senhas com menos de 4 dígitos: `123`, `26`
- Senhas com mais de 4 dígitos: `20261`, `12345`

✅ **CORRETO:**
- Exatamente 4 dígitos numéricos: `2026`, `2025`, `1234`, `9876`

### 4. **Fazer Redeploy**

**MUITO IMPORTANTE:** Após adicionar/alterar variáveis de ambiente:

1. Vá em **Deployments**
2. Clique nos **três pontos (•••)** do último deployment
3. Selecione **Redeploy**
4. Aguarde o build completar (pode levar 2-5 minutos)

### 5. **Limpar Cache do Navegador**

Após o redeploy:

1. Pressione `Ctrl+Shift+Delete` (Windows) ou `Cmd+Shift+Delete` (Mac)
2. Selecione:
   - ✅ Cookies e outros dados do site
   - ✅ Imagens e arquivos em cache
3. Clique em **Limpar dados**
4. Feche e abra o navegador novamente

---

## 🔍 Como Testar se Está Funcionando

### Teste no Console do Navegador:

1. Abra o site do Vercel
2. Pressione `F12` para abrir DevTools
3. Vá na aba **Console**
4. Você deve ver algo como:

```
🔐 Auth Config Debug:
  VITE_SACRAMENTAL_PIN: ✅ Configurado
  VITE_BAPTISMAL_PIN: ✅ Configurado
```

Se aparecer "❌ Usando fallback", as variáveis NÃO estão configuradas corretamente.

---

## 🐛 Problemas Comuns e Soluções

### Problema 1: "Variável aparece no Vercel mas não funciona"

**Solução:**
- Fazer **Redeploy** (as variáveis só são aplicadas em novos builds)
- Verificar se o nome está EXATAMENTE como: `VITE_SACRAMENTAL_PIN` (case-sensitive)
- Verificar se NÃO há espaços no valor da variável

### Problema 2: "Console mostra ❌ Usando fallback"

**Solução:**
- As variáveis não foram carregadas no build
- Verifique se o prefixo `VITE_` está presente
- Faça um novo deploy

### Problema 3: "Senha correta não é aceita"

**Solução:**
1. Limpar lockout (caso tenha tentado muitas vezes):
   ```javascript
   // No Console do navegador (F12)
   localStorage.removeItem('auth_attempts');
   localStorage.removeItem('auth_lockout');
   ```
2. Recarregar a página
3. Tentar novamente

### Problema 4: "Só funciona localmente, não no Vercel"

**Solução:**
- Confirme que configurou as variáveis no **Vercel Dashboard**
- Não basta ter o arquivo `.env` local
- Faça Redeploy após configurar

---

## 📝 Exemplo Passo a Passo

### Quero mudar a senha para `1234`:

1. **No Vercel:**
   - Settings > Environment Variables
   - Edite `VITE_SACRAMENTAL_PIN`
   - Novo valor: `1234`
   - Save
   
2. **Redeploy:**
   - Deployments > ••• > Redeploy
   - Aguarde completar
   
3. **Teste:**
   - Limpe cache (Ctrl+Shift+Delete)
   - Acesse o site
   - Digite `1234` no modal de autenticação
   - ✅ Deve funcionar!

---

## 🆘 Ainda Não Funciona?

Se seguiu todos os passos e ainda não funciona:

1. **Verifique os logs do build no Vercel:**
   - Deployments > Último deploy > View Build Logs
   - Procure por erros relacionados a variáveis de ambiente

2. **Teste localmente primeiro:**
   ```bash
   # Crie arquivo .env
   echo VITE_SACRAMENTAL_PIN=1234 > .env
   echo VITE_BAPTISMAL_PIN=5678 >> .env
   
   # Reinicie o servidor
   npm run dev
   ```
   
3. **Contate o desenvolvedor** com:
   - Print das variáveis no Vercel
   - Print do console do navegador (F12)
   - Descrição exata do erro

---

## ✅ Confirmação de Sucesso

Você saberá que está funcionando quando:

1. ✅ Console mostra: `✅ Configurado` (não "usando fallback")
2. ✅ Ao digitar a senha correta, você é autenticado
3. ✅ A tela principal do formulário é exibida
4. ✅ Senha funciona tanto local quanto na produção

---

**Última atualização:** Dezembro 2025  
**Versão do sistema:** 1.0.0
