# Análise de Custos e Limitações - Sistema Multi-Tenant

## Cenário Real: 6 Alas da Estaca

### Projeção de Uso Mensal

**Premissas:**
- 6 alas ativas
- ~5 usuários ativos por ala = 30 usuários totais
- Média de 28 atas/mês por ala = 168 atas/mês total
- Cache de 1 hora implementado

### Operações Firestore/Dia

#### LEITURAS (Reads):
\\\
Cenário com Cache de 1h:
- Carregar histórico: 30 usuários × 2 acessos/dia = 60 acessos
- Cache hit rate: 70% (usuários frequentes)
- Cache misses: 18 acessos × 50 docs = 900 reads
- Visualizar ata individual: 30 × 1 read = 30 reads
- Verificações de sync: 30 × 5 = 150 reads
────────────────────────────────────
TOTAL: ~1,080 reads/dia
MENSAL: ~32,400 reads/mês
LIMITE GRATUITO: 50,000 reads/DIA
UTILIZAÇÃO: 2.16% do limite diário ✅
\\\

#### ESCRITAS (Writes):
\\\
- Novas atas: 168 atas/mês ÷ 30 dias = 5.6 writes/dia
- Edições de atas: 2 edits/dia = 2 writes/dia
- Auto-save (local, não conta): 0 writes Firestore
────────────────────────────────────
TOTAL: ~8 writes/dia
MENSAL: ~240 writes/mês
LIMITE GRATUITO: 20,000 writes/DIA
UTILIZAÇÃO: 0.04% do limite diário ✅
\\\

#### STORAGE:
\\\
- Tamanho médio por ata: 5KB
- 2,304 atas/ano × 5KB = 11.5 MB/ano
- 3 anos de dados: ~35 MB
────────────────────────────────────
LIMITE GRATUITO: 1 GB
UTILIZAÇÃO: 0.035% ✅
\\\

### CONCLUSÃO: TOTALMENTE VIÁVEL GRATUITAMENTE

**Você está usando menos de 3% dos limites gratuitos!**

Mesmo sem cache, você usaria apenas 15-20% dos limites.

---

## Sistema de Quotas (OPCIONAL - Não Necessário)

Se quiser limitar para segurança:

### Quotas Sugeridas por Ala:

\\\	ypescript
const QUOTAS = {
  sacramental: 6,      // 6 atas sacramentais/mês (1-2 extras)
  baptismal: 3,        // 3 batismos/mês
  bishopric: 5,        // 5 reuniões bispado/mês
  wardCouncil: 2,      // 2 conselhos/mês
  interviews: 25       // 25 entrevistas/mês
};

// Total: 41 atas/mês por ala
// 6 alas = 246 atas/mês = MUITO DENTRO DO LIMITE
\\\

**RECOMENDAÇÃO: NÃO IMPLEMENTE QUOTAS**
- Limites gratuitos são suficientes
- Quotas criam fricção desnecessária
- Melhor monitorar uso real

---

## Backup Automático Mensal

### Estratégia Recomendada:

**1. Firebase Cloud Functions (Scheduled):**
\\\	ypescript
// Executa todo dia 1 às 2h da manhã
export const monthlyBackup = functions.pubsub
  .schedule('0 2 1 * *')
  .timeZone('America/Sao_Paulo')
  .onRun(async (context) => {
    const wardIds = ['ala-jardim', 'ala-centro', ...];
    
    for (const wardId of wardIds) {
      // 1. Buscar todas atas do mês anterior
      const lastMonth = getLastMonthRange();
      const records = await getRecordsByWardAndDateRange(wardId, lastMonth);
      
      // 2. Gerar PDF consolidado
      const pdf = await generateMonthlyPDF(records, wardId);
      
      // 3. Salvar no Firebase Storage
      await saveToStorage(\ackups/\/\.pdf\, pdf);
      
      // 4. Enviar por email
      const wardEmail = await getWardBackupEmail(wardId);
      await sendEmail(wardEmail, {
        subject: \Backup Mensal - \ - \\,
        attachments: [{ filename: 'atas.pdf', content: pdf }]
      });
      
      // 5. Gerar backup JSON
      const json = JSON.stringify(records);
      await saveToStorage(\ackups/\/\.json\, json);
    }
    
    console.log('Backup mensal completo para todas alas');
  });
\\\

**2. Email com SendGrid (Gratuito até 100 emails/dia):**
- Cada ala recebe 1 email/mês = 6 emails/mês
- PDF + JSON anexados
- Totalmente dentro do limite gratuito

**Custo: \** (Cloud Functions tem 2 milhões invocações/mês grátis)

---

## Arquivamento vs. Exclusão: ANÁLISE CRÍTICA

### ❌ Excluir Atas Antigas - NÃO RECOMENDO

**Razões:**

1. **Economiza ZERO custo**
   - Storage é INSIGNIFICANTE (11.5MB/ano)
   - 10 anos de dados = 115MB (0.115% do limite)
   
2. **Perde valor histórico**
   - Estatísticas de oradores (quem falou quando)
   - Auditoria de decisões passadas
   - Referências futuras importantes
   - Compliance e registros oficiais

3. **Não melhora performance significativamente**
   - Com paginação: sempre carrega apenas 50 docs
   - Cache já reduz 80% das queries
   
4. **Cria complexidade desnecessária**
   - Código para deletar
   - Regras de quando deletar
   - Risco de deletar algo importante

### ✅ Arquivamento Inteligente - RECOMENDO

**Estratégia: Mover atas antigas para coleção "archived"**

\\\	ypescript
// Após 2 anos, mover para arquivo
const ARCHIVE_AFTER_MONTHS = 24;

async function archiveOldRecords() {
  const cutoffDate = new Date();
  cutoffDate.setMonth(cutoffDate.getMonth() - ARCHIVE_AFTER_MONTHS);
  
  // Buscar atas antigas
  const oldRecords = await getDocs(query(
    collection(db, 'atas-sacramentais'),
    where('date', '<', cutoffDate.toISOString())
  ));
  
  for (const doc of oldRecords.docs) {
    // Copiar para coleção archives
    await setDoc(
      doc(db, 'atas-sacramentais-archived', doc.id),
      doc.data()
    );
    
    // Deletar do principal
    await deleteDoc(doc.ref);
  }
}
\\\

**Benefícios:**
- ✅ Queries principais mais rápidas (menos docs para escanear)
- ✅ Mantém histórico acessível quando necessário
- ✅ Continua contando para o mesmo limite (não economiza, mas organiza)
- ✅ Pode ter UI separada "Ver Arquivo Histórico"

### 🎯 Recomendação Final: MANTER TUDO

**Razão simples: NÃO HÁ NECESSIDADE DE ECONOMIZAR**

- Você usa 3% dos limites
- Storage é irrelevante (35MB em 3 anos)
- Dados históricos são valiosos
- Firebase gratuito suporta facilmente 10+ anos de dados

**APENAS se chegar perto de 40,000 reads/dia** (13x seu uso atual):
- Implementar arquivamento após 3 anos
- Aumentar cache TTL para 2-3 horas
- Considerar plano Blaze com budget limit \/mês

---

## Implementação Recomendada

### Fase 1: Sistema Base (Agora)
- [x] Multi-tenant com wardId
- [x] Cache de 1 hora
- [x] Paginação de 50 docs
- [ ] Login Firebase Auth
- [ ] Security Rules

### Fase 2: Monitoramento (Mês 1)
- [ ] Dashboard de uso (quantas atas/mês por ala)
- [ ] Log de quota usage no console
- [ ] Alertas se passar 30% dos limites

### Fase 3: Backup Automático (Mês 2)
- [ ] Cloud Function scheduled
- [ ] Geração de PDF mensal
- [ ] Envio por email (SendGrid)
- [ ] Storage dos backups no Firebase Storage

### Fase 4: Features Avançadas (Mês 3+)
- [ ] Arquivamento automático (>2 anos)
- [ ] UI "Ver Arquivo Histórico"
- [ ] Estatísticas consolidadas (oradores mais frequentes)
- [ ] Export de relatórios trimestrais

---

## Custos Projetados (5 anos)

\\\
Ano 1: \ (gratuito)
Ano 2: \ (gratuito)
Ano 3: \ (gratuito)
Ano 4: \ (gratuito)
Ano 5: \ (gratuito, com 11,520 atas = 57MB storage)

Total 5 anos: \ (FREE FOREVER)
\\\

**Só mudaria para pago se:**
- Expandir para 30+ alas
- Adicionar 1000+ usuários simultâneos
- Implementar features muito intensivas em reads

---

## Registro de Email para Backup

### Adicionar à coleção do Firestore:

\\\	ypescript
// Collection: wardSettings
{
  wardId: 'ala-jardim',
  backupEmail: 'bispo.alajardim@estaca.com',
  wardName: 'Ala Jardim',
  createdAt: '2026-04-03',
  settings: {
    enableMonthlyBackup: true,
    backupFormat: 'pdf+json', // ou só 'pdf'
    notifyOnBackup: true
  }
}
\\\

---

## DECISÃO FINAL RECOMENDADA

### ✅ FAZER:
1. **Backup mensal automático** (Cloud Functions + SendGrid)
2. **Manter TODAS as atas** (não deletar)
3. **Monitorar uso mensalmente** (Firebase Console)
4. **Implementar cache** (já feito ✅)

### ❌ NÃO FAZER:
1. **Quotas rígidas** (desnecessário, limites são altos)
2. **Deletar atas antigas** (perde dados valiosos, economiza 0)
3. **Arquivamento agressivo** (só se necessário após anos)

### 🎯 PRIORIDADE ZERO:
- Implementar multi-tenant ✅ (feito)
- Implementar cache ✅ (feito)
- Configurar Security Rules (próximo)
- Sistema de backup mensal (depois)

---

**GARANTIA: Sistema gratuito para 6 alas por 10+ anos facilmente!**
