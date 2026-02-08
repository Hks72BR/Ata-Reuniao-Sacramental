# Regras de Segurança do Firestore

## ⚠️ IMPORTANTE: Configure estas regras no Firebase Console

Acesse o [Firebase Console](https://console.firebase.google.com/) → Seu Projeto → Firestore Database → Regras

Cole as regras abaixo:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    // Atas Sacramentais
    match /atas-sacramentais/{recordId} {
      allow read, write: if true;
    }
    
    // Atas de Conselho de Ala
    match /atas-conselho-ala/{recordId} {
      allow read, write: if true;
    }
    
    // Atas Batismais
    match /atas-batismais/{recordId} {
      allow read, write: if true;
    }
    
    // Atas do Bispado
    match /atas-bispado/{recordId} {
      allow read, write: if true;
    }
    
    // Entrevistas do Bispado (NOVA COLEÇÃO)
    match /entrevistas-bispado/{recordId} {
      allow read, write: if true;
    }
  }
}
```

## 📝 Observações

- Estas regras permitem leitura e escrita pública para facilitar o desenvolvimento
- **Em produção**, considere adicionar autenticação:
  ```javascript
  allow read, write: if request.auth != null;
  ```

## 🚀 Como Aplicar

1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Selecione seu projeto
3. Vá em **Firestore Database**
4. Clique na aba **Regras** (Rules)
5. Cole o código acima
6. Clique em **Publicar** (Publish)

## ✅ Teste

Após publicar as regras, tente salvar uma entrevista novamente no sistema.
