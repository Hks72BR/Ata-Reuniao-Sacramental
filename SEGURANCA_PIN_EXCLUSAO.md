# 🔐 Sistema de PIN de Exclusão - Documentação

## Visão Geral

Foi implementado um **PIN de Exclusão** como camada adicional de segurança para prevenir exclusões acidentais ou não autorizadas de atas no sistema.

---

## 🎯 Objetivo

Proteger o banco de dados contra exclusões acidentais, especialmente ao liberar acesso para mais pessoas no sistema.

---

## 🛡️ Proteção em 3 Camadas

Toda exclusão de ata passa por **3 barreiras de segurança**:

### 1️⃣ Confirmação Visual
- Dialog nativo do navegador com mensagem clara
- "Tem certeza que deseja deletar esta ata? Esta ação não pode ser desfeita."

### 2️⃣ PIN de Exclusão (NOVA FUNCIONALIDADE)
- Modal dedicado solicitando PIN de 4 dígitos
- PIN configurado via variável de ambiente `VITE_DELETE_PIN`
- Design visual destacado com ícone de lixeira e avisos em vermelho
- Mostra a data da ata que será excluída
- Validação em tempo real (4 dígitos numéricos)

### 3️⃣ Identificação do Usuário
- Modal solicitando nome completo de quem está excluindo
- Registra no toast de sucesso: "✅ Ata deletada por NOME"
- *(Nota: Futuramente pode ser salvo em auditoria)*

---

## ⚙️ Configuração

### Desenvolvimento Local

1. Crie/edite o arquivo `.env`:
```bash
VITE_DELETE_PIN=9999
```

2. Reinicie o servidor:
```bash
npm run dev
```

### Produção (Vercel)

1. Acesse: **Vercel Dashboard → Settings → Environment Variables**

2. Adicione a variável:
   - **Name:** `VITE_DELETE_PIN`
   - **Value:** `0000` (seu PIN de 4 dígitos)
   - **Environments:** Production, Preview, Development

3. Faça **Redeploy** do projeto

---

## 🔑 Gerenciamento de PINs

### PINs Atuais no Sistema

| PIN | Finalidade | Configuração | Fallback |
|-----|-----------|--------------|----------|
| `VITE_SACRAMENTAL_PIN` | Acesso Atas Sacramentais | Variável ambiente | `2026` |
| `VITE_DELETE_PIN` | Exclusão de TODAS as atas | Variável ambiente | `9999` |
| *Batismal* | Acesso Atas Batismais | Hardcoded | `2015` |

### ⚠️ Recomendações de Segurança

1. **Use PINs diferentes** para cada finalidade
2. **PIN de exclusão** deve ser conhecido apenas por administradores
3. **Altere periodicamente** os PINs (a cada 3-6 meses)
4. **Nunca compartilhe** o PIN de exclusão em mensagens/emails
5. **Documente** quem tem acesso ao PIN de exclusão

---

## 📝 Fluxo de Exclusão

```
Usuário clica em "Deletar"
        ↓
[1] Confirmação nativa do navegador
        ↓ (confirma)
[2] Modal de PIN de Exclusão aparece
        ↓ (digita PIN correto)
[3] Modal de Identificação de Usuário
        ↓ (digita nome)
Ata é excluída permanentemente
        ↓
Toast: "✅ Ata deletada por FULANO"
```

---

## 🎨 Interface do PIN de Exclusão

### Elementos Visuais
- **Cabeçalho vermelho** com ícone de lixeira
- **Aviso de atenção** em fundo amarelo com ⚠️
- **4 campos** para dígitos do PIN
- **Data da ata** a ser excluída (para confirmação visual)
- **Mensagem de erro** em vermelho caso PIN incorreto
- **Animação shake** quando PIN está errado
- **Auto-focus** no primeiro campo ao abrir

### Comportamento
- ✅ Aceita apenas números (0-9)
- ✅ Auto-avança para próximo campo ao digitar
- ✅ Backspace volta para campo anterior
- ✅ Suporta colar PIN completo (Ctrl+V)
- ✅ Validação automática ao completar 4 dígitos
- ✅ Reset automático após erro

---

## 🧪 Testando

### Teste 1: PIN Correto
1. Tente deletar uma ata
2. Confirme no dialog
3. Digite o PIN correto (ex: `9999`)
4. Digite seu nome
5. ✅ Ata deve ser excluída

### Teste 2: PIN Incorreto
1. Tente deletar uma ata
2. Confirme no dialog
3. Digite um PIN errado (ex: `1234`)
4. ❌ Deve mostrar erro: "PIN incorreto! Acesso negado."
5. Campos resetam para tentar novamente

### Teste 3: Cancelamento
1. Tente deletar uma ata
2. Confirme no dialog
3. Clique em "Cancelar" no modal de PIN
4. ✅ Nada deve ser excluído

---

## 🔧 Arquivos Modificados

### Novos Arquivos
- `src/components/DeletePinModal.tsx` - Modal de PIN de exclusão

### Arquivos Modificados
- `src/lib/auth.ts` - Adicionado DELETE_PIN e validação
- `src/pages/History.tsx` - Integrado DeletePinModal
- `src/pages/baptismal/BaptismalHistory.tsx` - Integrado DeletePinModal
- `src/pages/bishopric/BishopricHistory.tsx` - Integrado DeletePinModal
- `src/pages/wardcouncil/WardCouncilHistory.tsx` - Integrado DeletePinModal
- `.env.example` - Documentado VITE_DELETE_PIN

---

## 📊 Aplicação

O PIN de exclusão protege a exclusão de:
- ✅ Atas Sacramentais
- ✅ Atas Batismais
- ✅ Atas de Reunião de Bispado
- ✅ Atas de Conselho de Ala

**Totalmente centralizado** - Um único PIN protege todo o sistema.

---

## 🚀 Próximos Passos (Opcional)

### Melhorias Futuras Sugeridas

1. **Auditoria Completa**
   - Salvar log de quem excluiu e quando
   - Tabela separada de exclusões

2. **Soft Delete**
   - Não deletar permanentemente
   - Marcar como "arquivado/deletado"
   - Permitir recuperação em 30 dias

3. **Níveis de Permissão**
   - Admin (pode tudo)
   - Editor (criar/editar)
   - Leitor (apenas visualizar)

4. **Rate Limiting para Exclusão**
   - Bloquear após X tentativas de PIN errado
   - Lockout de 15 minutos

5. **Notificações**
   - Email quando uma ata é excluída
   - Registro em Firebase Functions

---

## ❓ FAQ

**P: O que acontece se eu esquecer o PIN de exclusão?**
R: Você pode alterar a variável `VITE_DELETE_PIN` no Vercel ou `.env` local e fazer redeploy.

**P: O PIN de exclusão expira?**
R: Não, ele permanece o mesmo até você alterá-lo manualmente.

**P: Posso ter PINs diferentes para cada tipo de ata?**
R: Atualmente não, mas pode ser implementado se necessário.

**P: O PIN é armazenado com segurança?**
R: Sim, apenas a validação ocorre no cliente. Em produção, considere implementar validação no servidor (Firebase Functions).

**P: E se alguém ver o PIN no código fonte?**
R: O PIN vem de variável de ambiente, não está no código. No entanto, é validado no cliente, então é recomendável implementar validação server-side no futuro.

---

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique se `VITE_DELETE_PIN` está configurado
2. Verifique se fez redeploy após adicionar a variável
3. Teste no ambiente de desenvolvimento primeiro
4. Em caso de emergência, use o fallback `9999` (desenvolvimento)

---

**Documentação criada em:** 11/01/2026  
**Versão:** 1.0  
**Autor:** Sistema de Atas Sacramentais
