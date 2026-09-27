# Conselho de ala — primeira versão

## Iniciar o teste local

Preencha as variáveis listadas em `.env.example` no seu `.env` local. Os PINs e a configuração do Firebase não possuem valores padrão no código. O PIN para criar/excluir atas vem de `VITE_WARD_COUNCIL_ADMIN_PIN`; quando essa variável estiver vazia, utiliza `VITE_DELETE_PIN`. O PIN de ordenação/finalização é `VITE_SACRAMENTAL_PIN`. Na hospedagem, configure esses valores antes de gerar uma nova versão. Execute `npm run verify` para conferir a configuração sem exibir seus valores.

```powershell
npm run dev:conselho
```

Abra <http://127.0.0.1:5173/wardcouncil> e clique em **Criar reunião**. Nesse modo de desenvolvimento, a criação habilita o acesso de teste do bispado. Informe seu nome e sua organização.

O modo local armazena as atas do conselho em `localStorage`, na chave `wardcouncil-local-v2`. Ele não lê nem grava a coleção de conselho do Firebase. Outras áreas do aplicativo não fazem parte deste modo de teste. Os dados persistem neste navegador; outro navegador terá dados separados. O modo local não é ativado no build de produção.

## Roteiro

1. Abra **Editar dados**, informe a data, quem preside e quem dirige; clique em **Salvar**.
2. Use **Sugerir assunto** para registrar título, objetivo, contexto, área, organizações e tempo previsto.
3. Use **Incluir na pauta** e as setas para escolher e ordenar os assuntos. Esses controles exigem acesso do bispado; escolher “Bispado” na identificação não concede esse acesso.
4. Abra **Registrar discussão / decisão**. Registre o resumo e o resultado: decisão, adiamento, necessidade de informações ou encaminhamento ao bispado.
5. Use **Criar designação** dentro do assunto. Informe descrição, responsável e prazo. Também é possível criar uma designação geral.
6. Confira o conteúdo e clique em **Finalizar ata**. A finalização exige dados básicos, encaminhamento em todos os assuntos selecionados e designações com responsável e prazo. O bispado pode reabrir a ata.
7. Abra novamente `/wardcouncil` e crie outra reunião. Use uma data igual ou posterior à anterior. A seção **Acompanhamento anterior** apresenta as designações pendentes.
8. Use **Registrar retorno**, escolha a situação e descreva o resultado. O aplicativo atualiza a ação original e guarda o relato na ata atual, sem copiar a ação.
9. Abra **Visualizar ata** para conferir o registro. No histórico, a busca inclui pauta, decisões, descrição das designações e responsáveis.

Cada formulário tem seu próprio botão **Salvar**. A sincronização ocorre após esse salvamento; o texto em digitação ainda não foi enviado. Quando duas pessoas alteram o mesmo campo, a segunda recebe uma mensagem para revisar a versão atual. Alterações em campos diferentes são combinadas.

Os textos antigos por organização continuam visíveis na seção **Registros anteriores por organização**. As ações antigas continuam disponíveis; ao editar ou finalizar, complete responsável e prazo. Atas com acompanhamentos registrados não podem ser excluídas, para preservar os vínculos entre reuniões.

## Verificações automatizadas

```powershell
npm run test:conselho
npx tsc --noEmit
npx vite build
```

Com o servidor local ativo e Google Chrome instalado:

```powershell
node tests/wardCouncil.browser.mjs
```

O teste de navegador usa um perfil temporário separado e bloqueia requisições HTTPS externas. Verifica criação, seleção e ordenação, conflito entre abas, restrição dos controles do bispado, decisões, designações, finalização, navegação, persistência, acompanhamento na reunião seguinte e largura de celular. `CHROME_PATH` permite indicar outro caminho do executável do Chrome.

## Limites da validação

- A lógica, o build e o fluxo local foram verificados. As transações com o Firebase real não foram exercitadas neste teste.
- O controle do bispado utiliza a sessão de PIN já existente no aplicativo. Ele não substitui permissões individuais nas regras do Firestore.
- O comando geral de lint do repositório não possui configuração do ESLint. As regras de hooks foram verificadas separadamente nos novos componentes.
