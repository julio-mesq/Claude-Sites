# Studio Brief

Plataforma de briefing interativo para sites. O profissional conduz uma reunião (presencial ou online) em que o cliente escolhe estilo, cores, fontes, páginas e funcionalidades vendo, ao vivo, **“Seu site tomando forma”**. No fim, a **Visão geral do projeto** vira um documento pronto para PDF, JSON ou impressão.

## Como rodar

```bash
cd studio-brief
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck + build de produção em dist/
npm test           # testes unitários (vitest)
npm run test:e2e   # fluxo completo no navegador (Playwright, faz o build sozinho)
```

## O que existe

- **6 telas** guiadas, cada uma com duas das 12 etapas (cliente, objetivos, tipo de site, estilo, cores, tipografia, páginas, funcionalidades, aparência, conteúdo, requisitos técnicos, prazo e prioridades), com progresso, voltar/avançar, *pular*, *ainda não sei* e *quero uma recomendação* (a recomendação só é aplicada após confirmação).
- **Prévia sempre ao lado, em tempo real** (computador e celular), alimentada por nome da loja, cidade, recursos (WhatsApp, carrinho, busca, login), estilo, paleta, fontes, botões, cabeçalho, seções da página inicial e menu móvel. É sempre rotulada como simulação conceitual.
- **Laboratório de cores** com paletas, HEX, combinações sugeridas, tema claro/escuro e verificação de contraste WCAG com correção sob confirmação.
- **Editor de páginas** com renomear, reordenar (arrastar ou botões), página principal, seções por página e mapa de navegação. Para *landing page* a etapa vira seleção de seções.
- **Coerência entre etapas**: marcar “Carrinho” sem a página correspondente, ou coletar dados sem política de privacidade, gera uma sugestão (nunca uma alteração silenciosa).
- **Projetos**: lista com pesquisa, filtro por estado, duplicar, excluir com confirmação e salvamento automático.
- **Modo reunião** (foco no visual, sem anotações privadas nem recursos administrativos) e **modo edição** (anotações e campos complementares).
- **Visão geral** com as 20 seções do briefing, pendências com atalho para resolver, exportar PDF/imprimir (capa com nome ou logotipo do profissional), exportar/importar JSON, copiar resumo e marcar como concluído.

## Dados e limites desta versão

- Tudo fica no **`localStorage` do navegador**. Não há backend, login nem sincronização na nuvem, e a interface avisa isso. Para levar um briefing a outro lugar, use **Exportar JSON**.
- Anotações privadas ficam **fora** do PDF, do JSON e do texto copiado, a menos que o profissional as inclua de propósito.
- O PDF usa o diálogo de impressão do navegador (“Salvar como PDF”).
- **Anexos de arquivos não estão implementados**: o armazenamento local não é confiável para isso. A etapa de conteúdo aceita links (Drive, Dropbox…).
- Integrações citadas nas funcionalidades (pagamentos, frete, CRM, chat, automação) aparecem como **pendentes de configuração**; nenhuma está conectada.

## Arquitetura (`src/`)

| Pasta | Responsabilidade |
| --- | --- |
| `core/types.ts`, `defaults.ts` | Modelo de dados versionado (`schemaVersion`), pronto para trocar o armazenamento por API |
| `core/catalogs.ts` | Tipos de site, estilos, paletas, fontes, páginas, funcionalidades, perguntas técnicas |
| `core/rules.ts` | Dependências entre etapas, recomendações, coerência e pendências |
| `core/theme.ts`, `contrast.ts` | Tokens visuais derivados do projeto e cálculo WCAG |
| `core/validation.ts`, `storage.ts`, `store.tsx` | Normalização/importação segura, persistência e estado global com autosave |
| `core/export.ts` | JSON, texto de resumo e downloads |
| `components/` | UI reutilizável (`ui.tsx`), prévia (`SiteCanvas`, `Previews`), resumo, perfil |
| `steps/` | Uma tela por etapa do briefing |
| `pages/` | Início, boas-vindas, jornada e visão geral |

Para ligar um backend depois, basta implementar a mesma interface de `loadProjects`/`saveProjects` com autenticação e banco, mantendo `normalizeProject` como porta de entrada dos dados.
