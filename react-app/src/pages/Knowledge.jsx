import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  listenKnowledgeDocs, 
  addKnowledgeDoc, 
  updateKnowledgeDoc, 
  deleteKnowledgeDoc, 
  importTdnPageToKnowledge 
} from '../services/firestore';
import BentoCard from '../components/BentoCard';
import { 
  BookOpen, 
  Search, 
  Plus, 
  Star, 
  Folder, 
  FileText, 
  ExternalLink, 
  Trash2, 
  Pencil, 
  Sparkles, 
  Check, 
  X,
  Layers,
  ChevronRight,
  Database,
  CloudDownload,
  Terminal
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../context/ToastContext';

const INITIAL_SEED_DOCS = [
  {
    title: "9826 - Checklist de Cadastros",
    category: "Cadastros",
    sourceUrl: "https://tdn.totvs.com/display/DGP/9826+-+Checklist+de+Cadastros",
    content: "Documentação do checklist de cadastros para integrações no Mississauga Winthor. Esta API valida os campos obrigatórios em cadastros de clientes, filiais e parâmetros de tributação antes do envio ao PDVSync.",
    tags: ["cadastro", "checklist", "validação"]
  },
  {
    title: "APIs Integrações - Cobranças e Planos de Pagamento",
    category: "Financeiro",
    sourceUrl: "https://tdn.totvs.com/pages/viewpage.action?pageId=886637300",
    content: "Serviço responsável por sincronizar formas de pagamento, planos de parcelamento e cobranças ativas no ERP Winthor. Permite que o PDVSync consulte taxas e condições financeiras atualizadas.",
    tags: ["pagamento", "cobrança", "plano"]
  },
  {
    title: "APIs Integrações - Estoque Disponível - PDVSync (ONLINE)",
    category: "Estoque",
    sourceUrl: "https://tdn.totvs.com/pages/viewpage.action?pageId=846869235",
    content: "API de consulta em tempo real de saldo de estoque. Utilizada pelo PDVSync para validar estoque de segurança e disponibilidade imediata de itens transacionais na filial.",
    tags: ["estoque", "saldo", "online"]
  },
  {
    title: "APIs Integrações - Preço com politica de desconto 561 e preço fixo 357 (/discount-policy)",
    category: "Comercial / Preços",
    sourceUrl: "https://tdn.totvs.com/pages/viewpage.action?pageId=846870113",
    content: "Serviço que retorna a política de desconto comercial 561 e regras de preço fixo 357 do ERP Winthor. A rota /discount-policy calcula o preço final do produto aplicando os descontos concedidos à filial ou região.",
    tags: ["preço", "desconto", "comercial", "politica"]
  },
  {
    title: "APIs Integrações - Tributação ICMS/Substituição tributária/FCP",
    category: "Fiscal / Tributário",
    sourceUrl: "https://tdn.totvs.com/pages/viewpage.action?pageId=846870160",
    content: "Mapeamento fiscal completo para cálculo de impostos estaduais, substituição tributária (ST) e Fundo de Combate à Pobreza (FCP). Retorna alíquotas baseadas na origem/destino do produto.",
    tags: ["fiscal", "tributação", "icms", "imposto"]
  },
  {
    title: "APIs Integrações - Cancelar pedido PDVSync - INTERNA",
    category: "Transacional / Vendas",
    sourceUrl: "https://tdn.totvs.com/pages/viewpage.action?pageId=845773471",
    content: "API interna para realizar o cancelamento de pedidos originados no PDVSync. Realiza o estorno de saldo reservado no Winthor e atualiza o status de venda no ERP Mississauga.",
    tags: ["cancelamento", "pedido", "vendas"]
  }
];

const Knowledge = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  
  const [docs, setDocs] = useState([]);
  const [selectedDocId, setSelectedDocId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('Todas');
  
  // Favoritos
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('kb_favorites_flexihub');
    return saved ? JSON.parse(saved) : [];
  });

  // Modais
  const [creatorModalOpen, setCreatorModalOpen] = useState(false);
  const [editorModalOpen, setEditorModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form Fields
  const [docTitle, setDocTitle] = useState('');
  const [docCategory, setDocCategory] = useState('');
  const [docContent, setDocContent] = useState('');
  const [docTagsRaw, setDocTagsRaw] = useState('');
  const [docSourceUrl, setDocSourceUrl] = useState('');

  // Import Fields
  const [importPageId, setImportPageId] = useState('');
  const [importCategory, setImportCategory] = useState('Importado / TDN');

  useEffect(() => {
    localStorage.setItem('kb_favorites_flexihub', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    if (!user?.teamId) return;
    const unsub = listenKnowledgeDocs(user.teamId, setDocs);
    return () => unsub();
  }, [user?.teamId]);

  // Selecionar documento padrão ao carregar
  useEffect(() => {
    if (docs.length > 0 && !selectedDocId) {
      setSelectedDocId(docs[0].id);
    }
  }, [docs, selectedDocId]);

  const toggleFavorite = (id) => {
    setFavorites(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
    addToast(favorites.includes(id) ? 'Removido dos favoritos.' : 'Adicionado aos favoritos!', 'success');
  };

  const selectedDoc = useMemo(() => {
    return docs.find(d => d.id === selectedDocId) || null;
  }, [docs, selectedDocId]);

  // Lista dinâmica de Categorias
  const categories = useMemo(() => {
    const cats = new Set();
    cats.add('Todas');
    docs.forEach(d => {
      if (d.category) cats.add(d.category);
    });
    return Array.from(cats);
  }, [docs]);

  // Filtro Inteligente e Busca Completa (Título + Conteúdo)
  const filteredDocs = useMemo(() => {
    let result = docs;
    if (activeCategory !== 'Todas') {
      result = result.filter(d => d.category === activeCategory);
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      result = result.filter(d => 
        (d.title || '').toLowerCase().includes(q) ||
        (d.content || '').toLowerCase().includes(q) ||
        (d.category || '').toLowerCase().includes(q) ||
        (d.tags || []).some(t => t.toLowerCase().includes(q))
      );
    }
    return result;
  }, [docs, activeCategory, searchTerm]);

  // Realizar Carga Inicial Automática (Seed)
  const handleSeedDocs = async () => {
    setIsSaving(true);
    try {
      let count = 0;
      for (const item of INITIAL_SEED_DOCS) {
        // Evita duplicados comparando títulos
        const exists = docs.some(d => d.title === item.title);
        if (!exists) {
          await addKnowledgeDoc(item, user);
          count++;
        }
      }
      addToast(`${count} documentos de API Mississauga importados!`, 'success');
    } catch(err) {
      console.error(err);
      addToast('Erro ao importar carga de dados.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Criar Documento Manualmente
  const handleCreateDoc = async (e) => {
    e.preventDefault();
    if (!docTitle.trim() || !docContent.trim() || !docCategory.trim()) return;
    setIsSaving(true);
    try {
      const tags = docTagsRaw ? docTagsRaw.split(',').map(t => t.trim().toLowerCase()).filter(t => t.length > 0) : [];
      const newDoc = await addKnowledgeDoc({
        title: docTitle.trim(),
        content: docContent.trim(),
        category: docCategory.trim(),
        tags,
        sourceUrl: docSourceUrl.trim()
      }, user);
      
      addToast('Documento publicado!', 'success');
      setDocTitle('');
      setDocCategory('');
      setDocContent('');
      setDocTagsRaw('');
      setDocSourceUrl('');
      setCreatorModalOpen(false);
      if (newDoc) setSelectedDocId(newDoc.id);
    } catch (err) {
      console.error(err);
      addToast('Erro ao criar documento.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Abrir Modal de Edição
  const handleOpenEditModal = () => {
    if (!selectedDoc) return;
    setDocTitle(selectedDoc.title || '');
    setDocCategory(selectedDoc.category || '');
    setDocContent(selectedDoc.content || '');
    setDocTagsRaw(selectedDoc.tags ? selectedDoc.tags.join(', ') : '');
    setDocSourceUrl(selectedDoc.sourceUrl || '');
    setEditorModalOpen(true);
  };

  // Salvar Edição
  const handleEditDoc = async (e) => {
    e.preventDefault();
    if (!selectedDocId || !docTitle.trim() || !docContent.trim() || !docCategory.trim()) return;
    setIsSaving(true);
    try {
      const tags = docTagsRaw ? docTagsRaw.split(',').map(t => t.trim().toLowerCase()).filter(t => t.length > 0) : [];
      await updateKnowledgeDoc(selectedDocId, {
        title: docTitle.trim(),
        content: docContent.trim(),
        category: docCategory.trim(),
        tags,
        sourceUrl: docSourceUrl.trim()
      }, user);
      
      addToast('Documento atualizado!', 'success');
      setEditorModalOpen(false);
    } catch (err) {
      console.error(err);
      addToast('Erro ao atualizar documento.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Excluir Documento
  const handleDeleteDoc = async () => {
    if (!selectedDocId) return;
    setIsSaving(true);
    try {
      await deleteKnowledgeDoc(selectedDocId, user, selectedDoc?.title);
      addToast('Documento excluído!', 'success');
      setSelectedDocId('');
      setDeleteConfirmOpen(false);
    } catch (err) {
      console.error(err);
      addToast('Erro ao excluir documento.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Importar da API do Confluence/TDN
  const handleImportTdn = async (e) => {
    e.preventDefault();
    if (!importPageId.trim()) return;
    
    // Verifica credenciais salvas no perfil do usuário
    if (!user?.tdnUrl || !user?.tdnToken) {
      addToast('Configure a URL e o Token do TDN no seu Perfil antes de importar.', 'error');
      setImportModalOpen(false);
      return;
    }

    setIsSaving(true);
    try {
      const newDoc = await importTdnPageToKnowledge(
        user.tdnUrl,
        user.tdnToken,
        importPageId.trim(),
        user,
        importCategory.trim()
      );
      addToast('Página importada com sucesso do TDN!', 'success');
      setImportPageId('');
      setImportModalOpen(false);
      if (newDoc) setSelectedDocId(newDoc.id);
    } catch(err) {
      console.error(err);
      addToast(err.message || 'Erro ao importar do TDN.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER DA BASE */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Base de Conhecimento</h1>
          <p className="text-sm text-slate-400">Ativos técnicos de APIs, rotas e documentações Mississauga indexadas e pesquisáveis.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto w-full md:w-auto">
          {docs.length === 0 && (
            <button
              onClick={handleSeedDocs}
              className="btn-secondary py-2 px-3 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 w-full sm:w-auto hover:border-indigo-500/50"
            >
              <CloudDownload className="h-3.5 w-3.5 text-indigo-400" />
              <span>Carga Inicial (anexos)</span>
            </button>
          )}
          <button
            onClick={() => setImportModalOpen(true)}
            className="btn-secondary py-2 px-3 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 w-full sm:w-auto"
          >
            <Terminal className="h-3.5 w-3.5 text-indigo-400" />
            <span>Importar TDN</span>
          </button>
          <button
            onClick={() => setCreatorModalOpen(true)}
            className="btn-primary py-2 px-4 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 w-full sm:w-auto"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Novo Artigo</span>
          </button>
        </div>
      </div>

      {/* Wiki Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* SIDEBAR DE DOCUMENTOS E NAVEGAÇÃO */}
        <div className="lg:col-span-1 space-y-4">
          
          {/* BUSCA TEXTUAL INTEGRA */}
          <div className="relative">
            <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar em todo o texto..."
              className="premium-input pl-10 text-xs py-3"
            />
          </div>

          {/* LISTA DE CATEGORIAS */}
          <div className="flex flex-wrap gap-1">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all border ${
                  activeCategory === cat 
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-md' 
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* LISTA DE DOCUMENTOS */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
            
            {/* FAVORITOS */}
            {favorites.length > 0 && docs.some(d => favorites.includes(d.id)) && (
              <div className="space-y-1.5">
                <span className="text-[9px] font-black uppercase tracking-widest text-indigo-400 block px-1 flex items-center gap-1">
                  <Star className="h-3 w-3 fill-indigo-400" /> Favoritos
                </span>
                <div className="space-y-1">
                  {docs.filter(d => favorites.includes(d.id)).map(docItem => (
                    <button
                      key={docItem.id}
                      onClick={() => setSelectedDocId(docItem.id)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-all flex items-center gap-2 ${
                        selectedDocId === docItem.id 
                          ? 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-bold' 
                          : 'text-slate-400 hover:bg-slate-950/40 hover:text-slate-200'
                      }`}
                    >
                      <FileText className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{docItem.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ARTIGOS GERAIS */}
            <div className="space-y-1.5">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 block px-1 flex items-center gap-1">
                <Folder className="h-3 w-3" /> Artigos
              </span>
              <div className="space-y-1">
                {filteredDocs.length === 0 ? (
                  <p className="text-[10px] text-slate-500 text-center py-4">Nenhum artigo encontrado.</p>
                ) : (
                  filteredDocs.map(docItem => (
                    <button
                      key={docItem.id}
                      onClick={() => setSelectedDocId(docItem.id)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-all flex items-center gap-2 ${
                        selectedDocId === docItem.id 
                          ? 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-bold' 
                          : 'text-slate-400 hover:bg-slate-950/40 hover:text-slate-200'
                      }`}
                    >
                      <FileText className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{docItem.title}</span>
                    </button>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>

        {/* PAINEL CENTRAL DE VISUALIZAÇÃO DO DOCUMENTO */}
        <div className="lg:col-span-3">
          {selectedDoc ? (
            <BentoCard 
              title={selectedDoc.title} 
              subtitle={selectedDoc.category || 'Documento Técnico'} 
              icon={BookOpen}
            >
              <div className="space-y-5 pt-2">
                
                {/* Metadados e Ações */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-[9px] font-bold uppercase tracking-wider bg-slate-950 border border-slate-800 px-2 py-0.5 rounded text-slate-400">
                      Pasta: {selectedDoc.category || 'Geral'}
                    </span>
                    {(selectedDoc.tags || []).map((t, idx) => (
                      <span key={idx} className="text-[9px] font-bold uppercase tracking-wider bg-indigo-500/5 text-indigo-400 border border-indigo-500/10 px-2 py-0.5 rounded">
                        #{t}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleFavorite(selectedDoc.id)}
                      className="p-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-all"
                      title={favorites.includes(selectedDoc.id) ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                    >
                      <Star className={`h-4 w-4 ${favorites.includes(selectedDoc.id) ? 'fill-indigo-400 text-indigo-400' : ''}`} />
                    </button>
                    {selectedDoc.sourceUrl && (
                      <a
                        href={selectedDoc.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-all flex items-center gap-1.5"
                        title="Ver Documento Original no TDN"
                      >
                        <ExternalLink className="h-4 w-4" />
                        <span className="text-[10px] font-bold hidden sm:inline">TDN</span>
                      </a>
                    )}
                    <button
                      onClick={handleOpenEditModal}
                      className="p-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-all"
                      title="Editar Documento"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmOpen(true)}
                      className="p-2 bg-slate-950 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-900/55 rounded-xl text-slate-400 hover:text-rose-400 transition-all"
                      title="Excluir Documento"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Conteúdo Textual com formatação legível */}
                <div className="pt-2 leading-relaxed text-slate-300 text-sm whitespace-pre-wrap font-medium">
                  {selectedDoc.content || 'Este documento não possui conteúdo cadastrado.'}
                </div>

                {selectedDoc.sourceUrl && (
                  <div className="pt-4 border-t border-slate-800/50 flex items-center justify-between text-[10px] text-slate-500">
                    <span>Sincronizado por {selectedDoc.author || 'Membro do Time'}</span>
                    <span>Modificado em {selectedDoc.updatedAt?.seconds ? new Date(selectedDoc.updatedAt.seconds * 1000).toLocaleDateString() : new Date(selectedDoc.updatedAt).toLocaleDateString()}</span>
                  </div>
                )}

              </div>
            </BentoCard>
          ) : (
            <div className="text-center py-20 bg-slate-900/30 border border-slate-800/60 rounded-2xl p-6">
              <BookOpen className="h-12 w-12 text-slate-700 mx-auto mb-4" />
              <p className="text-slate-500 font-medium text-sm">Selecione ou crie um documento para iniciar a navegação na base de conhecimento.</p>
            </div>
          )}
        </div>

      </div>

      {/* MODAL DE CRIAÇÃO MANUAL */}
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
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-4xl shadow-2xl relative z-10 max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              <h3 className="text-xl font-bold text-white mb-2">Criar Artigo na Base</h3>
              <p className="text-xs text-slate-400 mb-6">Mapeie artigos e boas práticas técnicas para a equipe Mississauga.</p>

              <form onSubmit={handleCreateDoc} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Título do Documento</label>
                    <input
                      type="text"
                      required
                      value={docTitle}
                      onChange={(e) => setDocTitle(e.target.value)}
                      placeholder="Ex: API de Desconto 561"
                      className="premium-input"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Categoria / Pasta</label>
                    <input
                      type="text"
                      required
                      value={docCategory}
                      onChange={(e) => setDocCategory(e.target.value)}
                      placeholder="Ex: Preços e Políticas"
                      className="premium-input"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Link de Origem (TDN/Confluence - Opcional)</label>
                  <input
                    type="url"
                    value={docSourceUrl}
                    onChange={(e) => setDocSourceUrl(e.target.value)}
                    placeholder="https://tdn.totvs.com/..."
                    className="premium-input"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Tags (separadas por vírgula)</label>
                  <input
                    type="text"
                    value={docTagsRaw}
                    onChange={(e) => setDocTagsRaw(e.target.value)}
                    placeholder="Ex: preço, desconto, wta"
                    className="premium-input"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Conteúdo do Artigo</label>
                  <textarea
                    required
                    rows={8}
                    value={docContent}
                    onChange={(e) => setDocContent(e.target.value)}
                    placeholder="Escreva ou cole o conteúdo técnico detalhado..."
                    className="premium-input resize-none font-mono text-xs bg-slate-950/60"
                  />
                </div>

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
                        <span>Publicar Artigo</span>
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
        {editorModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
              onClick={() => setEditorModalOpen(false)}
            />

            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-4xl shadow-2xl relative z-10 max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              <h3 className="text-xl font-bold text-white mb-2">Editar Artigo</h3>
              <p className="text-xs text-slate-400 mb-6">Atualize as informações do documento na base de conhecimento.</p>

              <form onSubmit={handleEditDoc} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Título do Documento</label>
                    <input
                      type="text"
                      required
                      value={docTitle}
                      onChange={(e) => setDocTitle(e.target.value)}
                      placeholder="Ex: API de Desconto 561"
                      className="premium-input"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Categoria / Pasta</label>
                    <input
                      type="text"
                      required
                      value={docCategory}
                      onChange={(e) => setDocCategory(e.target.value)}
                      placeholder="Ex: Preços e Políticas"
                      className="premium-input"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Link de Origem (TDN/Confluence - Opcional)</label>
                  <input
                    type="url"
                    value={docSourceUrl}
                    onChange={(e) => setDocSourceUrl(e.target.value)}
                    placeholder="https://tdn.totvs.com/..."
                    className="premium-input"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Tags (separadas por vírgula)</label>
                  <input
                    type="text"
                    value={docTagsRaw}
                    onChange={(e) => setDocTagsRaw(e.target.value)}
                    placeholder="Ex: preço, desconto, wta"
                    className="premium-input"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Conteúdo do Artigo</label>
                  <textarea
                    required
                    rows={8}
                    value={docContent}
                    onChange={(e) => setDocContent(e.target.value)}
                    placeholder="Escreva ou cole o conteúdo técnico detalhado..."
                    className="premium-input resize-none font-mono text-xs bg-slate-950/60"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setEditorModalOpen(false)}
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

      {/* MODAL DE IMPORTAÇÃO TDN */}
      <AnimatePresence>
        {importModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
              onClick={() => setImportModalOpen(false)}
            />

            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl relative z-10"
            >
              <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                <Terminal className="h-5 w-5 text-indigo-400" />
                <span>Importar do TDN Confluence</span>
              </h3>
              <p className="text-xs text-slate-400 mb-6">Insira o ID da página para raspar os dados e convertê-los automaticamente.</p>

              <form onSubmit={handleImportTdn} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Page ID do Confluence (ex: 846870113)</label>
                  <input
                    type="text"
                    required
                    value={importPageId}
                    onChange={(e) => setImportPageId(e.target.value)}
                    placeholder="Ex: 846870113"
                    className="premium-input text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Categoria / Pasta de Destino</label>
                  <input
                    type="text"
                    required
                    value={importCategory}
                    onChange={(e) => setImportCategory(e.target.value)}
                    placeholder="Ex: Importado / TDN"
                    className="premium-input text-xs"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-800/40">
                  <button
                    type="button"
                    onClick={() => setImportModalOpen(false)}
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
                        <span>Conectar &amp; Importar</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CONFIRMAÇÃO DE EXCLUSÃO */}
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
                <Trash2 className="h-5 w-5 text-rose-400" />
                <span>Excluir Documento?</span>
              </h3>
              <p className="text-xs text-slate-400 mb-6">
                Tem certeza que deseja remover o artigo <strong className="text-white">"{selectedDoc?.title}"</strong> permanentemente? Esta ação não pode ser desfeita.
              </p>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmOpen(false)}
                  className="btn-secondary py-2 px-4 text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleDeleteDoc}
                  disabled={isSaving}
                  className="btn-primary py-2 px-4 text-xs bg-rose-600 hover:bg-rose-500 border-none shadow-[0_0_15px_rgba(244,63,94,0.2)]"
                >
                  {isSaving ? "Excluindo..." : "Excluir"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Knowledge;
