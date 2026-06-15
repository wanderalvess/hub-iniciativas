# Planejamento do Projeto: Hub de Conhecimento e Iniciativas (Hub de Iniciativas)

Este documento contém o mapeamento, a arquitetura e as soluções técnicas adotadas para o **Hub de Iniciativas**, centralizado na área de **V&D (Varejo e Distribuição)**. Ele serve como o guia do projeto e registro de status das entregas.

---

## 📋 Requisitos e Soluções Implementadas

### 1. Construtor e Importador de Workflows (Workflow Builder)
* **Necessidade:** Outras equipes que quiserem usar o hub não podem depender de scripts ou de criar o banco de dados manualmente. Elas precisam de ferramentas na tela para cadastrar ou desenhar o fluxo, ou importar de forma simplificada.
* **Solução Técnica:**
  * **Visualizador de Fluxos:** Linha do tempo dinâmica (stepper) mostrando as etapas do workflow.
  * **Editor Dinâmico:** Uma tela no React onde os usuários adicionam passos de negócios (WTA, Integradores, Sincronizador, Terminais) e editam as rotas, URLs, projetos correspondentes no Firestore.
  * **Importador Rápido por Markdown:** Um campo de texto que recebe a tabela em Markdown (como a do time Mississauga `WORKFLOW_PDVSYNC.md`) e realiza o parser direto no frontend, salvando as rotas em lote (batch write) no Firestore.

### 2. Autenticação de Usuários (Firebase Auth + React Context)
* **Necessidade:** Acesso seguro e identificação de autoria.
* **Solução Técnica:**
  * Login integrado e responsivo com suporte a e-mail/senha e Google Sign-In corporativo.
  * Proteção de rotas via `ProtectedRoute` no React e guarda inteligente baseada em `authStateReady` para evitar deslogamentos aciduais durante recompilação ou refresh da página.
  * Criação automática de perfil padrão e associação ao time `teamId` (ex: `mississauga`) no Firestore.

### 3. Layout Bento Grid de Alta Performance
* **Necessidade:** Interface moderna, limpa e que evite excesso de whitespace das tabelas clássicas de ERPs.
* **Solução Técnica:**
  * Disposição modular baseada em **Bento Grids** utilizando TailwindCSS, Lucide React e Framer Motion.
  * Tema visual premium em Dark Mode com efeitos glassmorphism e glow shadows.

### 4. Repositório de AI Skills, Gems e Prompts de Equipe (Aprimorado)
* **Necessidade:** Mapear e expor prompts específicos da equipe diretamente para IAs em IDEs via MCP (ex: `/revisao-rotas-wsh`), organizados por ciclo de vida e impacto de negócio.
* **Solução Técnica:**
  * Catálogo de prompts homologados com cópia rápida e cadastro de argumentos.
  * Metadados estendidos: classificação por Tipo, Status de validação, Impacto operacional e Objetivo de Negócio.
  * Contador atômico de cópias (`copyCounter`) para auditoria de engajamento do prompt.

### 5. Visibilidade de Iniciativas e Conteúdo (Feed Social + Comentários)
* **Solução Técnica:** Timeline no Dashboard com curtidas e seção de comentários persistidos no Firestore em tempo real por postagem, categorias e busca por tags.

### 6. Compartilhamento de Ambientes (Dashboard de VMs)
* **Solução Técnica:** Dashboard com reserva rápida (check-in/check-out) protegida por proprietário.

### 7. Jolt Playground (Validador de Mapeamentos)
* **Necessidade:** Validar estruturas e transformações de payloads de APIs do Winthor para o PDVSync localmente, sem depender de deploys.
* **Solução Técnica:**
  * Motor de transformação Jolt simplificado implementado puramente em JavaScript rodando no cliente.
  * Interface interativa na página de Workflows contendo editor para Input JSON, Spec Jolt e Output JSON gerado em tempo real com realce de sintaxe.

### 8. Custom Neon Themes (Temas Dinâmicos)
* **Necessidade:** Permitir personalização de marca e cores para diferentes desenvolvedores e squads.
* **Solução Técnica:**
  * Seleção de presets e paleta nativa via color-picker na página de Perfil.
  * Injeção dinâmica de variáveis CSS no `:root` do HTML encapsuladas no layout principal para modificar as bordas, sombras e gradientes de neon dinamicamente.

### 9. Base de Conhecimento (Wiki / Wiki GitBook)
* **Necessidade:** Criar uma central de documentação de alto nível para listar, buscar e cadastrar APIs do time a partir de referências.
* **Solução Técnica:**
  * Interface estilo wiki com navegação por categorias e favoritação rápida no LocalStorage.
  * Busca textual completa (full-text) abrangendo títulos e o corpo do texto de todas as documentações.
  * Carga inicial automatizada mapeando as APIs de `anexos/api interna.txt`.
  * Integrador Confluence/TDN por API scraping (HTML para texto limpo estruturado).

---

## 📐 Modelo de Dados (Firestore)

### Coleção `users`
* `uid` (string, ID do documento)
* `email` (string)
* `displayName` (string)
* `photoURL` (string)
* `teamId` (string)
* `role` (string): `'admin' | 'member'`
* `createdAt` (timestamp)
* `themePrimary` (string): Cor hexadecimal primária do tema customizado (ex: `#6366f1`).
* `themeSecondary` (string): Cor hexadecimal secundária do tema customizado (ex: `#a855f7`).
* `tdnUrl` (string): URL base para chamadas de raspagem de documentações Confluence/TDN.
* `tdnToken` (string): Token de autorização para integração com o TDN.

### Coleção `ai_skills` (Catálogo de Prompts)
* `id` (string)
* `teamId` (string)
* `name` (string)
* `description` (string)
* `promptTemplate` (string)
* `arguments` (array de objetos contendo `name` e `description`)
* `author` (string)
* `updatedAt` (timestamp)
* `type` (string): Categoria do prompt (`'Suporte' | 'Desenvolvimento' | 'Análise' | 'Outro'`).
* `status` (string): Status operacional (`'Ativo' | 'Em Teste' | 'Obsoleto'`).
* `impact` (string): Nível de impacto de eficiência (`'Baixo' | 'Médio' | 'Alto'`).
* `businessGoal` (string): Objetivo de negócios associado ao prompt.
* `copyCounter` (number): Contador cumulativo de cópias realizadas.

### Coleção `workflows`
* `id` (string)
* `teamId` (string)
* `name` (string)
* `systemMaster` (string)
* `integrators` (array de strings)
* `destiny` (string)
* `createdAt` (timestamp)
* `createdBy` (string)

### Coleção `workflow_routes` (Mapeamento de Rotas)
* `id` (string)
* `workflowId` (string)
* `fluxo` (string): ex. "FLUXO-16"
* `nome` (string)
* `urlWta` (string)
* `projetoWta` (string)
* `direcao` (string): `'enviar_pdvsync' | 'enviar_wta' | 'monitor' | 'online_direto'`

### Coleção `knowledge_kb` (Base de Conhecimento / Wiki)
* `id` (string)
* `teamId` (string)
* `title` (string): Título da documentação.
* `content` (string): Conteúdo textual limpo.
* `category` (string): Pasta de agrupamento.
* `tags` (array de strings): Palavras-chave de indexação.
* `author` (string)
* `authorUid` (string)
* `sourceUrl` (string): Link Confluence/TDN de origem.
* `updatedAt` (timestamp)

---

## 📈 Roteiro de Desenvolvimento & Checklist de Validação

### Passo 1: Inicialização e Estrutura React + Tailwind
* [x] Configurar Firebase (Firestore e Authentication).
* [x] Inicializar projeto React + Vite + TailwindCSS.
* [x] Implementar Design System e estilos customizados (Bento Cards, inputs premium).
* [x] Desenvolver `AuthContext` e integração com Firestore.
* [x] Implementar tela de Login (E-mail e Google) com efeito de vidro fosco.
* [x] Criar componente `ProtectedRoute` com tratamento de inicialização assíncrona.

### Passo 3: Componentes e Páginas Bento Box
* [x] Implementar dashboard principal Bento Grid.
* [x] Migrar controle de VMs com check-in/out dinâmico.
* [x] Migrar feed de postagens com sistema de likes, comentários em tempo real e categorias.
* [x] Migrar AI Skills com cópia com um clique, homologação de prompts e metadados detalhados (Tipo, Impacto, Status, Objetivos, Contador de Cópias).
* [x] Desenvolver tela de gerenciamento de perfil `/profile` com seleção de Neon Themes personalizados.

### Passo 4: Workflows de API e Importação
* [x] Criar visualizador de passos macro (stepper) e tabelas com busca rápida.
* [x] Implementar o importador rápido de Markdown baseado em tabela com parser no frontend.
* [x] Implementar gravação em lote (writeBatch) no Firestore para maior performance no deploy das rotas.
* [x] Implementar o Jolt Playground para simulação e teste de conversão de JSON local no navegador.

### Passo 5: Base de Conhecimento e Integração TDN
* [x] Criar Wiki style GitBook com busca textual avançada pesquisando no corpo do documento.
* [x] Adicionar suporte a favoritação local e semente de carga inicial rápida a partir de arquivos.
* [x] Desenvolver importador remoto TDN conectando via credenciais do perfil do usuário e limpando o markup html.

### Passo 6: Servidor MCP e Hospedagem
* [x] Configurar servidor MCP local (Node.js + TS) conectado ao Firestore.
* [x] Criar arquivo `firebase.json` e regras de Hosting.
* [x] Limpeza do frontend Angular antigo (após validação completa do usuário).
