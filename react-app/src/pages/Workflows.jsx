import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  listenWorkflows, 
  listenWorkflowRoutes, 
  addWorkflow, 
  addWorkflowRoutesBatch,
  updateWorkflow,
  deleteWorkflow,
  addWorkflowRoute
} from '../services/firestore';
import BentoCard from '../components/BentoCard';
import Mermaid from '../components/Mermaid';
import { 
  GitBranch, 
  Plus, 
  ArrowRight, 
  Search, 
  FileText, 
  Sparkles,
  RefreshCw,
  FolderOpen,
  Layers,
  Calendar,
  Network,
  HelpCircle,
  Database,
  Terminal,
  Server,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Pencil,
  Trash2,
  X,
  CloudDownload
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../context/ToastContext';

const Workflows = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [workflows, setWorkflows] = useState([]);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState('');
  const [routes, setRoutes] = useState([]);
  const [loadingRoutes, setLoadingRoutes] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('diagrams'); // 'diagrams' | 'routes' | 'operations'
  const [selectedDiagram, setSelectedDiagram] = useState('arch'); // 'arch' | 'envio' | 'recebimento' | 'online'
  const [zoom, setZoom] = useState(1.0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Reseta zoom ao alternar diagramas
  useEffect(() => {
    setZoom(1.0);
  }, [selectedDiagram]);

  // Estados de Criação / Importação
  const [creatorModalOpen, setCreatorModalOpen] = useState(false);
  const [creationMode, setCreationMode] = useState('markdown'); // 'markdown' | 'manual'
  const [manualRoutes, setManualRoutes] = useState([
    { fluxo: 'FLUXO-1', nome: '', urlWta: '', projetoWta: '', direcao: 'enviar_pdvsync' }
  ]);
  const [wfName, setWfName] = useState('');
  const [systemMaster, setSystemMaster] = useState('');
  const [destiny, setDestiny] = useState('');
  const [integratorsRaw, setIntegratorsRaw] = useState('');
  const [markdownText, setMarkdownText] = useState('');
  const [jiraIssuesCount, setJiraIssuesCount] = useState(0);
  const [jiraRoutes, setJiraRoutes] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  // Estados do Jolt Playground
  const [joltInput, setJoltInput] = useState(
    JSON.stringify({
      "pedidoId": "PED-12345",
      "filial": "01",
      "cliente": {
        "codigo": 9998,
        "nome": "Cliente Exemplo"
      },
      "itens": [
        { "produto": "Teclado Mecanico", "qtd": 1, "preco": 350.00 },
        { "produto": "Mouse Neon", "qtd": 2, "preco": 150.00 }
      ],
      "status": "FATURADO"
    }, null, 2)
  );
  const [joltSpec, setJoltSpec] = useState(
    JSON.stringify([
      {
        "operation": "shift",
        "spec": {
          "pedidoId": "order_number",
          "filial": "store_branch",
          "cliente": {
            "nome": "customer_name"
          },
          "status": "order_status"
        }
      },
      {
        "operation": "default",
        "spec": {
          "origin": "FlexiHub"
        }
      }
    ], null, 2)
  );
  const [joltOutput, setJoltOutput] = useState('');

  // Estados de Edição
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editWfName, setEditWfName] = useState('');
  const [editSystemMaster, setEditSystemMaster] = useState('');
  const [editDestiny, setEditDestiny] = useState('');
  const [editIntegratorsRaw, setEditIntegratorsRaw] = useState('');

  // Estados de Exclusão
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // Estado da Rota Única Manual
  const [addRouteModalOpen, setAddRouteModalOpen] = useState(false);
  const [newRouteFluxo, setNewRouteFluxo] = useState('');
  const [newRouteNome, setNewRouteNome] = useState('');
  const [newRouteUrl, setNewRouteUrl] = useState('');
  const [newRouteProjeto, setNewRouteProjeto] = useState('');
  const [newRouteDirecao, setNewRouteDirecao] = useState('enviar_pdvsync');

  const selectedWf = useMemo(() => {
    return workflows.find((w) => w.id === selectedWorkflowId) || null;
  }, [workflows, selectedWorkflowId]);

  // Categorias de Rotas
  const getRouteCategory = (fluxo) => {
    if (!fluxo) return 'Outros';
    const numMatch = fluxo.match(/FLUXO-(\d+)/i);
    if (!numMatch) return 'Outros';
    const num = parseInt(numMatch[1], 10);
    
    if ([1, 2, 3].includes(num)) return 'Compartilhamentos e Filiais';
    if ([4, 8].includes(num)) return 'Perfil e Usuários';
    if ([5, 6, 7, 34, 35, 36, 38].includes(num)) return 'Fiscal / Tributação';
    if (num === 9) return 'Produtos';
    if (num === 10) return 'Estoque';
    if ([11, 29, 30, 32, 33].includes(num)) return 'Preços';
    if ([12, 13, 14, 21].includes(num)) return 'Formas de Pagamento';
    if ([17, 26, 27, 28, 31].includes(num)) return 'Clientes e Cadastros';
    if ([15, 16, 19, 20, 37].includes(num)) return 'Transacionais (Recebimento pelo ERP)';
    if ([18, 23, 24, 25].includes(num)) return 'Monitor / Status';
    if (num === 22) return 'Utilitários';
    return 'Outros';
  };

  const categoriesDefinition = [
    { name: 'Compartilhamentos e Filiais', styleClass: 'bg-indigo-600/10 text-indigo-400 border-indigo-500/20', headerBg: 'bg-indigo-950/40 border-indigo-900/50', label: 'Compartilhamentos & Filiais' },
    { name: 'Perfil e Usuários', styleClass: 'bg-slate-600/10 text-slate-400 border-slate-500/20', headerBg: 'bg-slate-900/60 border-slate-800/80', label: 'Perfil & Usuários' },
    { name: 'Fiscal / Tributação', styleClass: 'bg-emerald-600/10 text-emerald-400 border-emerald-500/20', headerBg: 'bg-emerald-950/40 border-emerald-900/50', label: 'Fiscal / Tributação' },
    { name: 'Produtos', styleClass: 'bg-teal-600/10 text-teal-400 border-teal-500/20', headerBg: 'bg-teal-900/40 border-teal-800/80', label: 'Produtos' },
    { name: 'Estoque', styleClass: 'bg-amber-600/10 text-amber-400 border-amber-500/20', headerBg: 'bg-amber-950/40 border-amber-900/50', label: 'Estoque' },
    { name: 'Preços', styleClass: 'bg-sky-600/10 text-sky-400 border-sky-500/20', headerBg: 'bg-sky-950/40 border-sky-900/50', label: 'Preços' },
    { name: 'Formas de Pagamento', styleClass: 'bg-purple-600/10 text-purple-400 border-purple-500/20', headerBg: 'bg-purple-950/40 border-purple-900/50', label: 'Formas de Pagamento' },
    { name: 'Clientes e Cadastros', styleClass: 'bg-rose-600/10 text-rose-400 border-rose-500/20', headerBg: 'bg-rose-950/40 border-rose-900/50', label: 'Clientes & Cadastros' },
    { name: 'Transacionais (Recebimento pelo ERP)', styleClass: 'bg-cyan-600/10 text-cyan-400 border-cyan-500/20', headerBg: 'bg-cyan-950/40 border-cyan-900/50', label: 'Transacionais (Recebimento pelo ERP)' },
    { name: 'Monitor / Status', styleClass: 'bg-orange-600/10 text-orange-400 border-orange-500/20', headerBg: 'bg-orange-950/40 border-orange-900/50', label: 'Monitor / Status' },
    { name: 'Utilitários', styleClass: 'bg-violet-600/10 text-violet-400 border-violet-500/20', headerBg: 'bg-violet-950/40 border-violet-900/50', label: 'Utilitários' },
    { name: 'Outros', styleClass: 'bg-gray-600/10 text-gray-400 border-gray-500/20', headerBg: 'bg-gray-900/40 border-gray-800/80', label: 'Outros' }
  ];

  // Agendamentos Fictícios idênticos aos do HTML
  const agendamentos = [
    { name: 'PDVSYNC - CONSULTAR STATUS LOTE', fluxo: 'FLUXO-24', intervalo: '300s (5 min)', delay: '5s' },
    { name: 'PDVSYNC - MONITOR VENDAS', fluxo: 'FLUXO-25', intervalo: '300s (5 min)', delay: '5s' },
    { name: 'PDVSYNC - MOVIMENTO CAIXAS', fluxo: 'FLUXO-15', intervalo: '300s (5 min)', delay: '5s' },
    { name: 'PDVSYNC - PEDIDO STATUS CANCELADO', fluxo: 'FLUXO-20', intervalo: '300s (5 min)', delay: '5s' },
    { name: 'PDVSYNC - PEDIDO STATUS RECEBIDO', fluxo: 'FLUXO-19', intervalo: '300s (5 min)', delay: '5s' },
    { name: 'PDVSYNC - REGISTRAR IP', fluxo: 'FLUXO-22', intervalo: 'periódico', delay: '5s' },
    { name: 'PDVSYNC - VENDAS', fluxo: 'FLUXO-16', intervalo: '300s (5 min)', delay: '5s' },
  ];

  const projetosWta = [
    { name: 'winthor-filiais', domain: 'Filiais e Compartilhamentos', fluxos: '02, 03' },
    { name: 'winthor-estoque-vtex', domain: 'Estoque', fluxos: '10' },
    { name: 'winthor-pedido-venda', domain: 'Pedidos de Venda, Clientes, Preços', fluxos: '11, 17, 18' },
    { name: 'winthor-tributacao', domain: 'Tributação (NCM, ICMS, PIS/COFINS, Reforma)', fluxos: '05, 06, 07, 09, 34, 35, 36, 38' },
    { name: 'winthor-integracao-precos', domain: 'Políticas de Preços', fluxos: '29, 30, 32, 33' },
    { name: 'winthor-integracao-varejo', domain: 'Varejo — Vendas, Caixa, Crédito', fluxos: '15, 16, 25' },
    { name: 'winthor-integracao-matcon', domain: 'Pedidos MatCon, RCA', fluxos: '19, 20, 23' },
    { name: 'winthor-integracao-config', domain: 'Controle de Lotes e Status', fluxos: '24, 25' },
    { name: 'winthor-integracao-cliente', domain: 'Cadastros de Cliente', fluxos: '27, 28, 31' },
    { name: 'winthor-integracao-cadastros', domain: 'Cadastros Gerais (Profissional)', fluxos: '26' },
    { name: 'winthor-ferramenta-usuario', domain: 'Usuários e Operadores', fluxos: '08' },
    { name: 'winthor-venda', domain: 'Operadoras e Planos de Pagamento', fluxos: '12, 13' },
  ];

  // DEFINIÇÃO DOS CÓDIGOS MERMAID
  const diagramsCode = {
    arch: `flowchart LR
    subgraph ERP["🏢  ERP WINTHOR  (Oracle DB)"]
        direction TB
        WTA["WTA APIs\\n━━━━━━━━━━━━━━━━\\nwinthor-filiais\\nwinthor-estoque-vtex\\nwinthor-pedido-venda\\nwinthor-tributacao\\nwinthor-integracao-precos\\nwinthor-integracao-varejo\\nwinthor-integracao-matcon\\nwinthor-integracao-config\\nwinthor-integracao-cliente\\nwinthor-integracao-cadastros\\nwinthor-ferramenta-usuario\\nwinthor-venda"]
    end

    subgraph WSH["⚙️  WSH · winthor-integracao-core"]
        ENGINE["Motor de Integração\\n38 Fluxos | 87 Rotas\\nTransformações JOLT"]
    end

    subgraph SYNC["🔄  PDVSYNC"]
        PS["pdvsync.varejo.totvs.com.br\\n43 Rotas ENVIAR / BUSCAR"]
    end

    subgraph PDV["🖥️  PDVOmni  (Frente de Caixa)"]
        OMNI["Operações PDV\\nVendas · Pedidos · Caixa"]
    end

    WTA -- "BUSCAR\\n(Fluxos 01-14,17-18\\n21-23,26-38)" --> ENGINE
    ENGINE -- "ENVIAR\\n(→ PDVSYNC)" --> PS
    PS --> OMNI
    OMNI -- "Transações geradas" --> PS
    PS -- "BUSCAR\\n(Fluxos 15-16,19-20,37)" --> ENGINE
    ENGINE -- "ENVIAR\\n(→ WTA)" --> WTA
    OMNI -. "12 Processos Online\\n(direto · sem WSH)" .-> WTA`,

    envio: `sequenceDiagram
    autonumber
    participant WSH as ⚙️ WSH<br/>(winthor-integracao-core)
    participant WTA as 🏢 WTA<br/>(ERP Winthor)
    participant PS  as 🔄 PDVSYNC
    participant PDV as 🖥️ PDVOmni

    WSH->>WTA: POST /winthor/autenticacao/v1/login
    WTA-->>WSH: Bearer Token (válido 2h)

    WSH->>WTA: GET/POST {{URL_BASE}}/winthor/... (Rota BUSCAR)
    WTA-->>WSH: Dados do ERP (JSON)

    Note over WSH: Transformação JOLT / custom-totvs

    WSH->>PS: POST /autenticacao/oauth/token (RAC OAuth)
    PS-->>WSH: Access Token (válido 20min)

    WSH->>PS: POST /controleprocesso/... (Criar Lote/Variável)
    PS-->>WSH: ID do Lote

    WSH->>PS: POST/PUT {{URL_PDVSYNC}}/... (Rota ENVIAR)
    PS-->>WSH: 200 OK

    WSH->>PS: PUT /controleprocesso/... (Fechar Lote)
    Note over PS,PDV: Dados disponíveis para o PDVOmni
    PDV->>PS: Consulta dados sincronizados`,

    recebimento: `sequenceDiagram
    autonumber
    participant PDV as 🖥️ PDVOmni
    participant PS  as 🔄 PDVSYNC
    participant WSH as ⚙️ WSH<br/>(winthor-integracao-core)
    participant WTA as 🏢 WTA<br/>(ERP Winthor)

    PDV->>PS: Registra transação (venda / pedido / caixa)
    Note over PS: Transação fica pendente no PDVSYNC

    Note over WSH: Agendamento dispara a cada 300s (5 min)

    WSH->>PS: POST /autenticacao/oauth/token (RAC OAuth)
    PS-->>WSH: Access Token (válido 20min)

    WSH->>PS: GET {{URL_PDVSYNC}}/comercial/... (Rota BUSCAR PDVSYNC)
    PS-->>WSH: Lista de transações pendentes

    Note over WSH: Transformação JOLT / custom-totvs

    WSH->>WTA: POST /winthor/autenticacao/v1/login
    WTA-->>WSH: Bearer Token (válido 2h)

    WSH->>WTA: POST/PUT {{URL_BASE}}/winthor/varejo/... (Rota ENVIAR WTA)
    WTA-->>WSH: Status de processamento

    WSH->>PS: PUT {{URL_PDVSYNC}}/controle/... (Atualizar status)
    Note over PS,PDV: Status atualizado no PDVSYNC`,

    online: `flowchart LR
    OMNI["🖥️ PDVOmni\\n(Frente de Caixa)"]

    subgraph MAT["winthor-integracao-matcon"]
        direction TB
        M1["EndpointPreVendaEnvio\\nEndpointNotaEntradaEnvio\\nEndpointPreVendaAtualiza\\nEndpointReservaEstoqueEnvio\\nEndpointIdentificadorPDV\\nEndpointPreVendaConsultaPedido\\nEndpointPreVendaConsultaListaPedido"]
    end

    subgraph VAR["winthor-integracao-varejo"]
        V1["EndpointCreditoConsumo\\nEndpointCreditoConsulta"]
    end

    subgraph EST["winthor-estoque-vtex"]
        E1["EndpointNotaSaidaEnvio\\nEndpointEstoqueConsulta"]
    end

    subgraph CLI["winthor-integracao-cliente"]
        C1["EndpointFormasCondicoesCliente"]
    end

    OMNI -- "/winthor/varejo/matcon/v1/orders/pdvsync\\n/winthor/varejo/matcon/v1/pdv/detalhepdv" --> MAT
    OMNI -- "/winthor/varejo/v1/credito-cliente" --> VAR
    OMNI -- "/api/stock-vtex/v1/available/pdv-sync" --> EST
    OMNI -- "/winthor/cliente/v1/payments/pdvsync" --> CLI`,

    gantt: `gantt
    title Ciclos de Agendamento (a cada 5 minutos)
    dateFormat  mm:ss
    axisFormat  %M:%S

    section Vendas
    FLUXO-16 Vendas        :active, 00:05, 300s
    section Caixa
    FLUXO-15 Mov. Caixa    :active, 00:05, 300s
    section Pedidos
    FLUXO-19 Ped. Recebido :active, 00:05, 300s
    FLUXO-20 Ped. Cancelado:active, 00:05, 300s
    section Monitor
    FLUXO-24 Status Lote   :active, 00:05, 300s
    FLUXO-25 Status Venda  :active, 00:05, 300s
    section Outros
    FLUXO-22 Registrar IP  :active, 00:05, 60s`
  };

  // Carregar Workflows do banco (isolado por time)
  useEffect(() => {
    if (!user?.teamId) return;
    const unsub = listenWorkflows(user.teamId, (data) => {
      setWorkflows(data);
      if (data.length > 0) {
        if (!selectedWorkflowId || !data.some(w => w.id === selectedWorkflowId)) {
          setSelectedWorkflowId(data[0].id);
        }
      } else {
        setSelectedWorkflowId('');
      }
    });
    return () => unsub();
  }, [user?.teamId, selectedWorkflowId]);

  const handleOpenEditModal = () => {
    const wf = workflows.find((w) => w.id === selectedWorkflowId);
    if (!wf) return;
    setEditWfName(wf.name || '');
    setEditSystemMaster(wf.systemMaster || '');
    setEditDestiny(wf.destiny || '');
    setEditIntegratorsRaw(wf.integrators ? wf.integrators.join(', ') : '');
    setEditModalOpen(true);
  };

  const handleEditWorkflow = async (e) => {
    e.preventDefault();
    if (!editWfName || !editSystemMaster || !editDestiny) return;
    setIsSaving(true);

    try {
      const integrators = editIntegratorsRaw
        ? editIntegratorsRaw.split(',').map((i) => i.trim()).filter((i) => i.length > 0)
        : [];

      await updateWorkflow(selectedWorkflowId, {
        name: editWfName,
        systemMaster: editSystemMaster,
        destiny: editDestiny,
        integrators
      }, user);

      addToast('Workflow editado com sucesso!', 'success');
      setEditModalOpen(false);
    } catch (err) {
      console.error('Erro ao editar workflow:', err);
      addToast('Erro ao editar workflow.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteWorkflow = async () => {
    if (!selectedWorkflowId) return;
    setIsSaving(true);
    try {
      const currentId = selectedWorkflowId;
      const remaining = workflows.filter((w) => w.id !== currentId);
      const nextSelectId = remaining.length > 0 ? remaining[0].id : '';

      const currentWf = workflows.find((w) => w.id === currentId);
      await deleteWorkflow(currentId, user, currentWf?.name);
      
      addToast('Workflow excluído com sucesso!', 'success');
      setSelectedWorkflowId(nextSelectId);
      setDeleteConfirmOpen(false);
    } catch (err) {
      console.error('Erro ao excluir workflow:', err);
      addToast('Erro ao excluir workflow.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Carregar Rotas do Workflow selecionado em tempo real
  useEffect(() => {
    if (!selectedWorkflowId) {
      setRoutes([]);
      return;
    }
    setLoadingRoutes(true);
    const unsub = listenWorkflowRoutes(selectedWorkflowId, (data) => {
      setRoutes(data);
      setLoadingRoutes(false);
    });
    return () => unsub();
  }, [selectedWorkflowId]);

  // Agrupar e Filtrar rotas baseado no termo de pesquisa
  const groupedRoutes = useMemo(() => {
    const term = searchTerm.toLowerCase();
    const filtered = routes.filter((route) => {
      return (
        route.nome.toLowerCase().includes(term) ||
        route.fluxo.toLowerCase().includes(term) ||
        (route.urlWta && route.urlWta.toLowerCase().includes(term)) ||
        (route.projetoWta && route.projetoWta.toLowerCase().includes(term))
      );
    });

    const groups = {};
    filtered.forEach((route) => {
      const cat = getRouteCategory(route.fluxo);
      if (!groups[cat]) {
        groups[cat] = [];
      }
      groups[cat].push(route);
    });

    return groups;
  }, [routes, searchTerm]);

  const handleCreateWorkflow = async (e) => {
    e.preventDefault();
    if (!wfName || !systemMaster || !destiny) return;
    setIsSaving(true);

    try {
      const integrators = integratorsRaw
        ? integratorsRaw.split(',').map((i) => i.trim()).filter((i) => i.length > 0)
        : [];

      // Salva Workflow Header
      const docRef = await addWorkflow({
        name: wfName,
        systemMaster,
        destiny,
        integrators
      }, user);

      // Parseia e salva rotas
      if (creationMode === 'markdown') {
        if (markdownText.trim()) {
          const parsedRoutes = parseMarkdownTable(markdownText, docRef.id);
          if (parsedRoutes.length > 0) {
            await addWorkflowRoutesBatch(parsedRoutes);
          }
        }
      } else if (creationMode === 'jira') {
        if (jiraRoutes.length > 0) {
          const validJiraRoutes = jiraRoutes.map((r) => ({
            ...r,
            workflowId: docRef.id
          }));
          await addWorkflowRoutesBatch(validJiraRoutes);
        }
      } else {
        const validManualRoutes = manualRoutes
          .filter((r) => r.fluxo.trim() && r.nome.trim())
          .map((r) => ({
            workflowId: docRef.id,
            fluxo: r.fluxo.trim().toUpperCase(),
            nome: r.nome.trim(),
            urlWta: r.urlWta.trim(),
            projetoWta: r.projetoWta.trim(),
            direcao: r.direcao
          }));
        
        if (validManualRoutes.length > 0) {
          await addWorkflowRoutesBatch(validManualRoutes);
        }
      }

      addToast('Workflow criado com sucesso!', 'success');
      // Resetar form
      setWfName('');
      setSystemMaster('');
      setDestiny('');
      setIntegratorsRaw('');
      setMarkdownText('');
      setJiraRoutes([]);
      setJiraIssuesCount(0);
      setManualRoutes([
        { fluxo: 'FLUXO-1', nome: '', urlWta: '', projetoWta: '', direcao: 'enviar_pdvsync' }
      ]);
      setCreatorModalOpen(false);
      setSelectedWorkflowId(docRef.id);
    } catch (err) {
      console.error(err);
      addToast('Erro ao criar workflow.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddSingleRoute = async (e) => {
    e.preventDefault();
    if (!newRouteFluxo || !newRouteNome || !selectedWorkflowId) return;
    setIsSaving(true);
    try {
      await addWorkflowRoute({
        workflowId: selectedWorkflowId,
        fluxo: newRouteFluxo.trim().toUpperCase(),
        nome: newRouteNome.trim(),
        urlWta: newRouteUrl.trim(),
        projetoWta: newRouteProjeto.trim(),
        direcao: newRouteDirecao
      });
      // Resetar form
      setNewRouteFluxo('');
      setNewRouteNome('');
      setNewRouteUrl('');
      setNewRouteProjeto('');
      setNewRouteDirecao('enviar_pdvsync');
      setAddRouteModalOpen(false);
      addToast('Rota adicionada com sucesso!', 'success');
    } catch (err) {
      console.error('Erro ao adicionar rota única:', err);
      addToast('Erro ao adicionar rota.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const exportRoutesToMarkdown = () => {
    if (routes.length === 0) {
      addToast('Nenhuma rota disponível para exportar.', 'error');
      return;
    }
    let md = `| Fluxo | Nome | Rota/URL | Projeto WTA | Direção |\n|---|---|---|---|---|\n`;
    routes.forEach(r => {
      const dirText = r.direcao === 'enviar_pdvsync' ? '→ PDVSYNC' 
                    : r.direcao === 'enviar_wta' ? '→ WTA' 
                    : r.direcao === 'monitor' ? 'Monitor' 
                    : 'Online Direto';
      md += `| ${r.fluxo} | ${r.nome} | ${r.urlWta || '—'} | ${r.projetoWta || '—'} | ${dirText} |\n`;
    });
    navigator.clipboard.writeText(md);
    addToast('Tabela de rotas em Markdown copiada!', 'success');
  };

  const exportRoutesToCSV = () => {
    if (routes.length === 0) {
      addToast('Nenhuma rota disponível para exportar.', 'error');
      return;
    }
    const headers = ['Fluxo', 'Nome do Fluxo', 'URL WTA (ERP)', 'Projeto WTA', 'Direcao'];
    const csvRows = routes.map(r => {
      const dirText = r.direcao === 'enviar_pdvsync' ? '→ PDVSYNC' 
                    : r.direcao === 'enviar_wta' ? '→ WTA' 
                    : r.direcao === 'monitor' ? 'Monitor' 
                    : 'Online Direto';
      return [
        `"${r.fluxo}"`,
        `"${r.nome.replace(/"/g, '""')}"`,
        `"${(r.urlWta || '').replace(/"/g, '""')}"`,
        `"${(r.projetoWta || '').replace(/"/g, '""')}"`,
        `"${dirText}"`
      ];
    });
    
    const csvContent = "\ufeff" + [headers.join(','), ...csvRows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `rotas_workflow_${selectedWorkflowId || 'export'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('CSV de rotas baixado!', 'success');
  };

  const handleJiraXmlUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(text, 'text/xml');
      const parseError = xmlDoc.querySelector('parsererror');
      if (parseError) {
        addToast('Arquivo XML inválido do Jira.', 'error');
        return;
      }

      const items = xmlDoc.querySelectorAll('channel > item');
      const parsedRoutes = [];

      items.forEach((item) => {
        const summary = item.querySelector('summary')?.textContent || '';
        const description = item.querySelector('description')?.textContent || '';
        const key = item.querySelector('key')?.textContent || '';
        
        const fluxoMatch = summary.match(/FLUXO-\d+/i);
        const fluxo = fluxoMatch ? fluxoMatch[0].toUpperCase() : `FLUXO-${key.split('-')[1] || '99'}`;
        
        const nome = summary.replace(/\[?FLUXO-\d+\]?:?/i, '').trim();

        const urlMatch = description.match(/\/winthor\/[a-zA-Z0-9_\-\/]+/i);
        const urlWta = urlMatch ? urlMatch[0] : '';

        const projMatch = description.match(/winthor-[a-zA-Z0-9_\-]+/i);
        const projetoWta = projMatch ? projMatch[0] : '';

        let direcao = 'enviar_pdvsync';
        if (description.includes('WTA') || description.includes('→ WTA')) {
          direcao = 'enviar_wta';
        } else if (description.includes('Monitor') || description.includes('MONITOR')) {
          direcao = 'monitor';
        } else if (description.includes('Online') || description.includes('direto')) {
          direcao = 'online_direto';
        }

        parsedRoutes.push({
          fluxo,
          nome,
          urlWta,
          projetoWta,
          direcao
        });
      });

      setJiraRoutes(parsedRoutes);
      setJiraIssuesCount(parsedRoutes.length);
      addToast(`${parsedRoutes.length} rotas importadas do XML!`, 'success');
    } catch (err) {
      console.error(err);
      addToast('Erro ao ler XML do Jira.', 'error');
    }
  };

  const runLocalJolt = (inputJson, specJson) => {
    let input;
    let spec;
    try {
      input = JSON.parse(inputJson);
    } catch(e) {
      throw new Error("JSON de Entrada inválido: " + e.message);
    }
    try {
      spec = JSON.parse(specJson);
    } catch(e) {
      throw new Error("Jolt Spec inválido: " + e.message);
    }

    const setNestedValue = (obj, path, value) => {
      const parts = path.split('.');
      let current = obj;
      for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        if (!current[part]) {
          current[part] = {};
        }
        current = current[part];
      }
      current[parts[parts.length - 1]] = value;
    };

    const applyShift = (currInput, currSpec, outObj) => {
      if (typeof currSpec === 'string') {
        setNestedValue(outObj, currSpec, currInput);
        return;
      }
      for (let specKey in currSpec) {
        const specVal = currSpec[specKey];
        if (specKey === '*') {
          for (let inKey in currInput) {
            const matchedVal = currInput[inKey];
            if (typeof specVal === 'string') {
              const targetPath = specVal.replace(/&/g, inKey);
              setNestedValue(outObj, targetPath, matchedVal);
            } else if (typeof specVal === 'object' && specVal !== null) {
              applyShift(matchedVal, specVal, outObj);
            }
          }
          continue;
        }
        if (currInput && currInput[specKey] !== undefined) {
          const valToMove = currInput[specKey];
          if (typeof specVal === 'string') {
            const targetPath = specVal.replace(/&/g, specKey);
            setNestedValue(outObj, targetPath, valToMove);
          } else if (typeof specVal === 'object' && specVal !== null) {
            applyShift(valToMove, specVal, outObj);
          }
        }
      }
    };

    const applyDefault = (currSpec, outObj) => {
      for (let key in currSpec) {
        const val = currSpec[key];
        if (typeof val === 'object' && val !== null) {
          if (!outObj[key]) outObj[key] = {};
          applyDefault(val, outObj[key]);
        } else {
          if (outObj[key] === undefined) {
            outObj[key] = val;
          }
        }
      }
    };

    let output = JSON.parse(JSON.stringify(input));
    if (Array.isArray(spec)) {
      let currentData = input;
      for (const op of spec) {
        if (op.operation === 'shift') {
          const tempOut = {};
          applyShift(currentData, op.spec, tempOut);
          currentData = tempOut;
        } else if (op.operation === 'default') {
          const tempOut = JSON.parse(JSON.stringify(currentData));
          applyDefault(op.spec, tempOut);
          currentData = tempOut;
        }
      }
      output = currentData;
    } else {
      const tempOut = {};
      applyShift(input, spec, tempOut);
      output = tempOut;
    }
    return JSON.stringify(output, null, 2);
  };

  const handleRunJolt = () => {
    try {
      const result = runLocalJolt(joltInput, joltSpec);
      setJoltOutput(result);
      addToast('Transformação executada!', 'success');
    } catch(err) {
      addToast(err.message, 'error');
      setJoltOutput(`Erro: ${err.message}`);
    }
  };

  // Parser robusto de Tabela Markdown que suporta diferentes posições de colunas
  const parseMarkdownTable = (markdown, workflowId) => {
    const lines = markdown.split('\n');
    const parsed = [];

    let fluxoIdx = -1;
    let nomeIdx = -1;
    let urlWtaIdx = -1;
    let projetoWtaIdx = -1;
    let direcaoIdx = -1;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('|')) continue;

      const cols = trimmed.split('|').map((c) => c.trim());
      if (cols[0] === '') cols.shift();
      if (cols[cols.length - 1] === '') cols.pop();

      if (cols.every((c) => c.startsWith('-') || c === '')) continue;

      const isHeader = cols.some((c) => {
        const val = c.toLowerCase();
        return val === 'fluxo' || val === 'url wta' || val === 'projeto wta' || val === 'agendamento' || val === 'direção' || val === 'dir.';
      });

      if (isHeader) {
        fluxoIdx = -1;
        nomeIdx = -1;
        urlWtaIdx = -1;
        projetoWtaIdx = -1;
        direcaoIdx = -1;

        for (let i = 0; i < cols.length; i++) {
          const col = cols[i].toLowerCase();
          if (col.includes('fluxo') && !col.includes('vinculado') && !col.includes('rota')) fluxoIdx = i;
          if (col.includes('nome') || col.includes('fluxo vinculado') || col.includes('agendamento')) nomeIdx = i;
          if (col.includes('url wta') || col.includes('url')) urlWtaIdx = i;
          if (col.includes('projeto wta') || col.includes('projeto')) projetoWtaIdx = i;
          if (col.includes('dir') || col.includes('direção')) direcaoIdx = i;
        }
        continue;
      }

      let fluxoVal = '';
      let fluxoColIdx = -1;

      for (let i = 0; i < cols.length; i++) {
        const match = cols[i].match(/FLUXO-\d+/i);
        if (match) {
          fluxoVal = match[0].toUpperCase();
          fluxoColIdx = i;
          break;
        }
      }

      if (!fluxoVal) continue;

      let nome = '';
      if (nomeIdx !== -1 && nomeIdx < cols.length) {
        nome = cols[nomeIdx];
      } else {
        nome = (fluxoColIdx === 1 ? cols[0] : cols[1]) || cols[0] || '';
      }
      nome = nome.replace(/\(FLUXO-\d+.*\)/i, '').trim();

      let urlWta = '';
      if (urlWtaIdx !== -1 && urlWtaIdx < cols.length) {
        urlWta = cols[urlWtaIdx];
      } else {
        const foundUrl = cols.find((c) => c.startsWith('/') || c.toLowerCase().includes('/api') || c.toLowerCase().includes('/winthor'));
        if (foundUrl) urlWta = foundUrl;
      }
      if (urlWta === '—' || urlWta.toLowerCase() === 'n/a') urlWta = '';

      let projetoWta = '';
      if (projetoWtaIdx !== -1 && projetoWtaIdx < cols.length) {
        projetoWta = cols[projetoWtaIdx];
      } else {
        const foundProj = cols.find((c) => c.startsWith('winthor-'));
        if (foundProj) projetoWta = foundProj;
      }
      if (projetoWta === '—' || projetoWta.toLowerCase() === 'n/a') projetoWta = '';

      let direcaoRaw = '';
      if (direcaoIdx !== -1 && direcaoIdx < cols.length) {
        direcaoRaw = cols[direcaoIdx];
      } else {
        const lineStr = cols.join(' ');
        if (lineStr.includes('→ PDVSYNC')) direcaoRaw = '→ PDVSYNC';
        else if (lineStr.includes('→ WTA')) direcaoRaw = '→ WTA';
        else if (lineStr.includes('Monitor')) direcaoRaw = 'Monitor';
        else if (lineStr.includes('Utilitário')) direcaoRaw = 'Utilitário';
      }

      let direcao = 'enviar_pdvsync';
      if (direcaoRaw.includes('WTA')) {
        direcao = 'enviar_wta';
      } else if (direcaoRaw.includes('Monitor')) {
        direcao = 'monitor';
      } else if (direcaoRaw.includes('Online') || direcaoRaw.includes('direto') || direcaoRaw.includes('Utilitário')) {
        direcao = 'online_direto';
      }

      parsed.push({
        workflowId,
        fluxo: fluxoVal,
        nome,
        urlWta,
        projetoWta,
        direcao
      });
    }
    return parsed;
  };

  const getDirectionBadge = (dir) => {
    switch (dir) {
      case 'enviar_pdvsync':
        return <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded text-[10px] font-bold">→ {selectedWf?.destiny || 'Destino'}</span>;
      case 'enviar_wta':
        return <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded text-[10px] font-bold">→ {selectedWf?.systemMaster || 'Origem'}</span>;
      case 'monitor':
        return <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-bold">Monitor</span>;
      case 'online_direto':
        return <span className="bg-sky-500/10 text-sky-400 border border-sky-500/20 px-2 py-0.5 rounded text-[10px] font-bold">Online Direto</span>;
      default:
        return <span className="bg-slate-500/10 text-slate-400 border border-slate-500/20 px-2 py-0.5 rounded text-[10px] font-bold">Outro</span>;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER PRINCIPAL */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Workflows &amp; APIs</h1>
          <p className="text-sm text-slate-400 font-medium">Mapeamento de integrações, fluxogramas interativos e documentação de rotas de ponta a ponta.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          {/* Seletor de Workflow */}
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1 text-slate-300">
            <FolderOpen className="h-4 w-4 text-indigo-400" />
            <select
              value={selectedWorkflowId}
              onChange={(e) => setSelectedWorkflowId(e.target.value)}
              className="bg-transparent text-sm outline-none border-none pr-8 py-1.5 font-semibold cursor-pointer text-slate-200"
            >
              {workflows.length === 0 ? (
                <option value="">Nenhum</option>
              ) : (
                workflows.map((w) => (
                  <option key={w.id} value={w.id} className="bg-slate-900">{w.name}</option>
                ))
              )}
            </select>
          </div>

          {selectedWorkflowId && (
            <div className="flex gap-2">
              <button
                onClick={handleOpenEditModal}
                className="p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-all flex items-center justify-center"
                title="Editar Workflow"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                onClick={() => setDeleteConfirmOpen(true)}
                className="p-2.5 bg-slate-900 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-900/50 rounded-xl text-slate-400 hover:text-rose-400 transition-all flex items-center justify-center"
                title="Excluir Workflow"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          )}

          <button
            onClick={() => setCreatorModalOpen(true)}
            className="btn-primary py-2.5 px-4 text-xs flex items-center justify-center gap-1.5"
          >
            <Plus className="h-4 w-4" />
            <span>Criar / Importar</span>
          </button>
        </div>
      </div>

      {selectedWorkflowId ? (
        <div className="space-y-6">
          
          {/* CONTROLE DE ABAS (INTERATIVIDADE ESTILO HTML) */}
          <div className="flex border-b border-slate-900 gap-1.5 pb-px">
            <button
              onClick={() => setActiveTab('diagrams')}
              className={`flex items-center gap-2 px-4 py-2.5 border-b-2 text-xs font-bold tracking-wide transition-all uppercase ${
                activeTab === 'diagrams'
                  ? 'border-indigo-500 text-white bg-indigo-500/5'
                  : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-900/40'
              }`}
            >
              <Network className="h-4 w-4" />
              <span>Diagramas de Fluxo (Visual)</span>
            </button>

            <button
              onClick={() => setActiveTab('routes')}
              className={`flex items-center gap-2 px-4 py-2.5 border-b-2 text-xs font-bold tracking-wide transition-all uppercase ${
                activeTab === 'routes'
                  ? 'border-indigo-500 text-white bg-indigo-500/5'
                  : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-900/40'
              }`}
            >
              <Layers className="h-4 w-4" />
              <span>Mapeamento de Rotas (Tabelas)</span>
            </button>

            <button
              onClick={() => setActiveTab('operations')}
              className={`flex items-center gap-2 px-4 py-2.5 border-b-2 text-xs font-bold tracking-wide transition-all uppercase ${
                activeTab === 'operations'
                  ? 'border-indigo-500 text-white bg-indigo-500/5'
                  : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-900/40'
              }`}
            >
              <Calendar className="h-4 w-4" />
              <span>Agendamentos &amp; Projetos</span>
            </button>

            <button
              onClick={() => setActiveTab('jolt')}
              className={`flex items-center gap-2 px-4 py-2.5 border-b-2 text-xs font-bold tracking-wide transition-all uppercase ${
                activeTab === 'jolt'
                  ? 'border-indigo-500 text-white bg-indigo-500/5'
                  : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-900/40'
              }`}
            >
              <Terminal className="h-4 w-4" />
              <span>Jolt Playground</span>
            </button>
          </div>

          {/* TAB 1: DIAGRAMAS MERMAID */}
          {activeTab === 'diagrams' && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Menu de seleção de diagramas */}
              <div className="md:col-span-1 flex flex-col gap-2 bg-slate-900/30 border border-slate-900/60 p-4 rounded-2xl h-fit">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Selecione o Fluxo</h4>
                {[
                  { id: 'arch', label: '1. Arquitetura Geral', desc: 'Visão de ponta a ponta' },
                  { id: 'envio', label: '2. Sincronização de Envio', desc: 'WTA para o PDVSYNC' },
                  { id: 'recebimento', label: '3. Transações de Recebimento', desc: 'PDVSYNC para o WTA' },
                  { id: 'online', label: '4. Processos Online Diretos', desc: 'PDVOmni para o WTA' }
                ].map((diag) => (
                  <button
                    key={diag.id}
                    onClick={() => setSelectedDiagram(diag.id)}
                    className={`p-3 text-left rounded-xl border transition-all ${
                      selectedDiagram === diag.id
                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/10'
                        : 'bg-slate-950/20 border-slate-900 hover:border-slate-800/80 text-slate-300'
                    }`}
                  >
                    <span className="text-xs font-bold block">{diag.label}</span>
                    <span className={`text-[10px] block mt-0.5 ${selectedDiagram === diag.id ? 'text-indigo-200' : 'text-slate-500'}`}>
                      {diag.desc}
                    </span>
                  </button>
                ))}
              </div>

              {/* Viewport do Mermaid */}
              <div className="md:col-span-3 space-y-4">
                <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-md shadow-lg relative">
                  
                  {/* Cabeçalho do Card com Barra de Ações (Zoom e Tela Cheia) */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-900 pb-4 mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
                        <Network className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-white">
                          {selectedDiagram === 'arch' ? 'Arquitetura Geral da Integração' :
                           selectedDiagram === 'envio' ? 'Fluxo de Envio (WTA → WSH → PDVSYNC)' :
                           selectedDiagram === 'recebimento' ? 'Fluxo de Recebimento (PDVSYNC → WSH → WTA)' :
                           'Mapeamento de Processos Online Diretos (PDVOmni → WTA)'}
                        </h4>
                        <p className="text-[10px] text-slate-500">Diagrama interativo e responsivo</p>
                      </div>
                    </div>

                    {/* Controles de Zoom e Fullscreen */}
                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <div className="flex items-center gap-1 bg-slate-950 border border-slate-900 rounded-lg p-1 text-slate-400">
                        <button 
                          onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}
                          className="p-1 hover:bg-slate-800 rounded hover:text-white transition-colors"
                          title="Diminuir zoom"
                        >
                          <ZoomOut className="h-3.5 w-3.5" />
                        </button>
                        <span className="text-[10px] font-bold w-12 text-center select-none text-slate-300">{Math.round(zoom * 100)}%</span>
                        <button 
                          onClick={() => setZoom(z => Math.min(2.0, z + 0.25))}
                          className="p-1 hover:bg-slate-800 rounded hover:text-white transition-colors"
                          title="Aumentar zoom"
                        >
                          <ZoomIn className="h-3.5 w-3.5" />
                        </button>
                        <button 
                          onClick={() => setZoom(1.0)}
                          className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[9px] font-bold transition-all"
                        >
                          100%
                        </button>
                      </div>

                      <button
                        onClick={() => setIsFullscreen(true)}
                        className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-900 hover:border-slate-800 rounded-lg text-slate-400 hover:text-white transition-all"
                        title="Ver em tela cheia"
                      >
                        <Maximize2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Área do Diagrama com Scrollbars */}
                  <div className="w-full overflow-auto max-h-[62vh] bg-slate-950/20 rounded-xl p-4 border border-slate-950 flex justify-center items-start">
                    <div 
                      style={{ 
                        transform: `scale(${zoom})`, 
                        transformOrigin: 'top center',
                        transition: 'transform 0.15s ease-out',
                        width: '100%',
                        minWidth: '650px'
                      }}
                      className="shrink-0"
                    >
                      <Mermaid chart={diagramsCode[selectedDiagram]} />
                    </div>
                  </div>

                </div>
              </div>
            </div>
          )}

          {/* PORTAL MODAL DE TELA CHEIA (FULLSCREEN) */}
          <AnimatePresence>
            {isFullscreen && (
              <div className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-md flex flex-col p-6 overflow-hidden">
                {/* Cabeçalho da Tela Cheia */}
                <div className="flex items-center justify-between border-b border-slate-900 pb-4 mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      {selectedDiagram === 'arch' ? 'Arquitetura Geral da Integração' :
                       selectedDiagram === 'envio' ? 'Fluxo de Envio (WTA → WSH → PDVSYNC)' :
                       selectedDiagram === 'recebimento' ? 'Fluxo de Recebimento (PDVSYNC → WSH → WTA)' :
                       'Mapeamento de Processos Online Diretos (PDVOmni → WTA)'}
                    </h3>
                    <p className="text-xs text-slate-400">Visualização em Tela Cheia</p>
                  </div>

                  {/* Controles da Tela Cheia */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-xl p-1 text-slate-300">
                      <button 
                        onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}
                        className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors"
                      >
                        <ZoomOut className="h-4 w-4" />
                      </button>
                      <span className="text-xs font-bold w-14 text-center select-none">{Math.round(zoom * 100)}%</span>
                      <button 
                        onClick={() => setZoom(z => Math.min(2.5, z + 0.25))}
                        className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors"
                      >
                        <ZoomIn className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => setZoom(1.0)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] font-bold transition-all"
                      >
                        100%
                      </button>
                    </div>

                    <button 
                      onClick={() => setIsFullscreen(false)}
                      className="px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 hover:border-rose-500/40 text-rose-400 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
                    >
                      <Minimize2 className="h-4 w-4" />
                      <span>Sair da Tela Cheia</span>
                    </button>
                  </div>
                </div>

                {/* Viewport da Tela Cheia com Scrollbars */}
                <div className="flex-1 overflow-auto flex justify-center items-start p-6 bg-slate-900/10 border border-slate-900 rounded-2xl">
                  <div 
                    style={{ 
                      transform: `scale(${zoom})`, 
                      transformOrigin: 'top center',
                      transition: 'transform 0.15s ease-out',
                      width: '100%',
                      minWidth: '850px'
                    }}
                    className="shrink-0"
                  >
                    <Mermaid chart={diagramsCode[selectedDiagram]} />
                  </div>
                </div>
              </div>
            )}
          </AnimatePresence>

          {/* TAB 2: TABELAS DE ROTAS DETALHADAS POR CATEGORIA */}
          {activeTab === 'routes' && (
            <div className="space-y-6">
              {/* Barra de Pesquisa e Filtros */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/40 border border-slate-900 p-4 rounded-xl backdrop-blur-md">
                <div className="relative w-full sm:flex-1">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                    <Search className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Pesquisar por fluxo, nome, URL WTA, projeto ou tag..."
                    className="premium-input pl-10"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={exportRoutesToMarkdown}
                    className="btn-secondary py-2 px-3 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 w-full sm:w-auto"
                    title="Copiar tabela em Markdown"
                  >
                    <span>Copiar Markdown</span>
                  </button>
                  <button
                    onClick={exportRoutesToCSV}
                    className="btn-secondary py-2 px-3 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 w-full sm:w-auto"
                    title="Baixar arquivo CSV"
                  >
                    <span>Baixar CSV</span>
                  </button>
                  <button
                    onClick={() => setAddRouteModalOpen(true)}
                    className="btn-primary py-2 px-4 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 w-full sm:w-auto"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Adicionar Rota</span>
                  </button>
                </div>
              </div>

              {/* Renderização das categorias */}
              {Object.keys(groupedRoutes).length === 0 ? (
                <div className="text-center py-12 bg-slate-900/20 border border-slate-800/60 rounded-2xl p-6">
                  <Layers className="h-12 w-12 text-slate-700 mx-auto mb-4" />
                  <p className="text-slate-500 font-medium text-sm">Nenhuma rota corresponde à sua pesquisa.</p>
                </div>
              ) : (
                categoriesDefinition.map((catDef) => {
                  const routesInCat = groupedRoutes[catDef.name] || [];
                  if (routesInCat.length === 0) return null;

                  return (
                    <div key={catDef.name} className="border border-slate-800/80 rounded-2xl overflow-hidden bg-slate-900/30 backdrop-blur-md shadow-lg">
                      {/* Cabeçalho da Categoria */}
                      <div className={`px-5 py-3.5 flex items-center justify-between border-b ${catDef.headerBg}`}>
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-0.5 text-[9px] font-extrabold uppercase rounded border ${catDef.styleClass}`}>
                            {catDef.label}
                          </span>
                          <span className="text-xs text-slate-400">({routesInCat.length} rotas)</span>
                        </div>
                      </div>

                      {/* Tabela de Rotas */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-[11px]">
                          <thead>
                            <tr className="bg-slate-950/40 text-slate-400 border-b border-slate-900 font-semibold uppercase tracking-wider">
                              <th className="py-2.5 px-4 w-[12%]">Fluxo</th>
                              <th className="py-2.5 px-4 w-[28%]">Nome do Fluxo</th>
                              <th className="py-2.5 px-4 w-[30%]">URL WTA (ERP)</th>
                              <th className="py-2.5 px-4 w-[18%]">Projeto WTA</th>
                              <th className="py-2.5 px-4 w-[12%]">Direção</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-900/40">
                            {routesInCat.map((route) => (
                              <tr key={route.id} className="hover:bg-slate-900/20 transition-colors">
                                <td className="py-3 px-4 font-bold text-white text-[12px]">{route.fluxo}</td>
                                <td className="py-3 px-4 font-medium text-slate-200">{route.nome}</td>
                                <td className="py-3 px-4 font-mono text-slate-400">{route.urlWta || '—'}</td>
                                <td className="py-3 px-4">
                                  {route.projetoWta ? (
                                    <span className="px-1.5 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/10 rounded font-semibold text-[10px]">
                                      {route.projetoWta}
                                    </span>
                                  ) : (
                                    <span className="text-slate-600">—</span>
                                  )}
                                </td>
                                <td className="py-3 px-4">{getDirectionBadge(route.direcao)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 3: AGENDAMENTOS & PROJETOS */}
          {activeTab === 'operations' && (
            <div className="space-y-6">
              
              {/* Gráfico Gantt de Agendamentos */}
              <BentoCard title="Ciclos de Agendamento do Motor WSH" subtitle="Cronograma de execução das rotas" icon={Calendar}>
                <div className="pt-2">
                  <Mermaid chart={diagramsCode.gantt} />
                </div>
              </BentoCard>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Tabela de Agendamentos */}
                <BentoCard title="Configuração de Agendamentos" subtitle="Frequências de polling" icon={Calendar}>
                  <div className="overflow-x-auto border border-slate-900 rounded-xl">
                    <table className="w-full text-left border-collapse text-[11px]">
                      <thead>
                        <tr className="bg-slate-950/80 text-slate-400 border-b border-slate-900 font-semibold uppercase tracking-wider">
                          <th className="py-2.5 px-4">Agendamento</th>
                          <th className="py-2.5 px-4">Fluxo</th>
                          <th className="py-2.5 px-4">Intervalo</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/40">
                        {agendamentos.map((ag, i) => (
                          <tr key={i} className="hover:bg-slate-900/20 transition-colors">
                            <td className="py-3 px-4 font-bold text-white">{ag.name}</td>
                            <td className="py-3 px-4 font-mono text-indigo-400">{ag.fluxo}</td>
                            <td className="py-3 px-4 text-slate-300">{ag.intervalo}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </BentoCard>

                {/* Tabela de Projetos WTA */}
                <BentoCard title="Mapeamento de Projetos WTA" subtitle="Projetos por domínio de negócio" icon={Database}>
                  <div className="overflow-x-auto border border-slate-900 rounded-xl">
                    <table className="w-full text-left border-collapse text-[11px]">
                      <thead>
                        <tr className="bg-slate-950/80 text-slate-400 border-b border-slate-900 font-semibold uppercase tracking-wider">
                          <th className="py-2.5 px-4">Projeto WTA</th>
                          <th className="py-2.5 px-4">Domínio / Regra</th>
                          <th className="py-2.5 px-4">Fluxos</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/40">
                        {projetosWta.map((proj, i) => (
                          <tr key={i} className="hover:bg-slate-900/20 transition-colors">
                            <td className="py-3 px-4">
                              <span className="px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded font-mono font-bold text-[10px]">
                                {proj.name}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-200 font-medium">{proj.domain}</td>
                            <td className="py-3 px-4 text-slate-400 font-mono">{proj.fluxos}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </BentoCard>
              </div>

            </div>
          )}

          {/* TAB 4: JOLT PLAYGROUND */}
          {activeTab === 'jolt' && (
            <div className="space-y-6">
              <BentoCard title="Jolt Transformation Playground" subtitle="Mapeie e transforme estruturas JSON localmente" icon={Terminal}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5 flex justify-between items-center">
                        <span>JSON de Entrada (Payload original)</span>
                        <button
                          type="button"
                          onClick={() => {
                            setJoltInput(JSON.stringify({
                              "pedidoId": "PED-12345",
                              "filial": "01",
                              "cliente": { "codigo": 9998, "nome": "Wanderson Alves" },
                              "itens": [
                                { "produto": "Teclado Mecanico", "qtd": 1, "preco": 350.00 }
                              ],
                              "status": "FATURADO"
                            }, null, 2));
                          }}
                          className="text-[9px] text-indigo-400 hover:underline"
                        >
                          Resetar Exemplo
                        </button>
                      </label>
                      <textarea
                        rows={8}
                        value={joltInput}
                        onChange={(e) => setJoltInput(e.target.value)}
                        className="premium-input font-mono text-xs resize-none bg-slate-950/60"
                        placeholder="Insira o JSON de entrada aqui..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5 flex justify-between items-center">
                        <span>Especificação Jolt (Spec JSON)</span>
                        <button
                          type="button"
                          onClick={() => {
                            setJoltSpec(JSON.stringify([
                              {
                                "operation": "shift",
                                "spec": {
                                  "pedidoId": "order_number",
                                  "cliente": { "nome": "customer_name" },
                                  "status": "order_status"
                                }
                              },
                              {
                                "operation": "default",
                                "spec": { "origin": "FlexiHub" }
                              }
                            ], null, 2));
                          }}
                          className="text-[9px] text-indigo-400 hover:underline"
                        >
                          Carregar Spec Exemplo
                        </button>
                      </label>
                      <textarea
                        rows={8}
                        value={joltSpec}
                        onChange={(e) => setJoltSpec(e.target.value)}
                        className="premium-input font-mono text-xs resize-none bg-slate-950/60"
                        placeholder="Insira o Jolt Spec JSON aqui..."
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleRunJolt}
                      className="btn-primary w-full py-3 text-xs flex items-center justify-center gap-2"
                    >
                      <Sparkles className="h-4 w-4" />
                      <span>Executar Transformação Jolt</span>
                    </button>
                  </div>

                  <div className="flex flex-col h-full space-y-2">
                    <label className="block text-xs font-semibold text-slate-400 mb-0.5">
                      JSON de Saída (Resultado da especificação)
                    </label>
                    <textarea
                      readOnly
                      rows={18}
                      value={joltOutput || "Clique em 'Executar Transformação Jolt' para ver o resultado..."}
                      className={`premium-input font-mono text-xs resize-none h-full min-h-[350px] ${
                        joltOutput.startsWith('Erro:') ? 'border-rose-900/50 text-rose-300 bg-rose-950/5' : 'bg-slate-950/80 text-emerald-400'
                      }`}
                    />
                  </div>
                </div>
              </BentoCard>
            </div>
          )}

        </div>
      ) : (
        <div className="text-center py-20 bg-slate-900/30 border border-slate-800/60 rounded-2xl p-6">
          <GitBranch className="h-12 w-12 text-slate-700 mx-auto mb-4" />
          <p className="text-slate-500 font-medium text-sm">Nenhum workflow configurado. Crie ou importe o primeiro para visualizar.</p>
        </div>
      )}

      {/* MODAL DE CRIAÇÃO / IMPORTAÇÃO */}
      <AnimatePresence>
        {creatorModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
              onClick={() => setCreatorModalOpen(false)}
            />

            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-5xl max-h-[90vh] overflow-y-auto shadow-2xl relative z-10 custom-scrollbar"
            >
              <h3 className="text-xl font-bold text-white mb-2">Criar ou Importar Workflow de Equipe</h3>
              <p className="text-xs text-slate-400 mb-6">Cadastre metadados e defina as rotas colando uma tabela Markdown ou adicionando visualmente.</p>

              <form onSubmit={handleCreateWorkflow} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Nome do Workflow (ex: WSH PDVSYNC)</label>
                    <input
                      type="text"
                      required
                      value={wfName}
                      onChange={(e) => setWfName(e.target.value)}
                      placeholder="Ex: Integração PDVSync"
                      className="premium-input"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Origem (ex: ERP Winthor)</label>
                    <input
                      type="text"
                      required
                      value={systemMaster}
                      onChange={(e) => setSystemMaster(e.target.value)}
                      placeholder="Ex: ERP Winthor"
                      className="premium-input"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Destino (ex: PDVSYNC/PDVOmni)</label>
                    <input
                      type="text"
                      required
                      value={destiny}
                      onChange={(e) => setDestiny(e.target.value)}
                      placeholder="Ex: PDVSYNC / Omni"
                      className="premium-input"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Integradores (separados por vírgula)</label>
                    <input
                      type="text"
                      value={integratorsRaw}
                      onChange={(e) => setIntegratorsRaw(e.target.value)}
                      placeholder="Ex: CH, WSH"
                      className="premium-input"
                    />
                  </div>
                </div>

                {/* Alternância de Modo de Criação */}
                <div className="flex gap-2 mb-6 border-b border-slate-800 pb-2">
                  <button
                    type="button"
                    onClick={() => setCreationMode('markdown')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                      creationMode === 'markdown'
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'bg-slate-950/40 border border-slate-900 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Importação por Markdown
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreationMode('manual')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                      creationMode === 'manual'
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'bg-slate-950/40 border border-slate-900 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Criar Manualmente (Visual)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreationMode('jira')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                      creationMode === 'jira'
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'bg-slate-950/40 border border-slate-900 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Importar XML do Jira
                  </button>
                </div>

                {creationMode === 'markdown' ? (
                  <div className="space-y-4">
                    {/* Modelo de Ajuda */}
                    <div className="p-4 bg-slate-950/60 border border-slate-900 rounded-xl space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-white block">Tabela Modelo Recomendada</span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(
`| Fluxo | Nome | Rota/URL | Projeto | Direção |
|---|---|---|---|---|
| FLUXO-16 | Vendas | /api/v1/pedidos | projeto-integracao | → Destino |
| FLUXO-15 | Movimento Caixas | /api/v1/caixas | projeto-integracao | → Origem |`
                            );
                            addToast('Modelo copiado!', 'success');
                          }}
                          className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors bg-indigo-500/10 border border-indigo-500/10 px-2 py-1 rounded"
                        >
                          Copiar Modelo
                        </button>
                      </div>
                      <pre className="text-[10px] text-slate-400 font-mono overflow-x-auto p-2 bg-slate-900/40 rounded border border-slate-900/60">
{`| Fluxo | Nome | Rota/URL | Projeto | Direção |
|---|---|---|---|---|
| FLUXO-16 | Vendas | /api/v1/pedidos | projeto-integracao | → Destino |
| FLUXO-15 | Movimento Caixas | /api/v1/caixas | projeto-integracao | → Origem |`}
                      </pre>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5 flex items-center gap-1.5">
                        <FileText className="h-4 w-4 text-indigo-400" />
                        <span>Cole a tabela Markdown</span>
                      </label>
                      <textarea
                        rows={8}
                        value={markdownText}
                        onChange={(e) => setMarkdownText(e.target.value)}
                        placeholder="Cole aqui o conteúdo contendo uma tabela Markdown..."
                        className="premium-input font-mono text-xs resize-none bg-slate-950/60"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-1">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold text-white block">Adicionar Rotas Manuais</span>
                      <button
                        type="button"
                        onClick={() => setManualRoutes(prev => [...prev, { fluxo: `FLUXO-${prev.length + 1}`, nome: '', urlWta: '', projetoWta: '', direcao: 'enviar_pdvsync' }])}
                        className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors bg-indigo-500/10 border border-indigo-500/10 px-2 py-1 rounded flex items-center gap-1"
                      >
                        <Plus className="h-3 w-3" />
                        <span>Adicionar Rota</span>
                      </button>
                    </div>

                    {manualRoutes.map((route, idx) => (
                      <div key={idx} className="p-4 bg-slate-950/40 border border-slate-900 rounded-xl space-y-3 relative">
                        <button
                          type="button"
                          onClick={() => setManualRoutes(prev => prev.filter((_, i) => i !== idx))}
                          className="absolute top-2 right-2 text-slate-500 hover:text-rose-400 transition-colors"
                          title="Remover Rota"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-400 mb-1">Identificador (ex: FLUXO-16)</label>
                            <input
                              type="text"
                              required
                              value={route.fluxo}
                              onChange={(e) => setManualRoutes(prev => prev.map((r, i) => i === idx ? { ...r, fluxo: e.target.value.toUpperCase() } : r))}
                              placeholder="FLUXO-16"
                              className="premium-input py-1.5 text-xs bg-slate-950"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-400 mb-1">Nome (ex: Vendas)</label>
                            <input
                              type="text"
                              required
                              value={route.nome}
                              onChange={(e) => setManualRoutes(prev => prev.map((r, i) => i === idx ? { ...r, nome: e.target.value } : r))}
                              placeholder="Vendas"
                              className="premium-input py-1.5 text-xs bg-slate-950"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="md:col-span-2">
                            <label className="block text-[10px] font-semibold text-slate-400 mb-1">URL {systemMaster || 'Origem'} (ex: /v1/pedidos)</label>
                            <input
                              type="text"
                              value={route.urlWta}
                              onChange={(e) => setManualRoutes(prev => prev.map((r, i) => i === idx ? { ...r, urlWta: e.target.value } : r))}
                              placeholder="/v1/pedidos"
                              className="premium-input py-1.5 text-xs bg-slate-950"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-400 mb-1">Projeto {systemMaster || 'Origem'}</label>
                            <input
                              type="text"
                              value={route.projetoWta}
                              onChange={(e) => setManualRoutes(prev => prev.map((r, i) => i === idx ? { ...r, projetoWta: e.target.value } : r))}
                              placeholder="projeto-integracao"
                              className="premium-input py-1.5 text-xs bg-slate-950"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-semibold text-slate-400 mb-1">Direção</label>
                          <select
                            value={route.direcao}
                            onChange={(e) => setManualRoutes(prev => prev.map((r, i) => i === idx ? { ...r, direcao: e.target.value } : r))}
                            className="premium-input py-1.5 text-xs bg-slate-950"
                          >
                            <option value="enviar_pdvsync">→ {destiny || 'Destino'}</option>
                            <option value="enviar_wta">→ {systemMaster || 'Origem'}</option>
                            <option value="monitor">Monitor</option>
                            <option value="online_direto">Online Direto</option>
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setCreatorModalOpen(false)}
                    className="btn-secondary py-2.5 text-xs"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="btn-primary py-2.5 text-xs flex items-center gap-1.5"
                  >
                    {isSaving ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        <span>Criar Workflow</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL DE EDIÇÃO */}
      <AnimatePresence>
        {editModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
              onClick={() => setEditModalOpen(false)}
            />

            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl relative z-10 custom-scrollbar"
            >
              <h3 className="text-xl font-bold text-white mb-2">Editar Metadados do Workflow</h3>
              <p className="text-xs text-slate-400 mb-6">Atualize as informações de identificação do fluxo de integração.</p>

              <form onSubmit={handleEditWorkflow} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Nome do Workflow</label>
                    <input
                      type="text"
                      required
                      value={editWfName}
                      onChange={(e) => setEditWfName(e.target.value)}
                      placeholder="Ex: Integração PDVSync"
                      className="premium-input"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Origem</label>
                    <input
                      type="text"
                      required
                      value={editSystemMaster}
                      onChange={(e) => setEditSystemMaster(e.target.value)}
                      placeholder="Ex: ERP Winthor"
                      className="premium-input"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Destino</label>
                    <input
                      type="text"
                      required
                      value={editDestiny}
                      onChange={(e) => setEditDestiny(e.target.value)}
                      placeholder="Ex: PDVSYNC / Omni"
                      className="premium-input"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Integradores (separados por vírgula)</label>
                    <input
                      type="text"
                      value={editIntegratorsRaw}
                      onChange={(e) => setEditIntegratorsRaw(e.target.value)}
                      placeholder="Ex: CH, WSH"
                      className="premium-input"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setEditModalOpen(false)}
                    className="btn-secondary py-2.5 text-xs"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="btn-primary py-2.5 text-xs flex items-center gap-1.5"
                  >
                    {isSaving ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        <span>Salvar Alterações</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
      <AnimatePresence>
        {deleteConfirmOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
              onClick={() => setDeleteConfirmOpen(false)}
            />

            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-slate-900 border border-rose-900/30 rounded-2xl p-6 w-full max-w-md shadow-2xl relative z-10"
            >
              <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400">
                  <Trash2 className="h-5 w-5" />
                </span>
                <span>Excluir Workflow?</span>
              </h3>
              <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                Tem certeza que deseja excluir o workflow <strong className="text-white">"{workflows.find(w => w.id === selectedWorkflowId)?.name}"</strong>? 
                Esta ação é irreversível e apagará permanentemente o workflow e todas as <strong>{routes.length} rotas</strong> associadas a ele.
              </p>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmOpen(false)}
                  className="btn-secondary py-2 text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleDeleteWorkflow}
                  className="bg-rose-600 hover:bg-rose-500 text-white border border-rose-500/30 px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  {isSaving ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  ) : (
                    <span>Excluir Definitivamente</span>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL DE ADICIONAR ROTA MANUAL ÚNICA */}
      <AnimatePresence>
        {addRouteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
              onClick={() => setAddRouteModalOpen(false)}
            />

            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl relative z-10 custom-scrollbar"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold text-white">Adicionar Rota ao Workflow</h3>
                <button 
                  onClick={() => setAddRouteModalOpen(false)} 
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <p className="text-xs text-slate-400 mb-6">Insira uma rota de API de forma manual para este fluxo de negócio.</p>

              <form onSubmit={handleAddSingleRoute} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Fluxo (ex: FLUXO-16)</label>
                    <input
                      type="text"
                      required
                      value={newRouteFluxo}
                      onChange={(e) => setNewRouteFluxo(e.target.value)}
                      placeholder="FLUXO-16"
                      className="premium-input text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Nome do Fluxo</label>
                    <input
                      type="text"
                      required
                      value={newRouteNome}
                      onChange={(e) => setNewRouteNome(e.target.value)}
                      placeholder="Vendas"
                      className="premium-input text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">URL {selectedWf?.systemMaster || 'Origem'} (API)</label>
                  <input
                    type="text"
                    value={newRouteUrl}
                    onChange={(e) => setNewRouteUrl(e.target.value)}
                    placeholder="/v1/pedidos"
                    className="premium-input text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Projeto {selectedWf?.systemMaster || 'Origem'}</label>
                  <input
                    type="text"
                    value={newRouteProjeto}
                    onChange={(e) => setNewRouteProjeto(e.target.value)}
                    placeholder="projeto-integracao"
                    className="premium-input text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Direção</label>
                  <select
                    value={newRouteDirecao}
                    onChange={(e) => setNewRouteDirecao(e.target.value)}
                    className="premium-input bg-slate-950 text-xs"
                  >
                    <option value="enviar_pdvsync">→ {selectedWf?.destiny || 'Destino'}</option>
                    <option value="enviar_wta">→ {selectedWf?.systemMaster || 'Origem'}</option>
                    <option value="monitor">Monitor</option>
                    <option value="online_direto">Online Direto</option>
                  </select>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setAddRouteModalOpen(false)}
                    className="btn-secondary py-2 text-xs"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="btn-primary py-2 text-xs"
                  >
                    {isSaving ? 'Salvando...' : 'Adicionar Rota'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Workflows;
