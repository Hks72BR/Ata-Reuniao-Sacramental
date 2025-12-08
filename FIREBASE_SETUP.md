# 🔥 Configuração do Firebase - Passo a Passo

## ✅ Passo 1: Criar Projeto no Firebase

1. Acesse: https://console.firebase.google.com/
2. Clique em **"Adicionar projeto"** ou **"Create a project"**
3. Nome do projeto: `ata-sacramental` (ou outro de sua preferência)
4. **Desabilite** o Google Analytics (não é necessário)
5. Clique em **"Criar projeto"**

## ✅ Passo 2: Registrar App Web

1. No painel do projeto, clique no ícone **Web** (`</>`)
2. Nickname do app: `Ata Sacramental App`
3. **NÃO** marque "Configure Firebase Hosting"
4. Clique em **"Registrar app"**
5. **COPIE** as credenciais que aparecem (você vai precisar delas!)

Exemplo das credenciais:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "ata-sacramental.firebaseapp.com",
  projectId: "ata-sacramental",
  storageBucket: "ata-sacramental.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456"
};
```

## ✅ Passo 3: Configurar Firestore Database

1. No menu lateral, clique em **"Firestore Database"**
2. Clique em **"Criar banco de dados"**
3. Escolha **"Iniciar no modo de produção"**
4. Localização: **"southamerica-east1 (São Paulo)"** (mais próximo)
5. Clique em **"Ativar"**

## ✅ Passo 4: Configurar Regras de Segurança

1. Na aba **"Regras"** do Firestore
2. **SUBSTITUA** o conteúdo por:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permitir leitura e escrita para todos (sem autenticação)
    // Adequado para grupo pequeno de 5 pessoas de confiança
    match /atas-sacramentais/{document=**} {
      allow read, write: true;
    }
  }
}
```

3. Clique em **"Publicar"**

**⚠️ IMPORTANTE:** Essas regras permitem acesso total sem login. Como são apenas 5 pessoas de confiança, é adequado. O link do app não é público.

## ✅ Passo 5: Adicionar Credenciais no Código

1. Abra o arquivo: `src/lib/firebase.ts`
2. **SUBSTITUA** as credenciais pelas suas:

```typescript
const firebaseConfig = {
  apiKey: "SUA_API_KEY_AQUI", // Cole sua API Key
  authDomain: "SEU_PROJECT_ID.firebaseapp.com", // Seu domínio
  projectId: "SEU_PROJECT_ID", // ID do projeto
  storageBucket: "SEU_PROJECT_ID.appspot.com", // Storage
  messagingSenderId: "SEU_MESSAGING_SENDER_ID", // Sender ID
  appId: "SEU_APP_ID" // App ID
};
```

3. **Salve o arquivo**

## ✅ Passo 6: Testar Localmente

```bash
npm run dev
```

1. Abra: http://localhost:3000
2. Crie uma ata de teste
3. Clique em **"Salvar"**
4. Verifique no Firebase Console se a ata foi salva:
   - Firestore Database > atas-sacramentais

## ✅ Passo 7: Deploy para Produção

```bash
git add .
git commit -m "feat: integração com Firebase Firestore"
git push origin main
```

O Vercel fará o deploy automaticamente!

## 🎉 Pronto!

Agora seu app:
- ✅ Salva atas na nuvem (Firebase)
- ✅ Sincroniza automaticamente entre dispositivos
- ✅ Todos os 5 usuários veem as mesmas atas
- ✅ Backup local automático (IndexedDB)
- ✅ Funciona offline (com sincronização posterior)

## 📱 Uso no Dia a Dia

1. **Qualquer um dos 5** pode abrir o app
2. **Criar** uma nova ata
3. **Salvar** - vai direto para a nuvem
4. **Todos os outros** veem instantaneamente no histórico
5. **Baixar PDF** quando necessário

## 🔒 Segurança

- O link do app só é conhecido por vocês 5
- Firebase é seguro e confiável (Google)
- Dados criptografados em trânsito
- Backup local se perder conexão

## 💰 Custo

- **100% GRATUITO** para seu uso
- Limite: 1GB de dados (você usará 0,02% ao ano)
- 50.000 leituras/dia (você fará ~10-20)
- 20.000 escritas/dia (você fará ~1-2)

## 🆘 Problemas?

Se aparecer erro ao salvar:
1. Verifique se copiou as credenciais corretamente
2. Confirme que as regras do Firestore foram publicadas
3. Verifique o console do navegador (F12) para ver erro específico

---

**Qualquer dúvida, me avise!** 🚀
