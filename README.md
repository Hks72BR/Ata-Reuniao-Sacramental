# 📖 Ata Sacramental App

> Aplicativo PWA para registro de atas de reuniões sacramentais da Igreja de Jesus Cristo dos Santos dos Últimos Dias

## ✨ Características

- 📱 **PWA (Progressive Web App)** - Funciona offline
- 💾 **IndexedDB** - Armazenamento local persistente
- 🎨 **Design Espiritual** - Minimalismo contemporâneo com cores navy e dourado
- 📝 **Formulário Completo** - Todos os campos necessários para uma ata
- 📊 **Histórico** - Consulte e gerencie atas anteriores
- 💿 **Exportação** - Baixe atas em formato texto
- ✅ **Validação** - Validação robusta de campos
- 🌐 **Offline-First** - Funciona mesmo sem internet

## 🏗️ Estrutura do Projeto

```
ata-sacramental-app/
├── public/                  # Arquivos públicos
│   ├── sw.js               # Service Worker
│   └── manifest.json       # Manifesto PWA
├── src/
│   ├── components/         # Componentes reutilizáveis
│   │   ├── FormField.tsx
│   │   └── SupportAndReleaseSection.tsx
│   ├── pages/             # Páginas da aplicação
│   │   ├── Home.tsx       # Formulário de entrada
│   │   ├── History.tsx    # Listagem de atas
│   │   └── View.tsx       # Visualização de ata
│   ├── lib/               # Utilitários e serviços
│   │   ├── db.ts          # IndexedDB service
│   │   └── utils.ts       # Funções utilitárias
│   ├── hooks/             # React hooks customizados
│   │   └── useServiceWorker.ts
│   ├── types/             # Definições TypeScript
│   │   └── index.ts
│   ├── App.tsx            # Componente principal
│   ├── main.tsx           # Entry point
│   └── index.css          # Estilos globais
├── index.html             # HTML principal
├── package.json           # Dependências
├── tsconfig.json          # Configuração TypeScript
├── vite.config.ts         # Configuração Vite
└── README.md              # Este arquivo
```

## 🚀 Como Usar

### Configuração de Senhas

**IMPORTANTE:** Configure as senhas personalizadas antes de usar em produção.

1. **Para desenvolvimento local:**
   ```bash
   # Copie o arquivo de exemplo
   cp .env.example .env
   
   # Edite o arquivo .env e configure suas senhas de 4 dígitos
   # VITE_SACRAMENTAL_PIN=2026
   # VITE_BAPTISMAL_PIN=2025
   ```

2. **Para produção no Vercel:**
   - Acesse: Vercel Dashboard > Settings > Environment Variables
   - Adicione:
     - `VITE_SACRAMENTAL_PIN` = sua senha de 4 dígitos (ex: `2026`)
     - `VITE_BAPTISMAL_PIN` = sua senha de 4 dígitos (ex: `2025`)
   - Selecione: Production, Preview, Development
   - **Faça Redeploy** após configurar

   📖 Veja o guia detalhado em [SEGURANCA.md](SEGURANCA.md)
   🔧 Problemas? Consulte [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

### Instalação

1. **Instale as dependências:**
```bash
npm install
```

### Desenvolvimento

2. **Inicie o servidor de desenvolvimento:**
```bash
npm run dev
```

O aplicativo estará disponível em `http://localhost:3000`

### Build para Produção

3. **Gere o build de produção:**
```bash
npm run build
```

4. **Visualize o build:**
```bash
npm run preview
```

## 📋 Funcionalidades Principais

### 1. Criar Nova Ata
- Preencha todos os campos do formulário
- Validação automática em tempo real
- Salve automaticamente no navegador

### 2. Visualizar Histórico
- Veja todas as atas salvas
- Busque por data
- Veja estatísticas

### 3. Editar Ata
- Carregue uma ata existente
- Edite e salve novamente

### 4. Exportar Ata
- Baixe em formato texto
- Formatação profissional

### 5. Offline
- Funciona sem internet
- Sincronização automática quando online

## 🎨 Design System

### Cores
- **Primary (Navy):** #1e3a5f - Confiança e espiritualidade
- **Accent (Dourado):** #d4a574 - Reverência e sagrado
- **Background:** Branco - Clareza e pureza

### Tipografia
- **Títulos:** Playfair Display (serif)
- **Corpo:** Poppins (sans-serif)

## 🔧 Tecnologias Utilizadas

- **React 18** - Framework UI
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Estilos
- **shadcn/ui** - Componentes
- **IndexedDB** - Banco de dados local
- **Wouter** - Roteamento
- **Sonner** - Notificações toast
- **Lucide React** - Ícones

## 📝 Estrutura de Dados

```typescript
interface SacramentalRecord {
  id?: string;
  date: string;
  presidedBy: string;
  directedBy: string;
  recognitions: string;
  pianist: string;
  conductor: string;
  receptionist: string;
  announcements: string;
  firstHymn: string;
  firstPrayer: string;
  supportAndRelease: SupportAndReleaseItem[];
  sacramentalHymn: string;
  firstSpeaker: string;
  secondSpeaker: string;
  intermediateHymn: string;
  lastSpeaker: string;
  lastHymn: string;
  lastPrayer: string;
  createdAt: string;
  updatedAt: string;
  status: 'draft' | 'completed' | 'archived';
}
```

## 🛠️ Melhorias Futuras

### Fase 1 (Implementado) ✅
- [x] Estrutura de pastas organizada
- [x] Validação completa de formulário
- [x] Funções utilitárias centralizadas
- [x] TypeScript strict mode
- [x] Imports corrigidos

### Fase 2 (Próximos Passos)
- [x] Geração de PDF profissional
- [x] Busca avançada ( implementado busca por datas)
- [x] Tema escuro completo otimizado
- [x] Loading states e skeleton loaders

### Fase 3 (Futuro)
- [ ] Testes automatizados (Vitest)
- [x] Deploy diretamete no VERCEL sincronizado com repo no Github sem a necessidade de workflow CI/CD

### Fase 4 (Opcional)
- [x] Backend/Firebase
- [x] Sincronização na nuvem
- [x] Autenticação
- [x] Compartilhamento de atas

## 📄 Licença

Este projeto é de código aberto e está disponível para uso pela comunidade SUD.

## 👨‍💻 Desenvolvimento

Desenvolvido com reverência e dedicação para servir à comunidade da Igreja de Jesus Cristo dos Santos dos Últimos Dias.

---

**Versão:** 1.0.0  
**Data:** Dezembro 2025
