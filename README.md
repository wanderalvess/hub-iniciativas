# Hub de Iniciativas - Central de Iniciativas, Workflows & AI Skills

Bem-vindo ao **Hub de Iniciativas**, o portal de operações corporativo unificado projetado para times de tecnologia. O sistema oferece visibilidade sobre iniciativas em andamento, controle sobre o uso de servidores e ambientes de teste, documentação visual interativa de workflows/APIs e compartilhamento de prompts inteligentes (AI Skills).

A plataforma foi inteiramente reescrita utilizando uma arquitetura moderna e responsiva de **Bento Grid** com temas escuros e glassmorphism.

---

## 📂 Estrutura do Projeto

O repositório está organizado em duas partes principais:

*   **`react-app/`**: O frontend moderno em **React 18** construído com **Vite**, **TailwindCSS** e **Framer Motion**, integrado ao **Firebase (Auth & Firestore)** de forma reativa e offline.
*   **`mcp-server/`**: Servidor **Model Context Protocol (MCP)** em **Node.js & TypeScript** que atua de forma autônoma para expor os dados e rotas do Firestore diretamente para IDEs ou agentes de IA externos (como Cursor, Claude Desktop e VS Code).

---

## 🛠️ Requisitos Prévios

Antes de rodar as aplicações, certifique-se de possuir instalado em sua máquina:
*   [Node.js](https://nodejs.org/) (versão LTS recomendada: v18 ou v20).
*   [Firebase CLI](https://firebase.google.com/docs/cli) (caso precise fazer novos deploys de Hosting ou regras de segurança).

---

## 💻 1. Executando o Frontend (React + Vite)

A aplicação do cliente se conecta ao Firestore em tempo real e possui suporte completo a cache local para funcionamento em rede offline/instável.

### Passos para inicialização local:

1.  Acesse o diretório do frontend:
    ```bash
    cd react-app
    ```
2.  Instale todas as dependências do projeto (caso tenha incompatibilidades com dependências antigas do ecossistema, use `--legacy-peer-deps`):
    ```bash
    npm install
    ```
3.  Inicie o servidor de desenvolvimento local:
    ```bash
    npm run dev
    ```
    *A aplicação ficará disponível em `http://localhost:4200`.*



## 🤖 2. Executando o Servidor MCP

O servidor MCP permite que assistentes de inteligência artificial de desenvolvimento consigam realizar leituras ou disparar ações no Hub de Iniciativas.

### Ferramentas (Tools) disponíveis no Servidor MCP:
*   `get_active_initiatives`: Obtém as postagens recentes do Feed do time.
*   `check_vm_availability`: Checa o status e o usuário ativo de cada VM cadastrada.
*   `get_workflow_routes`: Retorna a lista detalhada de mapeamento de rotas de um Workflow pelo ID.
*   `post_to_team_feed`: Permite ao agente criar uma nova publicação no feed diretamente por terminal ou chat da IDE.

### Passos para compilação local:

1.  Acesse a pasta do servidor MCP:
    ```bash
    cd mcp-server
    ```
2.  Instale as dependências:
    ```bash
    npm install
    ```
3.  Realize a compilação do TypeScript para JavaScript (gerando a pasta `dist` necessária para a execução do MCP):
    ```bash
    npm run build
    ```

### Como Configurar no Cursor IDE:

1. Abra o **Cursor**.
2. Vá em **Settings** (ícone de engrenagem no canto superior direito) -> **Features** -> **MCP**.
3. Clique em **+ Add New MCP Server**.
4. Configure os seguintes campos:
   * **Name**: `hub-iniciativas`
   * **Type**: `command`
   * **Command**: `node C:/Users/wanderson.alves/projetosWanderson/workflow/mcp-server/dist/index.js`
5. Clique em **Save**. O status deve ficar verde (Active). Agora você pode pedir no chat do Cursor coisas como: *"Liste quais VMs estão em uso"* ou *"Poste no feed que as APIs foram atualizadas"*.

### Como Configurar no Claude Desktop:

Para configurar este servidor local como um assistente ativo em seu Claude Desktop, adicione a chave abaixo no seu arquivo de configuração (`config.json`):

```json
{
  "mcpServers": {
    "hub-iniciativas": {
      "command": "node",
      "args": ["C:/Users/wanderson.alves/projetosWanderson/workflow/mcp-server/dist/index.js"]
    }
  }
}
```

### Como Configurar no Antigravity:

O Antigravity (assistente de IA avançado da DeepMind) consome o arquivo de configuração do MCP global localizado no diretório de dados da aplicação (`mcp_config.json`). Para ativá-lo:
1. Abra o arquivo `C:/Users/wanderson.alves/.gemini/antigravity/mcp_config.json` (ou crie-o se não existir).
2. Adicione ou mescle a seguinte entrada de servidor MCP:
```json
{
  "mcpServers": {
    "hub-iniciativas": {
      "command": "node",
      "args": ["C:/Users/wanderson.alves/projetosWanderson/workflow/mcp-server/dist/index.js"]
    }
  }
}
```

### Como Configurar no GitHub Copilot:

Para integrar no GitHub Copilot dentro do VS Code ou ambientes compatíveis com extensões MCP de terceiros:
1. Instale a extensão de suporte a servidores MCP no VS Code (ex: *MCP Client for VS Code*).
2. Adicione a configuração da ferramenta apontando para a execução local:
   * **Nome**: `hub-iniciativas`
   * **Tipo**: `command`
   * **Comando**: `node C:/Users/wanderson.alves/projetosWanderson/workflow/mcp-server/dist/index.js`
3. O Copilot passará a ter acesso às ferramentas do banco de dados das VMs, feed de iniciativas e rotas do time Mississauga.

---

## 🔒 Regras de Segurança & Isolamento

*   **Identificação por Time (`teamId`)**: Toda informação criada no sistema é vinculada ao ID de time do usuário cadastrado. Isso isola completamente a visibilidade de rotas, VMs e prompts entre diferentes equipes (como o squad `mississauga`).
*   **Permissões de Escrita**: Botões de edição e exclusão de itens em telas como o Feed e AI Skills somente são renderizados para os respectivos autores da postagem (`authorUid === user.uid`), fornecendo segurança básica contra alterações acidentais de outros membros.
