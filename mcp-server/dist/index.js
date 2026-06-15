"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const db_js_1 = require("./db.js");
const server = new index_js_1.Server({
    name: 'flexihub-mcp-server',
    version: '1.0.0'
}, {
    capabilities: {
        tools: {},
        prompts: {}
    }
});
// ==========================================
// PROTOCOLO DE TOOLS (FERRAMENTAS)
// ==========================================
server.setRequestHandler(types_js_1.ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: 'get_active_initiatives',
                description: 'Retorna a lista de iniciativas e postagens ativas no feed da equipe Mississauga.',
                inputSchema: {
                    type: 'object',
                    properties: {}
                }
            },
            {
                name: 'check_vm_availability',
                description: 'Retorna a disponibilidade de VMs e quem está utilizando cada uma no momento.',
                inputSchema: {
                    type: 'object',
                    properties: {}
                }
            },
            {
                name: 'get_workflow_routes',
                description: 'Busca as rotas de API mapeadas no workflow da equipe Mississauga.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        workflowId: { type: 'string', description: 'ID do workflow (ex: wsh-pdvsync)' }
                    },
                    required: ['workflowId']
                }
            },
            {
                name: 'post_to_team_feed',
                description: 'Cria uma nova postagem ou notificação no feed do time.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        title: { type: 'string', description: 'Título da postagem' },
                        content: { type: 'string', description: 'Conteúdo principal' },
                        category: { type: 'string', enum: ['ideia', 'iniciativa', 'duvida', 'link'], description: 'Categoria' }
                    },
                    required: ['title', 'content', 'category']
                }
            }
        ]
    };
});
server.setRequestHandler(types_js_1.CallToolRequestSchema, async (request) => {
    if (!db_js_1.db) {
        throw new types_js_1.McpError(types_js_1.ErrorCode.InternalError, 'Banco Firestore não está inicializado.');
    }
    const { name, arguments: args } = request.params;
    try {
        switch (name) {
            case 'get_active_initiatives': {
                const snapshot = await db_js_1.db.collection('feed')
                    .where('teamId', '==', 'mississauga')
                    .orderBy('createdAt', 'desc')
                    .limit(10)
                    .get();
                const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                return {
                    content: [{ type: 'text', text: JSON.stringify(posts, null, 2) }]
                };
            }
            case 'check_vm_availability': {
                const snapshot = await db_js_1.db.collection('environments')
                    .where('teamId', '==', 'mississauga')
                    .get();
                const envs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                return {
                    content: [{ type: 'text', text: JSON.stringify(envs, null, 2) }]
                };
            }
            case 'get_workflow_routes': {
                const wfId = args?.workflowId;
                const snapshot = await db_js_1.db.collection('workflow_routes')
                    .where('workflowId', '==', wfId)
                    .get();
                const routes = snapshot.docs.map(doc => doc.data());
                return {
                    content: [{ type: 'text', text: JSON.stringify(routes, null, 2) }]
                };
            }
            case 'post_to_team_feed': {
                const { title, content, category } = args;
                const newPost = {
                    title,
                    content,
                    category,
                    status: 'planejado',
                    tags: ['AI-Agent'],
                    author: 'FlexiHub AI Agent',
                    authorUid: 'mcp-agent-system',
                    teamId: 'mississauga',
                    likes: 0,
                    likedBy: [],
                    createdAt: new Date()
                };
                const docRef = await db_js_1.db.collection('feed').add(newPost);
                return {
                    content: [{ type: 'text', text: `Postagem adicionada com sucesso. ID: ${docRef.id}` }]
                };
            }
            default:
                throw new types_js_1.McpError(types_js_1.ErrorCode.MethodNotFound, `Tool desconhecida: ${name}`);
        }
    }
    catch (error) {
        return {
            content: [{ type: 'text', text: `Erro ao executar a tool: ${error.message}` }],
            isError: true
        };
    }
});
// ==========================================
// PROTOCOLO DE PROMPTS (AI SKILLS)
// ==========================================
server.setRequestHandler(types_js_1.ListPromptsRequestSchema, async () => {
    if (!db_js_1.db)
        return { prompts: [] };
    try {
        const snapshot = await db_js_1.db.collection('ai_skills')
            .where('teamId', '==', 'mississauga')
            .get();
        const prompts = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                name: doc.id, // O ID do documento é o identificador do prompt (ex: revisao-rotas-wsh)
                description: data.description || 'Prompt da equipe Mississauga',
                arguments: data.arguments || []
            };
        });
        return { prompts };
    }
    catch (error) {
        return { prompts: [] };
    }
});
server.setRequestHandler(types_js_1.GetPromptRequestSchema, async (request) => {
    if (!db_js_1.db) {
        throw new types_js_1.McpError(types_js_1.ErrorCode.InternalError, 'Banco Firestore não está inicializado.');
    }
    const { name: promptId, arguments: userArgs } = request.params;
    try {
        const docRef = db_js_1.db.collection('ai_skills').doc(promptId);
        const docSnap = await docRef.get();
        if (!docSnap.exists) {
            throw new types_js_1.McpError(types_js_1.ErrorCode.InvalidRequest, `Prompt não encontrado: ${promptId}`);
        }
        const data = docSnap.data();
        let promptText = data.promptTemplate;
        // Substituir argumentos no template (ex: {{codigo}})
        if (userArgs) {
            for (const [key, value] of Object.entries(userArgs)) {
                promptText = promptText.replace(new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g'), value);
            }
        }
        return {
            description: data.description,
            messages: [
                {
                    role: 'user',
                    content: {
                        type: 'text',
                        text: promptText
                    }
                }
            ]
        };
    }
    catch (error) {
        throw new types_js_1.McpError(types_js_1.ErrorCode.InternalError, `Erro ao obter prompt: ${error.message}`);
    }
});
// Inicialização do servidor MCP
async function run() {
    const transport = new stdio_js_1.StdioServerTransport();
    await server.connect(transport);
    console.error('Servidor MCP do FlexiHub rodando via STDIO.');
}
run().catch(console.error);
