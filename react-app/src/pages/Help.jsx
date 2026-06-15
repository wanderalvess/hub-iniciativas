import React, { useEffect, useState } from 'react';
import BentoCard from '../components/BentoCard';
import UserAvatar from '../components/UserAvatar';
import { useAuth } from '../context/AuthContext';
import { listenAuditLogs } from '../services/firestore';
import { 
  HelpCircle, 
  BookOpen, 
  Cpu, 
  Server, 
  GitBranch, 
  MessageSquare, 
  Users, 
  Terminal, 
  Layers, 
  ShieldCheck, 
  ChevronRight,
  Info,
  Clock
} from 'lucide-react';

const Help = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    if (!user?.teamId) return;
    const unsub = listenAuditLogs(user.teamId, (data) => {
      setLogs(data.slice(0, 10)); // Mostrar os 10 mais recentes
    });
    return () => unsub();
  }, [user?.teamId]);

  const systemModules = [
    {
      title: 'Feed de Iniciativas',
      icon: MessageSquare,
      description: 'Centralizador de ideias, iniciativas e discussões da equipe. Permite registrar o que está sendo planejado ou executado, além de comentar, curtir e acompanhar postagens separadas por time.',
      actions: ['Criar postagem com título, descrição, categoria e tags', 'Curtir postagens de outros membros', 'Adicionar e ver comentários nas postagens em tempo real', 'Editar ou excluir suas próprias postagens']
    },
    {
      title: 'Ambientes / VMs',
      icon: Server,
      description: 'Gerenciador de ambientes virtuais e máquinas de teste do time. Facilita o controle de uso para evitar conflitos de deploy.',
      actions: ['Cadastrar novas máquinas informando nome, IP e descrição', 'Reservar uma máquina (check-in) ou liberá-la (check-out)', 'Editar metadados ou excluir máquinas obsoletas']
    },
    {
      title: 'Workflows de APIs',
      icon: GitBranch,
      description: 'Mapeamento visual e técnico de integrações de API. Inclui a ferramenta Jolt Playground para testes locais de transformações JSON estruturais.',
      actions: [
        'Cadastrar novos workflows principais (Master, Origem, Destino, Integradores)',
        'Importar rotas em lote via Markdown',
        'Visualização Mermaid interativa gerada automaticamente das rotas',
        'Jolt Playground: Validar mapeamento de payloads JSON direto no navegador'
      ]
    },
    {
      title: 'AI Skills & Prompts',
      icon: Cpu,
      description: 'Catálogo de templates de prompts homologados, com metadados de ciclo de vida e controle de impacto para engenharia de prompt avançada.',
      actions: [
        'Cadastrar novas AI Skills especificando nome, descrição, template e argumentos',
        'Visualizar metadados completos (Tipo, Impacto, Status, Objetivo de Negócio)',
        'Copiar templates com preenchimento dinâmico de parâmetros',
        'Contador automático de cópias para medir o engajamento de cada Skill'
      ]
    },
    {
      title: 'Base de Conhecimento (Wiki)',
      icon: BookOpen,
      description: 'Centralizador de documentações técnicas e guias no estilo wiki/GitBook, integrado com busca textual em profundidade e importação automatizada do TDN.',
      actions: [
        'Carga inicial das APIs do Mississauga a partir de arquivo de anexos',
        'Busca textual completa pesquisando dentro do corpo/texto das documentações',
        'Salvar artigos favoritos localmente no navegador',
        'Importador Confluence/TDN por ID da página com conversão para texto estruturado'
      ]
    }
  ];

  const mcpInfo = {
    title: 'Model Context Protocol (MCP)',
    subtitle: 'Integração de Agentes de IA',
    description: 'O Hub de Iniciativas disponibiliza um servidor MCP local que permite que assistentes de inteligência artificial integrados (como no Cursor, Claude Desktop, Copilot, etc.) leiam e interajam diretamente com as informações da equipe Mississauga em tempo real.',
    tools: [
      {
        name: 'get_active_initiatives',
        desc: 'Retorna a lista de iniciativas e postagens ativas no feed da equipe.'
      },
      {
        name: 'check_vm_availability',
        desc: 'Retorna a disponibilidade de VMs e quem está utilizando cada uma no momento.'
      },
      {
        name: 'get_workflow_routes',
        desc: 'Busca as rotas de API mapeadas de um determinado workflow usando seu ID.',
        params: 'workflowId: ID do workflow cadastrado.'
      },
      {
        name: 'post_to_team_feed',
        desc: 'Permite que o agente de IA crie posts diretamente no feed da equipe.',
        params: 'title, content, category (ideia, iniciativa, duvida, link).'
      }
    ],
    prompts: 'O servidor MCP também expõe o catálogo de AI Skills mapeadas diretamente como Prompts nativos no protocolo. Isso permite que qualquer IA compatível consuma templates como o "/revisao-rotas-wsh" dinamicamente.'
  };

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-2">
          <HelpCircle className="h-8 w-8 text-indigo-400" />
          <span>Central de Ajuda &amp; Documentação</span>
        </h1>
        <p className="text-sm text-slate-400">Entenda o funcionamento de todos os recursos do Hub de Iniciativas e a integração com o Servidor MCP.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLUNA ESQUERDA: VISÃO GERAL, SEGURANÇA E AUDITORIA */}
        <div className="lg:col-span-1 space-y-6">
          <BentoCard title="Segurança &amp; Times" icon={ShieldCheck} subtitle="Isolamento de Dados">
            <div className="space-y-4 text-xs text-slate-300">
              <p>
                Por motivos de segurança e organização, **todas as informações do sistema são isoladas por Time (teamId)**. 
              </p>
              <div className="p-3 bg-slate-950/60 border border-slate-900 rounded-lg">
                <span className="font-bold text-white block mb-1">Como Funciona:</span>
                <ul className="list-disc list-inside space-y-1 text-slate-400">
                  <li>Ao se cadastrar ou fazer login, você é vinculado a um time (ex: <code className="text-indigo-400">mississauga</code>).</li>
                  <li>Você apenas visualizará posts, VMs, Workflows e AI Skills criados pela sua equipe.</li>
                  <li>A edição e exclusão de itens são controladas por autoria ou papéis corporativos.</li>
                </ul>
              </div>
              <div className="p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-lg flex gap-2">
                <Info className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
                <p className="text-slate-400">Acesse a página <strong>Meu Perfil</strong> para trocar de time, gerenciar suas chaves de importação do TDN e ajustar suas cores do tema neon dinâmico.</p>
              </div>
            </div>
          </BentoCard>

          {/* Histórico de Logs */}
          <BentoCard title="Histórico de Auditoria" icon={Clock} subtitle="Logs de alteração do time em tempo real">
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1 text-[11px] custom-scrollbar">
              {logs.length === 0 ? (
                <p className="text-slate-500 py-4 text-center">Nenhuma alteração registrada ainda.</p>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="p-2.5 bg-slate-950/40 border border-slate-900 rounded-xl space-y-1">
                    <div className="flex items-center gap-2">
                      <UserAvatar photoURL={log.userPhoto} displayName={log.userName} sizeClass="h-5 w-5" textClass="text-[7px] font-black" />
                      <div className="flex-1 min-w-0">
                        <span className="font-bold text-white block truncate">{log.userName}</span>
                      </div>
                      <span className="text-[9px] text-slate-500 shrink-0">
                        {log.timestamp?.seconds 
                          ? new Date(log.timestamp.seconds * 1000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) 
                          : new Date(log.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-slate-400 font-medium leading-normal">{log.details}</p>
                    <span className="inline-block text-[8px] font-extrabold uppercase bg-slate-800 text-slate-500 px-1 py-0.5 rounded leading-none">
                      {log.action}
                    </span>
                  </div>
                ))
              )}
            </div>
          </BentoCard>

          <BentoCard title="Tecnologias Utilizadas" icon={Layers} subtitle="Arquitetura do Hub">
            <div className="space-y-3 text-xs text-slate-300">
              <div className="flex justify-between items-center py-2 border-b border-slate-900">
                <span className="font-semibold text-slate-400">Frontend</span>
                <span className="text-white">React 18 + TailwindCSS</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-900">
                <span className="font-semibold text-slate-400">Banco de Dados</span>
                <span className="text-white">Cloud Firestore (Tempo Real)</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-900">
                <span className="font-semibold text-slate-400">Autenticação</span>
                <span className="text-white">Firebase Auth (Google / Senha)</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-900">
                <span className="font-semibold text-slate-400">Hospedagem</span>
                <span className="text-white">Firebase Hosting</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="font-semibold text-slate-400">Servidor MCP</span>
                <span className="text-white">Node.js + Stdio Transport</span>
              </div>
            </div>
          </BentoCard>
        </div>

        {/* COLUNA DIREITA: DETALHE DOS MÓDULOS E MCP */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* MÓDULOS DO SISTEMA */}
          <BentoCard title="Módulos da Plataforma" icon={BookOpen} subtitle="Manual de Operação">
            <div className="space-y-6 mt-2">
              {systemModules.map((mod, idx) => {
                const Icon = mod.icon;
                return (
                  <div key={idx} className="p-4 bg-slate-950/40 border border-slate-900 rounded-xl space-y-3">
                    <div className="flex items-center gap-2 text-white font-bold text-sm">
                      <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
                        <Icon className="h-4 w-4" />
                      </div>
                      <span>{mod.title}</span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">{mod.description}</p>
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-extrabold text-indigo-400 tracking-wider">Ações Suportadas:</span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5 mt-1">
                        {mod.actions.map((act, i) => (
                          <div key={i} className="flex items-center gap-1.5 text-xs text-slate-300">
                            <ChevronRight className="h-3 w-3 text-indigo-500 shrink-0" />
                            <span>{act}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </BentoCard>

          {/* INTEGRACAO MCP */}
          <BentoCard title={mcpInfo.title} icon={Terminal} subtitle={mcpInfo.subtitle}>
            <div className="space-y-4 text-xs text-slate-300 mt-2">
              <p className="leading-relaxed text-slate-400">{mcpInfo.description}</p>
              
              <div className="space-y-3">
                <span className="text-xs font-bold text-white block">Ferramentas (Tools) Disponíveis:</span>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {mcpInfo.tools.map((tool, idx) => (
                    <div key={idx} className="p-3 bg-slate-950/60 border border-slate-900 rounded-xl space-y-1">
                      <code className="text-xs text-indigo-400 font-mono font-bold block">{tool.name}</code>
                      <p className="text-[11px] text-slate-400">{tool.desc}</p>
                      {tool.params && (
                        <p className="text-[10px] text-slate-500 font-mono">Param: {tool.params}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3.5 bg-indigo-500/5 border border-indigo-500/10 rounded-xl space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-indigo-400 text-xs">
                  <Cpu className="h-4 w-4" />
                  <span>Prompts &amp; AI Skills via MCP</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">{mcpInfo.prompts}</p>
              </div>

              <div className="p-3.5 bg-slate-950/80 border border-slate-900 rounded-xl space-y-2">
                <span className="font-bold text-white block">Como Configurar no Claude Desktop:</span>
                <pre className="p-2.5 bg-slate-900/60 rounded border border-slate-800 text-[10px] text-slate-300 font-mono overflow-x-auto whitespace-pre">
{`{
  "mcpServers": {
    "flexihub": {
      "command": "node",
      "args": ["c:/Users/wanderson.alves/projetosWanderson/workflow/mcp-server/dist/index.js"]
    }
  }
}`}
                </pre>
              </div>
            </div>
          </BentoCard>

        </div>

      </div>
    </div>
  );
};

export default Help;
