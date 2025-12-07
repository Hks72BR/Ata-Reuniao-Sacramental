# Guia de Instalação - Ata Sacramental App

## 📦 Passo a Passo Completo

### 1. Pré-requisitos

Certifique-se de ter instalado:
- **Node.js** (versão 18 ou superior) - [Download](https://nodejs.org/)
- **npm** (vem com Node.js)

Verifique a instalação:
```bash
node --version
npm --version
```

### 2. Instalar Dependências

Abra o PowerShell na pasta do projeto e execute:

```bash
cd "c:\Users\higor\Desktop\Ata Sacramental app"
npm install
```

Isso instalará todas as dependências listadas no `package.json`:
- React e React DOM
- TypeScript
- Vite (build tool)
- Tailwind CSS
- Wouter (roteamento)
- Lucide React (ícones)
- Sonner (notificações)
- E outras...

### 3. Executar em Desenvolvimento

Após a instalação, inicie o servidor de desenvolvimento:

```bash
npm run dev
```

O aplicativo abrirá automaticamente em `http://localhost:3000`

### 4. Build para Produção

Para criar uma versão otimizada:

```bash
npm run build
```

Os arquivos otimizados estarão na pasta `dist/`

### 5. Testar Build de Produção

Para testar o build localmente:

```bash
npm run preview
```

## 🔧 Solução de Problemas

### Erro: "Cannot find module"

**Solução:**
```bash
rm -rf node_modules
npm install
```

### Erro: Port 3000 já está em uso

**Solução:** Edite `vite.config.ts` e mude a porta:
```typescript
server: {
  port: 3001, // Mude para outra porta
}
```

### Erro: TypeScript

**Solução:** Certifique-se que o TypeScript está instalado:
```bash
npm install -D typescript
```

## 📱 Instalar como PWA

Após executar o app no navegador:

1. **Chrome/Edge:** Clique no ícone de instalação (+) na barra de endereço
2. **Firefox:** Menu → Instalar
3. **Safari:** Compartilhar → Adicionar à Tela Inicial

## 🎯 Próximos Passos

Após a instalação bem-sucedida:

1. ✅ Teste criar uma nova ata
2. ✅ Salve e verifique no histórico
3. ✅ Teste a exportação
4. ✅ Teste offline (desconecte a internet)
5. ✅ Delete os arquivos antigos (veja ARQUIVOS_ANTIGOS.md)

## 💡 Dicas

- Use `Ctrl + C` no terminal para parar o servidor
- Use `npm run lint` para verificar erros de código
- O app salva automaticamente no localStorage
- Dados são persistidos no IndexedDB

## 📞 Suporte

Se encontrar problemas:

1. Verifique se Node.js está instalado
2. Delete `node_modules` e reinstale
3. Verifique se a porta 3000 está disponível
4. Consulte o README.md para mais informações

---

Bom desenvolvimento! 🚀
