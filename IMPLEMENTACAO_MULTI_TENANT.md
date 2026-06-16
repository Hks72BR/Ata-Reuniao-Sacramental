# Implementação Sistema Multi-Tenant com Firebase Auth

## Resumo da Solução

**Abordagem RECOMENDADA**: Login com Firebase Authentication + Multi-Tenant com isolamento por `wardId`

### Por que esta abordagem?

✅ **Um único projeto Firebase** (gerenciamento centralizado)  
✅ **Você cria as contas** no Firebase Console manualmente  
✅ **Dados totalmente isolados** por ala via Firestore Rules  
✅ **Escalável** para 10-20 alas gratuitamente  
✅ **Simples de manter** (um deploy serve todos)  
✅ **Seguro** (autenticação Firebase + rules)

---

## Passo 1: Habilitar Firebase Authentication

### No Firebase Console:

1. Acesse: https://console.firebase.google.com
2. Selecione seu projeto: `ata-sacramental-829c1`
3. No menu lateral: **Authentication** > **Get Started**
4. Em **Sign-in method**, habil

ite: **Email/Password**
5. **Não habilite** "Email link" (só password mesmo)

---

## Passo 2: Criar Usuários Manualmente

### No Firebase Console > Authentication > Users:

Clique em **Add User** e crie usuários assim:

| Email | Senha | Display Name | wardId (extraído) |
|-------|-------|--------------|-------------------|
| ala-jardim@igreja.com | Senha123forte! | Ala Jardim | ala-jardim |
| ala-centro@igreja.com | Senha123forte! | Ala Centro | ala-centro |
| ala-norte@igreja.com | Senha123forte! | Ala Norte | ala-norte |

**Convenção**: 
- Email: `ala-{nome}@igreja.com` (ou `@suaigreja.com`)
- wardId extraído automaticamente do email (parte antes do @)
- Display Name: Nome amigável da ala

**Entregue para cada ala**: Email + Senha (eles fazem login no app)

---

## Passo 3: Atualizar Firebase Config

Arquivo: `src/lib/firebase.ts`

```typescript
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth'; // ✅ ADICIONAR

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBYaN3GTy8nI-wR9xa3OhFhUCDj1QVzRYY",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "ata-sacramental-829c1.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "ata-sacramental-829c1",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "ata-sacramental-829c1.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "474847726992",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:474847726992:web:425cd4cf64661ef27f7715"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app); // ✅ ADICIONAR
export const COLLECTION_NAME = 'atas-sacramentais';
```

---

## Passo 4: Criar WardContext

**Novo arquivo**: `src/contexts/WardContext.tsx`

(Vou criar este arquivo via terminal em seguida)

Principais funções:
- `signIn(email, password)` - Login com Firebase Auth
- `signOut()` - Logout
- `wardId` - ID da ala (extraído do email)
- `wardName` - Nome amigável da ala
- `currentUser` - Usuário autenticado
- `isAuthenticated` - Boolean de autenticação

---

## Passo 5: Criar Página de Login

**Novo arquivo**: `src/pages/Login.tsx`

Tela de login com:
- Campo Email
- Campo Senha
- Validação de erros
- Loading state
- Redirecionamento após login

---

## Passo 6: Modificar Firestore para Multi-Tenant

Arquivo: `src/lib/firestore.ts`

### Mudanças necessárias:

```typescript
// ✅ ADICIONAR no topo
import { auth } from './firebase';

// ✅ FUNÇÃO para pegar wardId do usuário logado
function getCurrentWardId(): string | null {
  const user = auth.currentUser;
  if (!user?.email) return null;
  return user.email.split('@')[0]; // Extrai ala-jardim de ala-jardim@igreja.com
}

// ✅ MODIFICAR saveRecordToCloud
export async function saveRecordToCloud(record: SacramentalRecord): Promise<string> {
  const wardId = getCurrentWardId();
  if (!wardId) throw new Error('Usuário não autenticado');

  const cleanRecord = JSON.parse(JSON.stringify(record));
  
  const recordData = {
    ...cleanRecord,
    wardId, // ✅ ADICIONAR wardId em todos documentos
    createdAt: cleanRecord.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // ... resto do código igual
}

// ✅ MODIFICAR getAllRecordsFromCloud
export async function getAllRecordsFromCloud(): Promise<SacramentalRecord[]> {
  const wardId = getCurrentWardId();
  if (!wardId) throw new Error('Usuário não autenticado');

  try {
    // ✅ CACHE: Verificar cache primeiro
    const cacheKey = `records_cache_${wardId}`;
    const cacheTimeKey = `cache_time_${wardId}`;
    const cached = localStorage.getItem(cacheKey);
    const cacheTime = localStorage.getItem(cacheTimeKey);
    
    const CACHE_TTL = 3600000; // 1 hora
    if (cached && cacheTime && Date.now() - Number(cacheTime) < CACHE_TTL) {
      console.log('[Firestore] Usando cache');
      return JSON.parse(cached);
    }

    // ✅ FILTRAR por wardId + PAGINAR
    const q = query(
      collection(db, COLLECTION_NAME),
      where('wardId', '==', wardId), // ✅ Isolamento por ala
      orderBy('date', 'desc'),
      limit(50) // ✅ Paginação (50 atas mais recentes)
    );
    
    const querySnapshot = await getDocs(q);
    console.log('[Firestore] Documentos encontrados:', querySnapshot.size);
    
    const records = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...convertTimestamps(doc.data())
    } as SacramentalRecord));
    
    // ✅ Salvar no cache
    localStorage.setItem(cacheKey, JSON.stringify(records));
    localStorage.setItem(cacheTimeKey, Date.now().toString());
    
    return records;
  } catch (error) {
    console.error('[Firestore] Erro ao buscar atas:', error);
    throw error;
  }
}

// ✅ ADICIONAR função para limpar cache
export function clearRecordsCache() {
  const wardId = getCurrentWardId();
  if (wardId) {
    localStorage.removeItem(`records_cache_${wardId}`);
    localStorage.removeItem(`cache_time_${wardId}`);
  }
}
```

---

## Passo 7: Firestore Security Rules

**Firebase Console > Firestore Database > Rules**

Substituir pelo código:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Função auxiliar: usuário autenticado
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Função auxiliar: extrair wardId do email
    function getUserWardId() {
      return request.auth.token.email.split('@')[0];
    }
    
    // Função auxiliar: documento pertence à ala do usuário
    function belongsToUserWard(wardId) {
      return wardId == getUserWardId();
    }
    
    // Coleção principal: Atas Sacramentais
    match /atas-sacramentais/{documentId} {
      // Leitura: apenas se wardId do documento == wardId do usuário
      allow read: if isAuthenticated() && belongsToUserWard(resource.data.wardId);
      
      // Escrita: apenas se wardId sendo salvo == wardId do usuário
      allow create, update: if isAuthenticated() && belongsToUserWard(request.resource.data.wardId);
      
      // Deletar: apenas se wardId do documento == wardId do usuário
      allow delete: if isAuthenticated() && belongsToUserWard(resource.data.wardId);
    }
    
    // Outras coleções (batismal, bispado, conselho de ala)
    match /atas-batismais/{documentId} {
      allow read: if isAuthenticated() && belongsToUserWard(resource.data.wardId);
      allow write: if isAuthenticated() && belongsToUserWard(request.resource.data.wardId);
      allow delete: if isAuthenticated() && belongsToUserWard(resource.data.wardId);
    }
    
    match /atas-bispado/{documentId} {
      allow read: if isAuthenticated() && belongsToUserWard(resource.data.wardId);
      allow write: if isAuthenticated() && belongsToUserWard(request.resource.data.wardId);
      allow delete: if isAuthenticated() && belongsToUserWard(resource.data.wardId);
    }
    
    match /atas-conselho-ala/{documentId} {
      allow read: if isAuthenticated() && belongsToUserWard(resource.data.wardId);
      allow write: if isAuthenticated() && belongsToUserWard(request.resource.data.wardId);
      allow delete: if isAuthenticated() && belongsToUserWard(resource.data.wardId);
    }
    
    match /entrevistas-bispado/{documentId} {
      allow read: if isAuthenticated() && belongsToUserWard(resource.data.wardId);
      allow write: if isAuthenticated() && belongsToUserWard(request.resource.data.wardId);
      allow delete: if isAuthenticated() && belongsToUserWard(resource.data.wardId);
    }
    
    // Lista de membros por ala
    match /wardMembers/{wardId} {
      allow read: if isAuthenticated() && belongsToUserWard(wardId);
      allow write: if isAuthenticated() && belongsToUserWard(wardId);
    }
    
    // Bloquear tudo o resto por padrão
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

**Explicação**:
- Usuário só vê/edita documentos com `wardId` igual ao seu email
- `ala-jardim@igreja.com` → só acessa docs com `wardId: "ala-jardim"`
- Tentativa de burlar via código cliente = bloqueado pelo servidor

**Publicar Rules**: Clique em **Publish**

---

## Passo 8: Atualizar App.tsx

Arquivo: `src/App.tsx`

```typescript
import { WardProvider, useWard } from '@/contexts/WardContext';
import Login from '@/pages/Login';
import { Loader2 } from 'lucide-react';

// ... outros imports

function AppContent() {
  const { isAuthenticated, isLoading } = useWard();
  const [location] = useLocation();

  // Loading de autenticação
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Redirecionar para login se não autenticado
  if (!isAuthenticated && location !== '/login') {
    return <Login />;
  }

  // Rotas normais
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/" component={Dashboard} />
      {/* ... outras rotas */}
    </Switch>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <WardProvider> {/* ✅ Envolver tudo com WardProvider */}
          <AppContent />
        </WardProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
```

---

## Passo 9: Atualizar Dashboard

Arquivo: `src/pages/Dashboard.tsx`

```typescript
import { useWard } from '@/contexts/WardContext';
import { LogOut } from 'lucide-react';

export default function Dashboard() {
  const { wardName, signOut } = useWard();

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  return (
    <div>
      {/* Header com nome da ala */}
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{wardName}</h1>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
        >
          <LogOut className="w-4 h-4" />
          Sair
        </button>
      </div>

      {/* Resto do dashboard */}
      {/* ... */}
    </div>
  );
}
```

---

## Passo 10: Migrar Dados Existentes

**Se você já tem atas no Firestore sem wardId:**

### Script de migração (executar no console do navegador):

```javascript
// Abrir Firebase Console > Firestore > Data
// Executar queries no console do navegador

import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from './firebase';

async function migrateLegacyData() {
  const defaultWardId = 'ala-principal'; // Defina a ala padrão
  
  const collections = [
    'atas-sacramentais',
    'atas-batismais',
    'atas-bispado',
    'atas-conselho-ala',
    'entrevistas-bispado'
  ];
  
  for (const collectionName of collections) {
    const snapshot = await getDocs(collection(db, collectionName));
    
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      
      // Se já tem wardId, pular
      if (data.wardId) continue;
      
      // Adicionar wardId padrão
      await updateDoc(doc(db, collectionName, docSnap.id), {
        wardId: defaultWardId
      });
      
      console.log(`Migrado: ${collectionName}/${docSnap.id}`);
    }
  }
  
  console.log('Migração completa!');
}

// Executar
migrateLegacyData();
```

---

## Custos Estimados

### Com as otimizações (cache + paginação):

| Alas | Leituras/dia | Escritas/dia | Status | Custo/mês |
|------|--------------|--------------|--------|-----------|
| 1-5 | 1,000-5,000 | 100-500 | ✅ Gratuito | $0 |
| 6-10 | 6,000-15,000 | 600-1,000 | ✅ Gratuito | $0 |
| 11-15 | 16,000-22,000 | 1,100-1,500 | ⚠️  Limite | $0-5 |
| 16-20 | 24,000-30,000 | 1,600-2,000 | ❌ Pago | $10-25 |

**Limites gratuitos Firebase**:
- 50,000 reads/dia
- 20,000 writes/dia

**Com cache de 1 hora**: Reduz ~80% das leituras!

---

## Como Fornecer Acesso às Alas

### Email Template para Enviar:

```
Assunto: Acesso ao Sistema de Atas Sacramentais

Olá Liderança da [Nome da Ala],

Segue o acesso ao Sistema Digital de Atas Sacramentais:

🌐 Site: https://seu-app.vercel.app
📧 Email: [email fornecido]
🔑 Senha: [senha fornecida]

PRIMEIROS PASSOS:
1. Acesse o site acima
2. Faça login com o email e senha fornecidos
3. O sistema mostrará apenas os dados da sua ala
4. Recomendamos alterar a senha após o primeiro acesso

IMPORTANTE:
- Dados são confidenciais e isolados por ala
- Cada ala vê apenas suas próprias atas
- Funciona offline e sincroniza automaticamente
-  Faça logout ao terminar de usar

Dúvidas: [seu email/contato]

Atenciosamente,
[Seu Nome]
```

---

## Checklist de Implementação

- [ ] Habilitar Firebase Authentication no Console
- [ ] Criar usuários no Firebase (email/senha para cada ala)
- [ ] Atualizar firebase.ts (adicionar auth export)
- [ ] Criar WardContext.tsx
- [ ] Criar Login.tsx
- [ ] Modificar firestore.ts (adicionar wardId e cache)
- [ ] Configurar Firestore Security Rules
- [ ] Atualizar App.tsx (adicionar WardProvider)
- [ ] Atualizar Dashboard.tsx (mostrar ala + logout)
- [ ] Migrar dados existentes (se houver)
- [ ] Testar com 2 usuários diferentes
- [ ] Documentar credenciais e enviar para alas

---

## Testes Recomendados

### Teste 1: Isolamento de Dados
1. Criar usuário A (ala-teste1@igreja.com)
2. Criar usuário B (ala-teste2@igreja.com)
3. Login com A, criar ata
4. Logout, login com B
5. Verificar que ata de A **NÃO aparece** para B

### Teste 2: Security Rules
1. Abrir DevTools Console
2. Tentar manualmente buscar docs de outra ala:
```javascript
getDocs(query(collection(db, 'atas-sacramentais'), where('wardId', '==', 'outra-ala')))
```
3. Deve retornar **vazio ou erro de permissão**

### Teste 3: Cache
1. Carregar histórico (veja Network tab: deve fazer 1 request Firestore)
2. Recarregar página (deve usar cache, 0 requests)
3. Aguardar 1h1min, recarregar (deve fazer novo request)

---

## Próximos Passos (Futuro)

1. **Permitir alterar senha**: Adicionar página "Configurações"
2. **Recuperação de senha**: Firebase Auth suporta email de reset
3. **Múltiplos usuários por ala**: Criar roles (admin, editor, viewer)
4. **Auditoria avançada**: Log de quem fez cada ação
5. **Dashboard administrativo**: Você ver estatísticas de todas alas
6. **Backup automático programado**: Cloud Functions

---

## Contato e Suporte

Para dúvidas sobre implementação:
1. Consulte este documento
2. Verifique logs do console do navegador
3. Cheque Firebase Console > Authentication e Firestore

**Arquivos modificados nesta implementação**:
- [novo] src/contexts/WardContext.tsx
- [novo] src/pages/Login.tsx
- [modificado] src/lib/firebase.ts
- [modificado] src/lib/firestore.ts
- [modificado] src/App.tsx
- [modificado] src/pages/Dashboard.tsx
- [modificado] Firestore Security Rules (no Firebase Console)
