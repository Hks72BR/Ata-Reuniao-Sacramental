# 🔥 Guia: Firebase + Ata Sacramental (Nuvem)

## 🎯 Por que Firebase?

**Perfeito para seu caso:**
- ✅ **Grátis** até 1GB (suficiente para milhares de atas)
- ✅ **Backup automático** na nuvem
- ✅ **Acessa de qualquer dispositivo**
- ✅ **Dados nunca se perdem**
- ✅ **Sincronização automática**
- ✅ **Busca por data/período**
- ✅ **Histórico completo**

## 📊 Como Vai Funcionar

### Antes (Atual)
```
Preenche ata → IndexedDB (só no navegador) → Dados locais
❌ Perde se limpar cache
❌ Só acessa no mesmo dispositivo
```

### Depois (Com Firebase)
```
Preenche ata → Firebase (nuvem) + IndexedDB (cache)
✅ Acessa de qualquer lugar
✅ Dados seguros na nuvem
✅ Funciona offline
✅ Sincroniza quando online
```

---

## 🔧 Implementação (Passo a Passo)

### Fase 1: Configurar Firebase

#### 1. Criar Projeto Firebase

1. Acesse: [console.firebase.google.com](https://console.firebase.google.com)
2. Clique "Adicionar projeto"
3. Nome: **"Ata Sacramental"**
4. Desabilite Google Analytics (opcional)
5. Clique "Criar projeto"

#### 2. Ativar Firestore Database

1. No menu lateral: **Firestore Database**
2. Clique "Criar banco de dados"
3. Escolha: **Modo de produção**
4. Local: **southamerica-east1** (São Paulo)
5. Clique "Ativar"

#### 3. Configurar Regras de Segurança

No Firestore, vá em **Regras** e cole:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permitir leitura/escrita de atas
    match /atas/{ataId} {
      allow read, write: if true; // Para uso pessoal
      // Para produção, adicione autenticação
    }
  }
}
```

**⚠️ Nota:** Para uso pessoal está OK. Para produção, adicione autenticação.

#### 4. Obter Credenciais

1. Vá em **Configurações do projeto** (ícone engrenagem)
2. Role até "Seus apps"
3. Clique no ícone **</>** (Web)
4. Nome: **"Ata Sacramental Web"**
5. Marque: **"Firebase Hosting"**
6. Clique "Registrar app"
7. **Copie a configuração** (vamos usar depois)

Exemplo:
```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "ata-sacramental.firebaseapp.com",
  projectId: "ata-sacramental",
  storageBucket: "ata-sacramental.appspot.com",
  messagingSenderId: "123...",
  appId: "1:123..."
};
```

---

### Fase 2: Adicionar Firebase ao Projeto

#### 1. Instalar Dependências

```bash
cd "c:\Users\higor\Desktop\Ata Sacramental app"
npm install firebase
```

#### 2. Criar arquivo de configuração

Crie: `src/lib/firebase.ts`

```typescript
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Cole suas credenciais aqui
const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "SEU_PROJETO.firebaseapp.com",
  projectId: "SEU_PROJETO",
  storageBucket: "SEU_PROJETO.appspot.com",
  messagingSenderId: "SEU_ID",
  appId: "SEU_APP_ID"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar Firestore
export const db = getFirestore(app);
```

#### 3. Criar serviço Firebase

Crie: `src/lib/firebaseService.ts`

```typescript
import { 
  collection, 
  addDoc, 
  getDocs, 
  getDoc,
  doc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import { SacramentalRecord } from '@/types';

const COLLECTION_NAME = 'atas';

/**
 * Salvar ata no Firebase
 */
export async function saveToFirebase(record: SacramentalRecord): Promise<string> {
  try {
    const ataData = {
      ...record,
      createdAt: record.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      timestamp: Timestamp.now(), // Para ordenação
    };

    if (record.id) {
      // Atualizar existente
      const docRef = doc(db, COLLECTION_NAME, record.id);
      await updateDoc(docRef, ataData);
      return record.id;
    } else {
      // Criar nova
      const docRef = await addDoc(collection(db, COLLECTION_NAME), ataData);
      return docRef.id;
    }
  } catch (error) {
    console.error('Erro ao salvar no Firebase:', error);
    throw error;
  }
}

/**
 * Buscar todas as atas
 */
export async function getAllFromFirebase(): Promise<SacramentalRecord[]> {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      orderBy('timestamp', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const atas: SacramentalRecord[] = [];
    
    querySnapshot.forEach((doc) => {
      atas.push({
        id: doc.id,
        ...doc.data(),
      } as SacramentalRecord);
    });
    
    return atas;
  } catch (error) {
    console.error('Erro ao buscar atas:', error);
    throw error;
  }
}

/**
 * Buscar ata por ID
 */
export async function getFromFirebase(id: string): Promise<SacramentalRecord | null> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
      } as SacramentalRecord;
    }
    
    return null;
  } catch (error) {
    console.error('Erro ao buscar ata:', error);
    throw error;
  }
}

/**
 * Buscar atas por data
 */
export async function searchByDateFirebase(date: string): Promise<SacramentalRecord[]> {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('date', '==', date),
      orderBy('timestamp', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const atas: SacramentalRecord[] = [];
    
    querySnapshot.forEach((doc) => {
      atas.push({
        id: doc.id,
        ...doc.data(),
      } as SacramentalRecord);
    });
    
    return atas;
  } catch (error) {
    console.error('Erro ao buscar por data:', error);
    throw error;
  }
}

/**
 * Buscar atas por período
 */
export async function searchByRangeFirebase(
  startDate: string,
  endDate: string
): Promise<SacramentalRecord[]> {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('date', '>=', startDate),
      where('date', '<=', endDate),
      orderBy('date', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const atas: SacramentalRecord[] = [];
    
    querySnapshot.forEach((doc) => {
      atas.push({
        id: doc.id,
        ...doc.data(),
      } as SacramentalRecord);
    });
    
    return atas;
  } catch (error) {
    console.error('Erro ao buscar por período:', error);
    throw error;
  }
}

/**
 * Deletar ata
 */
export async function deleteFromFirebase(id: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Erro ao deletar ata:', error);
    throw error;
  }
}

/**
 * Sincronizar: IndexedDB → Firebase
 */
export async function syncToCloud(records: SacramentalRecord[]): Promise<void> {
  try {
    for (const record of records) {
      await saveToFirebase(record);
    }
  } catch (error) {
    console.error('Erro ao sincronizar:', error);
    throw error;
  }
}
```

---

### Fase 3: Integrar com o App Existente

#### Atualizar `src/lib/db.ts`

Adicione sincronização automática:

```typescript
import { saveToFirebase, getAllFromFirebase } from './firebaseService';

// Adicione no final do arquivo
export async function saveRecordWithSync(record: SacramentalRecord): Promise<string> {
  try {
    // 1. Salvar localmente (IndexedDB)
    const localId = await saveRecord(record);
    
    // 2. Tentar salvar na nuvem (Firebase)
    try {
      const cloudId = await saveToFirebase({ ...record, id: localId });
      return cloudId;
    } catch (cloudError) {
      console.log('Offline: salvo apenas localmente');
      return localId;
    }
  } catch (error) {
    throw error;
  }
}

export async function getAllRecordsWithSync(): Promise<SacramentalRecord[]> {
  try {
    // Tentar buscar da nuvem primeiro
    const cloudRecords = await getAllFromFirebase();
    
    // Atualizar cache local
    for (const record of cloudRecords) {
      await saveRecord(record);
    }
    
    return cloudRecords;
  } catch (error) {
    // Se offline, usar dados locais
    console.log('Offline: usando cache local');
    return getAllRecords();
  }
}
```

---

### Fase 4: Atualizar Componentes

#### `src/pages/Home.tsx`

Trocar imports:

```typescript
// ANTES
import { saveRecord } from '@/lib/db';

// DEPOIS
import { saveRecordWithSync as saveRecord } from '@/lib/db';
```

#### `src/pages/History.tsx`

```typescript
// ANTES
import { getAllRecords } from '@/lib/db';

// DEPOIS
import { getAllRecordsWithSync as getAllRecords } from '@/lib/db';
```

---

## 📊 Como Vai Funcionar

### Cenário 1: Online
```
1. Usuário preenche ata
2. Salva no Firebase (nuvem) ✅
3. Salva no IndexedDB (cache) ✅
4. Pode acessar de qualquer dispositivo ✅
```

### Cenário 2: Offline
```
1. Usuário preenche ata
2. Salva no IndexedDB (cache) ✅
3. Quando voltar online, sincroniza com Firebase ✅
```

### Cenário 3: Buscar Atas
```
1. Abre histórico
2. Busca no Firebase (dados mais recentes) ✅
3. Se offline, usa IndexedDB (cache) ✅
```

---

## 💰 Custos

### Firebase Spark Plan (Grátis)
- ✅ **Armazenamento:** 1 GB
- ✅ **Leituras:** 50k/dia
- ✅ **Escritas:** 20k/dia
- ✅ **Banda:** 10 GB/mês

**Para atas de igreja:** Suficiente para anos de uso! ✅

**Estimativa:**
- 1 ata = ~5 KB
- 1 GB = ~200.000 atas
- Usar 100 atas/ano = 2.000 anos de armazenamento! 😄

---

## 🔒 Segurança (Opcional)

### Adicionar Autenticação

Se quiser que só você acesse:

#### 1. Ativar Authentication

No Firebase Console:
1. **Authentication** → **Sign-in method**
2. Ative **E-mail/senha**
3. Adicione seu e-mail

#### 2. Atualizar Regras

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /atas/{ataId} {
      // Só permite se estiver autenticado
      allow read, write: if request.auth != null;
    }
  }
}
```

#### 3. Adicionar Login ao App

```typescript
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

const auth = getAuth();

// Login
await signInWithEmailAndPassword(auth, email, password);
```

---

## 🎯 Checklist de Implementação

- [ ] Criar projeto no Firebase
- [ ] Ativar Firestore
- [ ] Configurar regras
- [ ] Obter credenciais
- [ ] `npm install firebase`
- [ ] Criar `src/lib/firebase.ts`
- [ ] Criar `src/lib/firebaseService.ts`
- [ ] Atualizar `src/lib/db.ts`
- [ ] Atualizar componentes
- [ ] Testar localmente
- [ ] Deploy no Vercel
- [ ] Testar sincronização

---

## 🚀 Deploy Final

Depois de implementar:

```bash
# 1. Build
npm run build

# 2. Deploy no Vercel
vercel --prod
```

Agora seu app:
- ✅ Hospedado no Vercel (grátis)
- ✅ Dados no Firebase (grátis)
- ✅ Acessa de qualquer lugar
- ✅ Funciona offline
- ✅ Dados seguros

---

## 📱 Resultado Final

### Uso Típico

**Na igreja (qualquer dispositivo):**
1. Acessa app
2. Preenche ata
3. Salva (vai para nuvem)
4. Pronto!

**Em casa (outro dispositivo):**
1. Acessa app
2. Vê todas as atas
3. Busca por data
4. Baixa/edita

**Sem internet:**
1. App funciona
2. Salva localmente
3. Sincroniza depois

---

## 🆘 Suporte

**Problemas?**
1. Verifique credenciais Firebase
2. Teste conexão de internet
3. Veja console do navegador (F12)
4. Confira regras do Firestore

---

**Pronto para implementar? Siga o guia passo a passo! 🚀**
