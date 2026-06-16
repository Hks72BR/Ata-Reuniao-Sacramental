# Guia de Configuração - Usuários Firebase Auth

## Passo 1: Habilitar Firebase Authentication

1. Acesse: https://console.firebase.google.com
2. Selecione o projeto: **ata-sacramental-829c1**
3. No menu lateral: **Authentication** > **Get Started**
4. Em **Sign-in method**, clique em **Email/Password**
5. **Habilite** a opção "Email/Password"
6. **Salve**

---

## Passo 2: Criar Usuários para as 6 Alas

### No Firebase Console > Authentication > Users:

Clique em **Add User** e crie os seguintes usuários:

### 1. Ala Casa Grande (Já existe - Principal)
```
Email:        ala-casa-grande@estaca-embuguacu.com
Senha:        CasaGrande2026#Segura
Display Name: Ala Casa Grande
```

### 2. Ala Embu-Guaçu
```
Email:        ala-embu-guacu@estaca-embuguacu.com
Senha:        EmbuGuacu2026#Segura
Display Name: Ala Embu-Guaçu
```

### 3. Ala Parelheiros
```
Email:        ala-parelheiros@estaca-embuguacu.com
Senha:        Parelheiros2026#Segura
Display Name: Ala Parelheiros
```

### 4. Ala Palmares
```
Email:        ala-palmares@estaca-embuguacu.com
Senha:        Palmares2026#Segura
Display Name: Ala Palmares
```

### 5. Ala Jardim Campinas
```
Email:        ala-jardim-campinas@estaca-embuguacu.com
Senha:        JardimCampinas2026#Segura
Display Name: Ala Jardim Campinas
```

### 6. Ala Cipó  
```
Email:        ala-cipo@estaca-embuguacu.com
Senha:        Cipo2026#Segura
Display Name: Ala Cipó
```

---

## Passo 3: Configurar Emails de Backup

### No Firebase Console > Firestore Database:

Crie uma collection chamada **wardSettings**. Adicione os seguintes documentos:

### Documento 1: ala-casa-grande
```json
{
  "wardId": "ala-casa-grande",
  "wardName": "Ala Casa Grande",
  "backupEmail": "bispo.casagrande@estaca.com",
  "createdAt": "2026-04-03T00:00:00Z",
  "settings": {
    "enableMonthlyBackup": true,
    "backupFormat": "pdf+json",
    "notifyOnBackup": true,
    "backupDay": 1
  }
}
```

### Documento 2: ala-embu-guacu
```json
{
  "wardId": "ala-embu-guacu",
  "wardName": "Ala Embu-Guaçu",
  "backupEmail": "bispo.embuguacu@estaca.com",
  "createdAt": "2026-04-03T00:00:00Z",
  "settings": {
    "enableMonthlyBackup": true,
    "backupFormat": "pdf+json",
    "notifyOnBackup": true,
    "backupDay": 1
  }
}
```

### Documento 3: ala-parelheiros
```json
{
  "wardId": "ala-parelheiros",
  "wardName": "Ala Parelheiros",
  "backupEmail": "bispo.parelheiros@estaca.com",
  "createdAt": "2026-04-03T00:00:00Z",
  "settings": {
    "enableMonthlyBackup": true,
    "backupFormat": "pdf+json",
    "notifyOnBackup": true,
    "backupDay": 1
  }
}
```

### Documento 4: ala-palmares
```json
{
  "wardId": "ala-palmares",
  "wardName": "Ala Palmares",
  "backupEmail": "bispo.palmares@estaca.com",
  "createdAt": "2026-04-03T00:00:00Z",
  "settings": {
    "enableMonthlyBackup": true,
    "backupFormat": "pdf+json",
    "notifyOnBackup": true,
    "backupDay": 1
  }
}
```

### Documento 5: ala-jardim-campinas
```json
{
  "wardId": "ala-jardim-campinas",
  "wardName": "Ala Jardim Campinas",
  "backupEmail": "bispo.jardimcampinas@estaca.com",
  "createdAt": "2026-04-03T00:00:00Z",
  "settings": {
    "enableMonthlyBackup": true,
    "backupFormat": "pdf+json",
    "notifyOnBackup": true,
    "backupDay": 1
  }
}
```

### Documento 6: ala-cipo
```json
{
  "wardId": "ala-cipo",
  "wardName": "Ala Cipó",
  "backupEmail": "bispo.cipo@estaca.com",
  "createdAt": "2026-04-03T00:00:00Z",
  "settings": {
    "enableMonthlyBackup": true,
    "backupFormat": "pdf+json",
    "notifyOnBackup": true,
    "backupDay": 1
  }
}
```

**IMPORTANTE**: Substitua os emails de backup pelos emails reais dos bispos de cada ala!

---

## Passo 4: Configurar Firestore Security Rules

No Firebase Console > Firestore Database > Rules, substitua pelo código:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function getUserWardId() {
      return request.auth.token.email.split('@')[0];
    }
    
    function belongsToUserWard(wardId) {
      return wardId == getUserWardId();
    }
    
    // Atas Sacramentais
    match /atas-sacramentais/{documentId} {
      allow read: if isAuthenticated() && belongsToUserWard(resource.data.wardId);
      allow create, update: if isAuthenticated() && belongsToUserWard(request.resource.data.wardId);
      allow delete: if isAuthenticated() && belongsToUserWard(resource.data.wardId);
    }
    
    // Atas Batismais
    match /atas-batismais/{documentId} {
      allow read: if isAuthenticated() && belongsToUserWard(resource.data.wardId);
      allow create, update: if isAuthenticated() && belongsToUserWard(request.resource.data.wardId);
      allow delete: if isAuthenticated() && belongsToUserWard(resource.data.wardId);
    }
    
    // Atas de Bispado
    match /atas-bispado/{documentId} {
      allow read: if isAuthenticated() && belongsToUserWard(resource.data.wardId);
      allow create, update: if isAuthenticated() && belongsToUserWard(request.resource.data.wardId);
      allow delete: if isAuthenticated() && belongsToUserWard(resource.data.wardId);
    }
    
    // Atas de Conselho de Ala
    match /atas-conselho-ala/{documentId} {
      allow read: if isAuthenticated() && belongsToUserWard(resource.data.wardId);
      allow create, update: if isAuthenticated() && belongsToUserWard(request.resource.data.wardId);
      allow delete: if isAuthenticated() && belongsToUserWard(resource.data.wardId);
    }
    
    // Entrevistas de Bispado
    match /entrevistas-bispado/{documentId} {
      allow read: if isAuthenticated() && belongsToUserWard(resource.data.wardId);
      allow create, update: if isAuthenticated() && belongsToUserWard(request.resource.data.wardId);
      allow delete: if isAuthenticated() && belongsToUserWard(resource.data.wardId);
    }
    
    // Lista de Membros
    match /wardMembers/{wardId} {
      allow read: if isAuthenticated() && belongsToUserWard(wardId);
      allow write: if isAuthenticated() && belongsToUserWard(wardId);
    }
    
    // Configurações de Backup (somente leitura)
    match /wardSettings/{wardId} {
      allow read: if isAuthenticated() && belongsToUserWard(wardId);
      allow write: if false; // Apenas admin via console
    }
    
    // Bloquear tudo o resto
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

Clique em **Publish**

---

## Passo 5: Migrar Dados Existentes (Se Houver)

Se você já tem atas da "Ala Casa Grande" no Firestore sem wardId:

### Opção 1: Via Console do Navegador

1. Abra **https://seu-app.vercel.app** (ou localhost)
2. Abra **DevTools** (F12) > Console
3. Cole e execute o script:

```javascript
// Copiar e colar no console do navegador
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from './firebase';

async function migrateLegacyData() {
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
      
      // Adicionar wardId padrão (Casa Grande)
      await updateDoc(doc(db, collectionName, docSnap.id), {
        wardId: 'ala-casa-grande'
      });
      
      console.log(`✅ Migrado: ${collectionName}/${docSnap.id}`);
    }
  }
  
  console.log('✅✅✅ Migração completa!');
}

// Executar
migrateLegacyData();
```

### Opção 2: Via Firebase Console (Manual)

1. Firestore Database > atas-sacramentais
2. Para cada documento SEM campo "wardId":
   - Clique no documento
   - Add field: `wardId` = `ala-casa-grande`
   - Save
3. Repita para todas collections

---

## Passo 6: Enviar Credenciais para as Alas

### Template de Email:

```
Para: Bispo da [Nome da Ala]
Assunto: Acesso ao Sistema de Atas Sacramentais - Estaca Embu-Guaçu

Prezado Bispo,

Foi configurado o acesso ao novo Sistema Digital de Atas Sacramentais para a [Nome da Ala].

🌐 **Link de Acesso**: https://[seu-dominio].vercel.app
📧 **Email**: [email da ala]
🔑 **Senha**: [senha da ala]

**IMPORTANTE**:
- Esta senha é temporária. Recomendamos alterá-la após o primeiro acesso.
- O sistema funciona em celulares, tablets e computadores.
- Todos os dados são isolados por ala (segurança total).
- Funciona offline e sincroniza automaticamente quando online.
- Backup automático mensal será enviado para o email do bispo.

**PRIMEIROS PASSOS**:
1. Acesse o link acima
2. Faça login com o email e senha fornecidos
3. Navegue pelas opções: Ata Sacramental, Batismal, Bispado, Conselho de Ala
4. Cada módulo solicita um PIN (configure no primeiro acesso)

**BACKUP AUTOMÁTICO**:
- Todo dia 1º de cada mês
- PDF + JSON das atas do mês anterior
- Enviado para: [email do bispo]

**SUPORTE**:
Em caso de dúvidas ou problemas, entre em contato:
- Email: [seu email]
- WhatsApp: [seu número]

Que o Senhor abençoe este trabalho!

Fraternalmente,
[Seu Nome]
Administrador do Sistema
Estaca Embu-Guaçu
```

---

## Passo 7: Testar o Sistema

### Teste de Isolamento de Dados:

1. **Login com Ala 1**:
   - Email: `ala-casa-grande@estaca-embuguacu.com`
   - Criar uma ata sacramental
   - Verificar que aparece no histórico

2. **Logout e Login com Ala 2**:
   - Email: `ala-embu-guacu@estaca-embuguacu.com`
   - Verificar histórico VAZIO (ata da Ala 1 não deve aparecer)
   - Criar uma ata
   - Verificar que apenas a ata da Ala 2 aparece

3. **Verificar Security Rules**:
   - Tentar acessar dados de outra ala via console do navegador
   - Deve receber erro de permissão

---

## Resumo de Acessos Criados

| Ala | Email | Senha | WardId |
|-----|-------|-------|--------|
| Casa Grande | ala-casa-grande@estaca-embuguacu.com | CasaGrande2026#Segura | ala-casa-grande |
| Embu-Guaçu | ala-embu-guacu@estaca-embuguacu.com | EmbuGuacu2026#Segura | ala-embu-guacu |
| Parelheiros | ala-parelheiros@estaca-embuguacu.com | Parelheiros2026#Segura | ala-parelheiros |
| Palmares | ala-palmares@estaca-embuguacu.com | Palmares2026#Segura | ala-palmares |
| Jardim Campinas | ala-jardim-campinas@estaca-embuguacu.com | JardimCampinas2026#Segura | ala-jardim-campinas |
| Cipó | ala-cipo@estaca-embuguacu.com | Cipo2026#Segura | ala-cipo |

**Guarde essas senhas em local seguro!**

---

## Próximos Passos (Futuro)

1. **Cloud Function para Backup Mensal** (implementar depois)
2. **Permitir alterar senha** (via Firebase Auth UI)
3. **Dashboard administrativo** (você ver estatísticas de todas alas)
4. **Recuperação de senha via email**

---

## Troubleshooting

### Erro: "Usuário não autenticado"
- Verifique se fez login corretamente
- Limpe cache do navegador (Ctrl+Shift+Del)
- Tente fazer logout e login novamente

### Erro: "Permission denied"
- Verifique se as Security Rules foram publicadas
- Verifique se o usuário tem o email correto (com @estaca-embuguacu.com)

### Não aparece nome da ala no Dashboard
- Verifique se o campo "Display Name" foi preenchido no Firebase Auth
- Limpe localStorage e faça login novamente

### Backup não está chegando
- Verifique se o email em wardSettings está correto
- Cloud Function de backup será implementado posteriormente

---

**SISTEMA PRONTO PARA USO! ✅**

Agora cada ala pode acessar o sistema com suas próprias credenciais, e todos os dados ficarão completamente isolados.
