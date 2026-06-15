# Changelog - Hub de Iniciativas

Todos os registros de atualizações, novas funcionalidades e correções de bugs deste projeto estão documentados aqui.

---

## [1.0.0] - 2026-06-14

### 🚀 Novas Funcionalidades
* **Base de Conhecimento (Wiki)**:
  * Criação de uma interface técnica completa no estilo GitBook (`/knowledge`) com barra lateral de navegação organizada por categorias/pastas.
  * Suporte para salvar artigos favoritos localmente no navegador (`LocalStorage`).
  * Implementação de uma semente de carga inicial automática ("Carga Inicial") mapeando as rotas internas das APIs de Mississauga com base nos arquivos locais (`api interna.txt`).
* **Busca Textual Completa (Full-Text Search)**:
  * Filtro inteligente na Base de Conhecimento que realiza a busca em profundidade, varrendo não só os títulos das APIs, mas também o **corpo do texto das documentações**, tags e categorias.
* **Importador Remoto TDN / Confluence**:
  * Integração com a API do TDN (Confluence da TOTVS) para carregar páginas de documentação de forma automatizada por meio do `pageId` do documento, com um sanitizador interno que remove tags HTML e converte para texto estruturado limpo.
* **Jolt Playground**:
  * Criação de uma ferramenta interativa e integrada na página de Workflows (`/workflows`) que permite aos desenvolvedores simular e validar transformações de JSON estruturais localmente através de uma engine JOLT escrita puramente em JavaScript (suportando regras de `shift`, `default`, wildcards e substituições de chaves).
* **Temas Neon Customizados**:
  * Adição de seletores de cores primárias e secundárias na página do usuário (`/profile`) com suporte a presets pré-definidos e paleta livre de cores.
  * Injeção dinâmica de variáveis CSS `:root` aplicadas de forma global na interface.
* **Comentários nas Iniciativas**:
  * Adicionado suporte para comentar em postagens do Feed de Iniciativas em tempo real.

### 🎨 Melhorias de Design & Usabilidade
* **Navegação Horizontal (Top Bar)**:
  * Conversão do menu lateral tradicional (sidebar) para um cabeçalho de navegação superior moderno e compacto em resoluções de desktop (telas `1024px` ou superiores).
  * Otimização do contêiner principal para uma largura maior (`max-w-[90rem]`), ampliando o espaço de trabalho horizontal para diagramas Mermaid e editores JSON.
* **Metadados em AI Skills**:
  * Exibição de crachás (*badges*) de alto destaque visual para os prompts contendo: Tipo da Skill, Nível de Impacto de Eficiência, Status de Validação e Objetivos de Negócio.
  * Integração de um contador de cópias (`copyCounter`) atômico incrementado automaticamente a cada clique no botão de copiar o prompt.

### 🐛 Correções de Bugs
* **Correção do Travamento Inicial (ReferenceError)**:
  * Corrigida a falha em que a página inicial renderizava uma tela preta/em branco. O ícone `BookOpen` não estava importado de `lucide-react` no layout do menu e foi adicionado corretamente.
* **Regras de Segurança do Firestore (Rules)**:
  * Adicionada a coleção `/teams` nas regras de segurança, permitindo o fluxo correto de onboarding e criação de times por novos membros.
  * Correção do validador de `photoURL` em `isValidUser` nas regras do Firebase, permitindo que usuários que não tenham foto de perfil cadastrada (string vazia `''`) consigam registrar ou atualizar suas contas normalmente.
